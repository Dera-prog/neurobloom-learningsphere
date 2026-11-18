import type { Activity, Assignment, ChildId } from '../data/content'
import { supabase } from './supabase'

/**
 * Homework data access. Reads the Phase 1 school tables (0005_homework.sql)
 * and falls back to the seeded demo content whenever Supabase or the tables
 * are not reachable, so the page never blocks on backend setup.
 */

export const homeworkConfigured = Boolean(supabase)

export interface HomeworkTeacher {
  name: string
  subject: string
}

export interface HomeworkAssignment {
  id: string
  title: string
  subject: string
  type: string
  points: number
  dueAt: string | null
  dueLabel: string
  description: string
  instructions?: string
  status: 'pending' | 'submitted' | 'graded'
  score?: number
  feedback?: string
}

export interface HomeworkSnapshot {
  source: 'supabase' | 'demo'
  /** The children row this snapshot belongs to; null in demo fallback. */
  childId: string | null
  assignments: HomeworkAssignment[]
  teachers: HomeworkTeacher[]
  completedIds: string[]
  minutes: number
  error?: string
}

export interface HomeworkFallback {
  assignments: HomeworkAssignment[]
  teachers: HomeworkTeacher[]
  completedIds: string[]
  minutes: number
}

export interface HomeworkChild {
  slot: ChildId
  name: string
  className: string
  specialNeeds: boolean
  demo: boolean
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function homeworkDueLabel(dueAt: string | null, status: HomeworkAssignment['status']): string {
  if (status === 'graded') return 'Graded'
  if (status === 'submitted') return 'Submitted'
  if (!dueAt) return 'No due date'
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return 'No due date'
  const dayStart = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const days = Math.round((dayStart(due) - dayStart(new Date())) / 86_400_000)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due ${WEEKDAYS[due.getDay()]}`
}

/** Converts the seeded assignments to the table shape for the demo fallback. */
export function seedHomework(assignments: Assignment[]): HomeworkAssignment[] {
  return assignments
    .filter((assignment) => assignment.stage === 'junior')
    .map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.subject,
      type: assignment.type,
      points: assignment.points,
      dueAt: assignment.dueDate || null,
      dueLabel: assignment.dueLabel,
      description: assignment.description,
      instructions: assignment.instructions,
      status: assignment.status,
      score: assignment.score,
      feedback: assignment.feedback,
    }))
}

/**
 * Demo learners keep seeded homework until their class has real rows. Runs at
 * most once per child because the enrollment check short-circuits the seed.
 */
const DEMO_CLASSES: Record<ChildId, { subject: string; teacher: string }[]> = {
  tunde: [
    { subject: 'Mathematics', teacher: 'Mr. Adeyemi' },
    { subject: 'English', teacher: 'Mrs. Okafor' },
    { subject: 'Basic Science', teacher: 'Mr. Ibrahim' },
  ],
  chidi: [
    { subject: 'Speech Therapist', teacher: 'Ms. Sarah' },
    { subject: 'ASD Specialist', teacher: 'Mr. Emeka' },
    { subject: 'Behavioral Coach', teacher: 'Mrs. Adaeze' },
  ],
}

interface DemoAssignmentSeed {
  title: string
  subject: string
  classSubject: string
  type: string
  description: string
  instructions?: string
  points: number
  dueInDays: number
  autoGrade: boolean
  status: 'pending' | 'submitted' | 'graded'
  score?: number
  feedback?: string
}

const DEMO_ASSIGNMENTS: DemoAssignmentSeed[] = [
  {
    title: 'Algebra – Chapter 5 Exercises',
    subject: 'Maths',
    classSubject: 'Mathematics',
    type: 'Quiz',
    description: 'Three quick questions on solving equations and substitution from Chapter 5.',
    instructions: 'Answer all three questions. You have one attempt. Your score is added to your total points immediately.',
    points: 20,
    dueInDays: 0,
    autoGrade: true,
    status: 'pending',
  },
  {
    title: 'Essay: My Cultural Heritage',
    subject: 'English',
    classSubject: 'English',
    type: 'Essay',
    description: 'Write a 250–300 word essay about a tradition or festival in your community.',
    instructions: 'Include an introduction, two body paragraphs and a conclusion. Use at least three descriptive words.',
    points: 30,
    dueInDays: 1,
    autoGrade: false,
    status: 'pending',
  },
  {
    title: 'Lab Report – Plant Cells',
    subject: 'Science',
    classSubject: 'Basic Science',
    type: 'Lab Report',
    description: 'Write up the onion cell practical: aim, apparatus, method, observation and conclusion.',
    instructions: 'Attach your labelled diagram if you drew one. Submit a PDF or type your report below.',
    points: 25,
    dueInDays: 3,
    autoGrade: false,
    status: 'pending',
  },
  {
    title: 'Fractions Worksheet',
    subject: 'Maths',
    classSubject: 'Mathematics',
    type: 'Worksheet',
    description: 'Adding, subtracting and simplifying fractions.',
    points: 15,
    dueInDays: -3,
    autoGrade: false,
    status: 'graded',
    score: 14,
    feedback: 'Excellent work, Tunde! You only lost a mark on question 7 — remember to simplify your final answer.',
  },
  {
    title: 'Book Review: The Bottled Leopard',
    subject: 'English',
    classSubject: 'English',
    type: 'Essay',
    description: 'Review the class novel and share what you liked most about the main character.',
    points: 20,
    dueInDays: -1,
    autoGrade: false,
    status: 'submitted',
  },
  {
    title: 'States of Matter Quiz',
    subject: 'Science',
    classSubject: 'Basic Science',
    type: 'Quiz',
    description: 'Solids, liquids and gases.',
    points: 20,
    dueInDays: -6,
    autoGrade: true,
    status: 'graded',
    score: 18,
    feedback: 'Great understanding of particle arrangement. Review condensation before the next test.',
  },
]

function dueFromToday(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(16, 0, 0, 0)
  return date.toISOString()
}

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'Homework tables are unavailable.'
}

interface ChildRow {
  id: string
}

interface EnrollmentRow {
  class_id: string
  classes: { id: string; subject: string; teacher_name: string } | { id: string; subject: string; teacher_name: string }[] | null
}

interface AssignmentRow {
  id: string
  class_id: string
  title: string
  subject: string
  type: string
  description: string
  instructions: string | null
  points: number
  due_at: string | null
}

interface SubmissionRow {
  assignment_id: string
  status: 'pending' | 'submitted' | 'graded'
  score: number | null
  feedback: string | null
}

interface CompletionRow {
  activity_id: string
  minutes: number
}

function classOf(row: EnrollmentRow) {
  return Array.isArray(row.classes) ? row.classes[0] ?? null : row.classes
}

async function ensureChildRow(guardianId: string, child: HomeworkChild): Promise<string> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured.')

  const find = () =>
    client
      .from('children')
      .select('id')
      .eq('guardian_id', guardianId)
      .eq('full_name', child.name)
      .limit(1)
      .maybeSingle()

  const { data, error } = await find()
  if (error) throw error
  if (data) return (data as ChildRow).id

  const { data: created, error: insertError } = await client
    .from('children')
    .insert({
      guardian_id: guardianId,
      full_name: child.name,
      class_level: child.className,
      special_needs: child.specialNeeds,
    })
    .select('id')
    .single()

  if (insertError) {
    // A second tab may have created the row between the select and insert.
    if (insertError.code === '23505') {
      const { data: again } = await find()
      if (again) return (again as ChildRow).id
    }
    throw insertError
  }
  return (created as ChildRow).id
}

async function seedDemoHomework(childId: string, child: HomeworkChild) {
  const client = supabase
  if (!client) return

  const { data: enrolled, error: enrollError } = await client
    .from('enrollments')
    .select('class_id')
    .eq('child_id', childId)
    .limit(1)
  if (enrollError) throw enrollError
  if (enrolled && enrolled.length) return

  const definitions = DEMO_CLASSES[child.slot]
  const { data: classes, error: classError } = await client
    .from('classes')
    .insert(
      definitions.map((definition) => ({
        name: `${child.className} ${definition.subject}`,
        subject: definition.subject,
        level: child.className,
        teacher_name: definition.teacher,
      })),
    )
    .select('id,subject')
  if (classError) throw classError

  const classBySubject = new Map<string, string>(
    ((classes ?? []) as { id: string; subject: string }[]).map((row) => [row.subject, row.id]),
  )
  const enrollmentRows = [...classBySubject.values()].map((classId) => ({ class_id: classId, child_id: childId }))
  const { error: joinError } = await client.from('enrollments').insert(enrollmentRows)
  if (joinError) throw joinError

  if (child.slot !== 'tunde') return

  const { data: created, error: assignmentError } = await client
    .from('assignments')
    .insert(
      DEMO_ASSIGNMENTS.map((seed) => ({
        class_id: classBySubject.get(seed.classSubject),
        title: seed.title,
        subject: seed.subject,
        type: seed.type,
        description: seed.description,
        instructions: seed.instructions ?? null,
        points: seed.points,
        stage: 'junior',
        due_at: dueFromToday(seed.dueInDays),
        auto_grade: seed.autoGrade,
      })),
    )
    .select('id,title')
  if (assignmentError) throw assignmentError

  const idByTitle = new Map<string, string>(
    ((created ?? []) as { id: string; title: string }[]).map((row) => [row.title, row.id]),
  )
  const submissionRows = DEMO_ASSIGNMENTS.filter((seed) => seed.status !== 'pending').flatMap((seed) => {
    const assignmentId = idByTitle.get(seed.title)
    if (!assignmentId) return []
    return [
      {
        assignment_id: assignmentId,
        child_id: childId,
        status: seed.status,
        score: seed.score ?? null,
        feedback: seed.feedback ?? null,
        submitted_at: dueFromToday(seed.dueInDays),
        graded_at: seed.status === 'graded' ? dueFromToday(seed.dueInDays + 1) : null,
      },
    ]
  })
  if (submissionRows.length) {
    const { error: submissionError } = await client.from('submissions').insert(submissionRows)
    if (submissionError) throw submissionError
  }
}

async function fetchSnapshot(childId: string): Promise<Omit<HomeworkSnapshot, 'source' | 'childId'>> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured.')

  const { data: enrollmentRows, error: enrollmentError } = await client
    .from('enrollments')
    .select('class_id, classes(id,subject,teacher_name)')
    .eq('child_id', childId)
  if (enrollmentError) throw enrollmentError

  const enrollments = (enrollmentRows ?? []) as EnrollmentRow[]
  const classIds = [...new Set(enrollments.map((row) => row.class_id))]
  const classSubject = new Map<string, string>()
  const teachers: HomeworkTeacher[] = []
  const seenSubjects = new Set<string>()
  for (const row of enrollments) {
    const klass = classOf(row)
    if (!klass) continue
    classSubject.set(row.class_id, klass.subject)
    if (seenSubjects.has(klass.subject)) continue
    seenSubjects.add(klass.subject)
    teachers.push({ name: klass.teacher_name, subject: klass.subject })
  }

  const assignments: AssignmentRow[] = []
  if (classIds.length) {
    const { data, error } = await client
      .from('assignments')
      .select('id,class_id,title,subject,type,description,instructions,points,due_at')
      .in('class_id', classIds)
      .order('due_at', { ascending: true, nullsFirst: false })
    if (error) throw error
    assignments.push(...((data ?? []) as AssignmentRow[]))
  }

  const { data: submissionRows, error: submissionError } = await client
    .from('submissions')
    .select('assignment_id,status,score,feedback')
    .eq('child_id', childId)
  if (submissionError) throw submissionError

  const { data: completionRows, error: completionError } = await client
    .from('activity_completions')
    .select('activity_id,minutes')
    .eq('child_id', childId)
  if (completionError) throw completionError

  const submissionByAssignment = new Map<string, SubmissionRow>(
    ((submissionRows ?? []) as SubmissionRow[]).map((row) => [row.assignment_id, row]),
  )

  return {
    assignments: assignments.map((row) => {
      const submission = submissionByAssignment.get(row.id)
      const status = submission?.status ?? 'pending'
      return {
        id: row.id,
        title: row.title,
        // The class owns the canonical subject; older seeded rows used short
        // labels, so prefer the enrolled class to keep one subject per class.
        subject: classSubject.get(row.class_id) ?? row.subject,
        type: row.type,
        points: row.points,
        dueAt: row.due_at,
        dueLabel: homeworkDueLabel(row.due_at, status),
        description: row.description,
        instructions: row.instructions ?? undefined,
        status,
        score: submission?.score ?? undefined,
        feedback: submission?.feedback ?? undefined,
      }
    }),
    teachers,
    completedIds: ((completionRows ?? []) as CompletionRow[]).map((row) => row.activity_id),
    minutes: ((completionRows ?? []) as CompletionRow[]).reduce((sum, row) => sum + row.minutes, 0),
  }
}

/** Finds or creates the child row, seeds demo work once, then reads the tables. */
export async function loadHomework(input: {
  guardianId: string
  child: HomeworkChild
  fallback: HomeworkFallback
}): Promise<HomeworkSnapshot> {
  const fallbackSnapshot: HomeworkSnapshot = { ...input.fallback, source: 'demo', childId: null }
  if (!supabase) return fallbackSnapshot

  try {
    const childId = await ensureChildRow(input.guardianId, input.child)
    if (input.child.demo) await seedDemoHomework(childId, input.child)
    const snapshot = await fetchSnapshot(childId)
    return { ...snapshot, source: 'supabase', childId }
  } catch (error) {
    console.warn('[homework] falling back to local data:', messageOf(error))
    return { ...fallbackSnapshot, error: messageOf(error) }
  }
}

export interface PublishAssignmentInput {
  title: string
  subject: string
  level: string
  type: string
  description: string
  instructions?: string
  points: number
  dueAt: string
  stage: 'junior' | 'senior'
}

/**
 * Publishes a teacher's assignment to the class record. Uses a class the
 * teacher owns, then an unclaimed class for the same level + subject (which
 * admins can see), and creates the class when neither exists.
 */
export async function publishAssignment(
  input: PublishAssignmentInput,
  teacher: { id: string; name: string },
): Promise<{ ok: boolean; classId?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const client = supabase

  try {
    const owned = await client
      .from('classes')
      .select('id')
      .eq('teacher_id', teacher.id)
      .eq('level', input.level)
      .eq('subject', input.subject)
      .limit(1)
      .maybeSingle()
    if (owned.error) throw owned.error
    let classId = (owned.data as { id: string } | null)?.id

    if (!classId) {
      const unclaimed = await client
        .from('classes')
        .select('id')
        .is('teacher_id', null)
        .eq('level', input.level)
        .eq('subject', input.subject)
        .limit(1)
        .maybeSingle()
      if (unclaimed.error) throw unclaimed.error
      classId = (unclaimed.data as { id: string } | null)?.id
      if (classId) {
        // Taking the class on is what gives the teacher the roll, and later
        // the grades; an unclaimed class holds no authority to hand over.
        const claimed = await client
          .from('classes')
          .update({ teacher_id: teacher.id, teacher_name: teacher.name })
          .eq('id', classId)
          .is('teacher_id', null)
        if (claimed.error) throw claimed.error
      }
    }

    if (!classId) {
      const created = await client
        .from('classes')
        .insert({
          name: `${input.level} ${input.subject}`,
          subject: input.subject,
          level: input.level,
          teacher_id: teacher.id,
          teacher_name: teacher.name,
        })
        .select('id')
        .single()
      if (created.error) throw created.error
      classId = (created.data as { id: string }).id
    }

    const { error } = await client.from('assignments').insert({
      class_id: classId,
      created_by: teacher.id,
      title: input.title,
      subject: input.subject,
      type: input.type,
      description: input.description,
      instructions: input.instructions ?? null,
      points: input.points,
      stage: input.stage,
      due_at: input.dueAt,
      auto_grade: false,
    })
    if (error) throw error
    return { ok: true, classId }
  } catch (error) {
    console.warn('[homework] assignment not published:', messageOf(error))
    return { ok: false, error: messageOf(error) }
  }
}

/** Writes the at-home practice row; a duplicate means it was already done. */export async function recordActivityCompletion(
  childId: string,
  activity: Pick<Activity, 'id' | 'minutes' | 'reward'>,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const { error } = await supabase.from('activity_completions').insert({
    child_id: childId,
    activity_id: activity.id,
    minutes: activity.minutes,
    points: activity.reward,
    completed_by: userId,
  })
  if (error && error.code !== '23505') return { ok: false, error: error.message }
  return { ok: true }
}

/** Lets the page show the same teachers in the fallback as in the tables. */
export function teachersFromRecords(records: { name: string; subject: string }[] | undefined): HomeworkTeacher[] {
  return (records ?? []).map((record) => ({ name: record.name, subject: record.subject }))
}
