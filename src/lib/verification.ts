import { supabase } from './supabase'

/**
 * Teacher verification data access (0009_teacher_verification.sql). Documents
 * live in the private `teacher-verification` bucket; the database decides that
 * a teacher can only submit and an admin can only approve or reject.
 */

export const verificationConfigured = Boolean(supabase)

export const VERIFICATION_BUCKET = 'teacher-verification'
export const DOC_TYPES = ['Identity', 'Qualification', 'Safeguarding', 'Other'] as const
export const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg']

export type DocStatus = 'pending' | 'approved' | 'rejected'
export type VerificationStatus = 'none' | DocStatus

export interface VerificationDoc {
  id: string
  name: string
  type: string
  status: DocStatus
  added: string
  storagePath: string
}

export interface MyVerification {
  id: string | null
  status: VerificationStatus
  note: string
  reviewNote: string
  submittedAt: string | null
  reviewedAt: string | null
  docs: VerificationDoc[]
}

export interface QueueEntry {
  id: string
  teacherId: string
  teacherName: string
  teacherEmail: string
  status: DocStatus
  note: string
  reviewNote: string
  submittedAt: string
  reviewedAt: string | null
  docs: VerificationDoc[]
}

interface VerificationRow {
  id: string
  teacher_id: string
  teacher_name: string
  teacher_email: string
  status: DocStatus
  note: string
  review_note: string
  submitted_at: string
  reviewed_at: string | null
}

interface DocumentRow {
  id: string
  verification_id: string
  name: string
  doc_type: string
  status: DocStatus
  storage_path: string
  created_at: string
}

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'The verification tables are unavailable.'
}

function addedLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function mapDoc(row: DocumentRow): VerificationDoc {
  return {
    id: row.id,
    name: row.name,
    type: row.doc_type,
    status: row.status,
    added: addedLabel(row.created_at),
    storagePath: row.storage_path,
  }
}

function mapRow(row: VerificationRow, docs: VerificationDoc[], status: VerificationStatus): MyVerification {
  return {
    id: row.id,
    status,
    note: row.note,
    reviewNote: row.review_note,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    docs,
  }
}

/**
 * The signed-in teacher's application. Null means the tables are unreachable
 * (or Supabase is not configured), so the caller keeps its sample data; a
 * reachable database with no row returns the honest "nothing submitted" state.
 */
export async function loadMyVerification(userId: string): Promise<MyVerification | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const { data, error } = await client
      .from('teacher_verifications')
      .select('id,teacher_id,teacher_name,teacher_email,status,note,review_note,submitted_at,reviewed_at')
      .eq('teacher_id', userId)
      .maybeSingle()
    if (error) throw error

    const row = data as VerificationRow | null
    if (!row) {
      return { id: null, status: 'none', note: '', reviewNote: '', submittedAt: null, reviewedAt: null, docs: [] }
    }

    const { data: docRows, error: docError } = await client
      .from('teacher_verification_documents')
      .select('id,verification_id,name,doc_type,status,storage_path,created_at')
      .eq('verification_id', row.id)
      .order('created_at', { ascending: false })
    if (docError) throw docError

    return mapRow(row, ((docRows ?? []) as DocumentRow[]).map(mapDoc), row.status)
  } catch (error) {
    console.warn('[verification] own submission unavailable:', messageOf(error))
    return null
  }
}

function safeFileName(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'document'
}

/** Uploads one file and records it against the teacher's application. */
export async function uploadVerificationDocument(input: {
  userId: string
  file: File
  type: string
  name?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const { file, userId } = input

  if (!ALLOWED_MIME.includes(file.type)) {
    return { ok: false, error: 'Upload a PDF, PNG or JPEG file.' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: 'Keep each file under 10 MB.' }
  }

  const displayName = (input.name ?? '').trim() || file.name || 'Document'
  const path = `${userId}/${Date.now()}-${safeFileName(file.name || displayName)}`

  const { error: uploadError } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) {
    return { ok: false, error: uploadError.message }
  }

  const { error: rowError } = await supabase.from('teacher_verifications').upsert(
    { teacher_id: userId, status: 'pending' },
    { onConflict: 'teacher_id' },
  )
  if (rowError) return { ok: false, error: rowError.message }

  const { data, error: findError } = await supabase
    .from('teacher_verifications')
    .select('id')
    .eq('teacher_id', userId)
    .maybeSingle()
  if (findError) return { ok: false, error: findError.message }
  const verificationId = (data as { id: string } | null)?.id
  if (!verificationId) return { ok: false, error: 'Could not open your verification record.' }

  const { error: docError } = await supabase.from('teacher_verification_documents').insert({
    verification_id: verificationId,
    name: displayName,
    doc_type: input.type,
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
  })
  if (docError) return { ok: false, error: docError.message }

  return { ok: true }
}

/** Every application, newest first. Null means the tables are unreachable. */
export async function loadVerificationQueue(): Promise<QueueEntry[] | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const { data, error } = await client
      .from('teacher_verifications')
      .select('id,teacher_id,teacher_name,teacher_email,status,note,review_note,submitted_at,reviewed_at')
      .order('submitted_at', { ascending: false })
    if (error) throw error

    const rows = (data ?? []) as VerificationRow[]
    if (!rows.length) return []

    const { data: docRows, error: docError } = await client
      .from('teacher_verification_documents')
      .select('id,verification_id,name,doc_type,status,storage_path,created_at')
      .in(
        'verification_id',
        rows.map((row) => row.id),
      )
      .order('created_at', { ascending: false })
    if (docError) throw docError

    const docsByVerification = new Map<string, VerificationDoc[]>()
    for (const row of (docRows ?? []) as DocumentRow[]) {
      const list = docsByVerification.get(row.verification_id) ?? []
      list.push(mapDoc(row))
      docsByVerification.set(row.verification_id, list)
    }

    return rows.map((row) => ({
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name || 'Teacher',
      teacherEmail: row.teacher_email,
      status: row.status,
      note: row.note,
      reviewNote: row.review_note,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      docs: docsByVerification.get(row.id) ?? [],
    }))
  } catch (error) {
    console.warn('[verification] review queue unavailable:', messageOf(error))
    return null
  }
}

/** Approves or rejects one application. The trigger fills the review stamps. */
export async function reviewVerification(
  verificationId: string,
  decision: 'approved' | 'rejected',
  reviewNote: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }

  const { data, error } = await supabase
    .from('teacher_verifications')
    .update({ status: decision, review_note: reviewNote.trim() })
    .eq('id', verificationId)
    .select('id,status')
  if (error) return { ok: false, error: error.message }
  if (!data || !(data as unknown[]).length) {
    return { ok: false, error: 'Only an administrator can review a verification.' }
  }
  return { ok: true }
}

/** A short-lived link to one private document (owner or admin only). */
export async function verificationFileUrl(path: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.storage.from(VERIFICATION_BUCKET).createSignedUrl(path, 3600)
  if (error) return null
  return data?.signedUrl ?? null
}
