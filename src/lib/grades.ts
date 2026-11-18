import { supabase } from './supabase'

/**
 * Grade data access. Grades live on the submissions row and are written by the
 * class teacher; the browser can read them but cannot award them.
 */

export const gradesConfigured = Boolean(supabase)

export interface ChildGrade {
  code: string
  subject: string
  grade: string
  teacher: string
  score: number
}

/** WAEC-style bands, because this is a Nigerian secondary curriculum. */
export function letterGrade(percent: number): string {
  const score = Math.max(0, Math.min(100, Math.round(percent)))
  if (score >= 75) return 'A1'
  if (score >= 70) return 'B2'
  if (score >= 65) return 'B3'
  if (score >= 60) return 'C4'
  if (score >= 55) return 'C5'
  if (score >= 50) return 'C6'
  if (score >= 45) return 'D7'
  if (score >= 40) return 'E8'
  return 'F9'
}

function subjectCode(subject: string) {
  return subject.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'SUB'
}

interface ChildRow {
  id: string
}

interface GradeEnrollmentRow {
  class_id: string
  classes:
    | { subject: string; teacher_name: string }
    | { subject: string; teacher_name: string }[]
    | null
}

interface GradeAssignmentRow {
  id: string
  class_id: string
  subject: string
  points: number
}

interface GradeSubmissionRow {
  assignment_id: string
  score: number | null
  graded_at: string | null
}

function classOf(row: GradeEnrollmentRow) {
  return Array.isArray(row.classes) ? row.classes[0] ?? null : row.classes
}

/**
 * The latest graded work per subject for one child. Returns null when the
 * tables are unreachable so the caller can fall back to sample content.
 */
export async function loadChildGrades(input: {
  guardianId: string
  childName: string
}): Promise<ChildGrade[] | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const { data: childRow, error: childError } = await client
      .from('children')
      .select('id')
      .eq('guardian_id', input.guardianId)
      .eq('full_name', input.childName)
      .limit(1)
      .maybeSingle()
    if (childError) throw childError
    // No row yet means the tables simply have nothing for this learner; the
    // caller's sample profile is still the honest thing to show.
    if (!childRow) return null
    const childId = (childRow as ChildRow).id

    const { data: enrollmentRows, error: enrollmentError } = await client
      .from('enrollments')
      .select('class_id, classes(subject, teacher_name)')
      .eq('child_id', childId)
    if (enrollmentError) throw enrollmentError

    const enrollments = (enrollmentRows ?? []) as GradeEnrollmentRow[]
    const classIds = [...new Set(enrollments.map((row) => row.class_id))]
    if (!classIds.length) return []

    const classSubject = new Map<string, string>()
    const classTeacher = new Map<string, string>()
    for (const row of enrollments) {
      const klass = classOf(row)
      if (!klass) continue
      classSubject.set(row.class_id, klass.subject)
      classTeacher.set(row.class_id, klass.teacher_name)
    }

    const { data: assignmentRows, error: assignmentError } = await client
      .from('assignments')
      .select('id,class_id,subject,points')
      .in('class_id', classIds)
    if (assignmentError) throw assignmentError

    const { data: submissionRows, error: submissionError } = await client
      .from('submissions')
      .select('assignment_id,score,graded_at')
      .eq('child_id', childId)
      .eq('status', 'graded')
    if (submissionError) throw submissionError

    const assignmentById = new Map<string, GradeAssignmentRow>(
      ((assignmentRows ?? []) as GradeAssignmentRow[]).map((row) => [row.id, row]),
    )

    const latest = new Map<string, { subject: string; teacher: string; percent: number; gradedAt: string }>()
    for (const row of (submissionRows ?? []) as GradeSubmissionRow[]) {
      if (row.score === null) continue
      const assignment = assignmentById.get(row.assignment_id)
      if (!assignment) continue
      // The class owns the canonical subject, matching the homework page.
      const subject = classSubject.get(assignment.class_id) ?? assignment.subject
      const percent = assignment.points > 0 ? Math.round((row.score / assignment.points) * 100) : row.score
      const gradedAt = row.graded_at ?? ''
      const previous = latest.get(subject)
      if (previous && previous.gradedAt >= gradedAt) continue
      latest.set(subject, {
        subject,
        teacher: classTeacher.get(assignment.class_id) ?? '',
        percent,
        gradedAt,
      })
    }

    return [...latest.values()]
      .sort((a, b) => a.subject.localeCompare(b.subject))
      .map((entry) => ({
        code: subjectCode(entry.subject),
        subject: entry.subject,
        grade: letterGrade(entry.percent),
        teacher: entry.teacher || 'Class teacher',
        score: entry.percent,
      }))
  } catch (error) {
    console.warn('[grades] falling back to local data:', error)
    return null
  }
}

