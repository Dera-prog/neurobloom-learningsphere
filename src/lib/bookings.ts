import { supabase } from './supabase'

/**
 * Tutoring data access (0010_bookings_tutor_requests.sql). A booking belongs to
 * the account that made it and can only be cancelled; a tutor request is
 * answered by a teacher, and the database stamps who answered and when.
 */

export const bookingsConfigured = Boolean(supabase)

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled'
export type RequestStatus = 'open' | 'accepted' | 'declined'

export interface BookingRecord {
  id: string
  tutorName: string
  tutorEmoji: string
  subject: string
  when: string
  rate: number
  audience: 'senior' | 'parent'
  childId: string | null
  notes: string
  status: BookingStatus
  createdAt: string
}

export interface TutorRequestRecord {
  id: string
  studentId: string
  studentName: string
  level: string
  topic: string
  rate: number
  specialist: boolean
  preferredTime: string
  status: RequestStatus
  acceptedByName: string
  acceptedAt: string | null
  createdAt: string
}

interface BookingRow {
  id: string
  tutor_name: string
  tutor_emoji: string
  subject: string
  slot: string
  rate: number
  audience: 'senior' | 'parent'
  child_id: string | null
  notes: string
  status: BookingStatus
  created_at: string
}

interface RequestRow {
  id: string
  student_id: string
  student_name: string
  level: string
  topic: string
  rate: number
  specialist: boolean
  preferred_time: string
  status: RequestStatus
  accepted_by_name: string
  accepted_at: string | null
  created_at: string
}

const BOOKING_COLUMNS =
  'id,tutor_name,tutor_emoji,subject,slot,rate,audience,child_id,notes,status,created_at'
const REQUEST_COLUMNS =
  'id,student_id,student_name,level,topic,rate,specialist,preferred_time,status,accepted_by_name,accepted_at,created_at'

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'The tutoring tables are unavailable.'
}

function mapBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    tutorName: row.tutor_name,
    tutorEmoji: row.tutor_emoji,
    subject: row.subject,
    when: row.slot,
    rate: row.rate,
    audience: row.audience,
    childId: row.child_id,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapRequest(row: RequestRow): TutorRequestRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || 'Learner',
    level: row.level,
    topic: row.topic,
    rate: row.rate,
    specialist: row.specialist,
    preferredTime: row.preferred_time,
    status: row.status,
    acceptedByName: row.accepted_by_name,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }
}

/** The signed-in learner's bookings. Null means the table is unreachable. */
export async function loadMyBookings(userId: string): Promise<BookingRecord[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as BookingRow[]).map(mapBooking)
  } catch (error) {
    console.warn('[bookings] own bookings unavailable:', messageOf(error))
    return null
  }
}

export async function createBooking(input: {
  tutorName: string
  tutorEmoji: string
  subject: string
  when: string
  rate: number
  audience: 'senior' | 'parent'
  notes?: string
  childId?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      tutor_name: input.tutorName,
      tutor_emoji: input.tutorEmoji,
      subject: input.subject,
      slot: input.when,
      rate: input.rate,
      audience: input.audience,
      notes: input.notes ?? '',
      child_id: input.childId ?? null,
    })
    .select('id')
  if (error) return { ok: false, error: error.message }
  if (!data || !(data as unknown[]).length) return { ok: false, error: 'The booking was not saved.' }
  return { ok: true }
}

/** Cancels one of the caller's upcoming bookings. */
export async function cancelBooking(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select('id,status')
  if (error) return { ok: false, error: error.message }
  if (!data || !(data as unknown[]).length) return { ok: false, error: 'Only the learner who booked can cancel it.' }
  return { ok: true }
}

/** The learner's own tutor requests, with whatever answer they have. */
export async function loadMyRequests(userId: string): Promise<TutorRequestRecord[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('tutor_requests')
      .select(REQUEST_COLUMNS)
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as RequestRow[]).map(mapRequest)
  } catch (error) {
    console.warn('[bookings] own requests unavailable:', messageOf(error))
    return null
  }
}

export async function createTutorRequest(input: {
  level: string
  topic: string
  rate: number
  specialist: boolean
  preferredTime: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }

  const { data, error } = await supabase
    .from('tutor_requests')
    .insert({
      level: input.level,
      topic: input.topic.trim(),
      rate: input.rate,
      specialist: input.specialist,
      preferred_time: input.preferredTime,
    })
    .select('id')
  if (error) return { ok: false, error: error.message }
  if (!data || !(data as unknown[]).length) return { ok: false, error: 'The request was not saved.' }
  return { ok: true }
}

/** Every request a teacher may answer. Null means the table is unreachable. */
export async function loadOpenRequests(): Promise<TutorRequestRecord[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('tutor_requests')
      .select(REQUEST_COLUMNS)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as RequestRow[]).map(mapRequest)
  } catch (error) {
    console.warn('[bookings] open requests unavailable:', messageOf(error))
    return null
  }
}

/** Requests this teacher has accepted: their tutoring calendar. */
export async function loadAcceptedSessions(userId: string): Promise<TutorRequestRecord[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('tutor_requests')
      .select(REQUEST_COLUMNS)
      .eq('accepted_by', userId)
      .eq('status', 'accepted')
      .order('accepted_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as RequestRow[]).map(mapRequest)
  } catch (error) {
    console.warn('[bookings] accepted sessions unavailable:', messageOf(error))
    return null
  }
}

export async function respondToRequest(
  requestId: string,
  decision: 'accepted' | 'declined',
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const { data, error } = await supabase
    .from('tutor_requests')
    .update({ status: decision })
    .eq('id', requestId)
    .select('id,status')
  if (error) return { ok: false, error: error.message }
  if (!data || !(data as unknown[]).length) {
    return { ok: false, error: 'This request is no longer open.' }
  }
  return { ok: true }
}