export interface TeacherGradingRow {
  submissionId: string
  assignmentId: string
  title: string
  subject: string
  type: string
  points: number
  className: string
  childName: string
  submittedAt: string | null
  status: 'submitted' | 'graded'
  score: number | null
  feedback: string | null
  answerText: string | null
  attachmentName: string | null
}

export interface TeacherWork {
  pending: TeacherGradingRow[]
  graded: TeacherGradingRow[]
}

interface TeacherClassRow {
  id: string
  name: string
  subject: string
}

interface WorkAssignmentRow {
  id: string
  class_id: string
  title: string
  subject: string
  type: string
  points: number
}

interface WorkSubmissionRow {
  id: string
  assignment_id: string
  child_id: string
  status: 'pending' | 'submitted' | 'graded'
  score: number | null
  feedback: string | null
  answer_text: string | null
  attachment_name: string | null
  submitted_at: string | null
}

interface WorkChildRow {
  id: string
  full_name: string
}

/**
 * Every submission in a class the teacher owns, split into what still needs a
 * grade and what already has one. Null means the tables are unreachable.
 */
export async function loadTeacherWork(teacherId: string): Promise<TeacherWork | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const { data: classRows, error: classError } = await client
      .from('classes')
      .select('id,name,subject')
      .eq('teacher_id', teacherId)
    if (classError) throw classError
    const classes = (classRows ?? []) as TeacherClassRow[]
    if (!classes.length) return { pending: [], graded: [] }

    const classById = new Map(classes.map((row) => [row.id, row]))
    const classIds = classes.map((row) => row.id)

    const { data: assignmentRows, error: assignmentError } = await client
      .from('assignments')
      .select('id,class_id,title,subject,type,points')
      .in('class_id', classIds)
    if (assignmentError) throw assignmentError
    const assignments = (assignmentRows ?? []) as WorkAssignmentRow[]
    if (!assignments.length) return { pending: [], graded: [] }

    const assignmentById = new Map(assignments.map((row) => [row.id, row]))

    const { data: submissionRows, error: submissionError } = await client
      .from('submissions')
      .select('id,assignment_id,child_id,status,score,feedback,answer_text,attachment_name,submitted_at')
      .in('assignment_id', assignments.map((row) => row.id))
      .in('status', ['submitted', 'graded'])
    if (submissionError) throw submissionError
    const submissions = (submissionRows ?? []) as WorkSubmissionRow[]
    if (!submissions.length) return { pending: [], graded: [] }

    const childIds = [...new Set(submissions.map((row) => row.child_id))]
    const { data: childRows, error: childError } = await client
      .from('children')
      .select('id,full_name')
      .in('id', childIds)
    if (childError) throw childError
    const childName = new Map(((childRows ?? []) as WorkChildRow[]).map((row) => [row.id, row.full_name]))

    const mapped = submissions.flatMap((row): TeacherGradingRow[] => {
      const assignment = assignmentById.get(row.assignment_id)
      if (!assignment) return []
      const klass = classById.get(assignment.class_id)
      return [
        {
          submissionId: row.id,
          assignmentId: assignment.id,
          title: assignment.title,
          subject: klass?.subject ?? assignment.subject,
          type: assignment.type,
          points: assignment.points,
          className: klass?.name ?? '',
          childName: childName.get(row.child_id) ?? 'Learner',
          submittedAt: row.submitted_at,
          status: row.status === 'graded' ? 'graded' : 'submitted',
          score: row.score,
          feedback: row.feedback,
          answerText: row.answer_text,
          attachmentName: row.attachment_name,
        },
      ]
    })

    const byNewest = (a: TeacherGradingRow, b: TeacherGradingRow) =>
      (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')

    return {
      pending: mapped.filter((row) => row.status === 'submitted').sort(byNewest),
      graded: mapped.filter((row) => row.status === 'graded').sort(byNewest),
    }
  } catch (error) {
    console.warn('[grades] teacher queue unavailable:', error)
    return null
  }
}

/** Writes a teacher's grade. RLS and the submissions trigger enforce the role. */
export async function gradeSubmission(input: {
  submissionId: string
  score: number
  feedback: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('submissions')
    .update({
      score: Math.max(0, Math.round(input.score)),
      feedback: input.feedback.trim(),
      status: 'graded',
      graded_at: now,
      updated_at: now,
    })
    .eq('id', input.submissionId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
