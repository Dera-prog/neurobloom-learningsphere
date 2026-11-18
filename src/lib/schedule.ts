import { supabase } from './supabase'

/**
 * Timetable and register data access (0008_schedule_attendance.sql). Schedules
 * are written by the class teacher; the register is teacher-owned too and the
 * database stamps who really marked it.
 */

export const scheduleConfigured = Boolean(supabase)

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string; tone: 'success' | 'danger' | 'warn' | 'sky' }[] = [
  { value: 'present', label: 'Present', tone: 'success' },
  { value: 'absent', label: 'Absent', tone: 'danger' },
  { value: 'late', label: 'Late', tone: 'warn' },
  { value: 'excused', label: 'Excused', tone: 'sky' },
]

export interface TimetableSession {
  id: string
  classId: string
  className: string
  subject: string
  weekday: number
  startsAt: string
  endsAt: string
  room: string
}

export interface TeacherClassInfo {
  id: string
  name: string
  subject: string
  level: string
  students: number
}

export interface TeacherTimetable {
  classes: TeacherClassInfo[]
  sessions: TimetableSession[]
}

export interface RegisterLearner {
  childId: string
  name: string
  status: AttendanceStatus
}

export interface AttendanceRecord {
  date: string
  className: string
  subject: string
  status: AttendanceStatus
  markedAt: string | null
}

export interface ChildSession {
  id: string
  className: string
  subject: string
  weekday: number
  startsAt: string
  endsAt: string
  room: string
}

export type WeekAttendance = {
  label: string
  present: number
  absent: number
}

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'The timetable tables are unavailable.'
}

export function weekdayLabel(weekday: number) {
  return WEEKDAY_LABELS[weekday - 1] ?? 'Mon'
}

export function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part))
  if (!Number.isFinite(hours)) return value
  const hour = hours % 12 === 0 ? 12 : hours % 12
  return `${hour}:${String(minutes || 0).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`
}

export function todayValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function dateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

interface ClassRow {
  id: string
  name: string
  subject: string
  level: string
}

interface SessionRow {
  id: string
  class_id: string
  weekday: number
  starts_at: string
  ends_at: string
  room: string
}

interface EnrolledChildRow {
  child_id: string
  children: { full_name: string } | { full_name: string }[] | null
}

interface MarkRow {
  child_id: string
  status: AttendanceStatus
}

function nameOf(row: EnrolledChildRow) {
  const child = Array.isArray(row.children) ? row.children[0] ?? null : row.children
  return child?.full_name ?? 'Learner'
}

/** The classes a teacher owns plus their weekly timetable slots. */
export async function loadTeacherTimetable(teacherId: string): Promise<TeacherTimetable | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const { data: classRows, error: classError } = await client
      .from('classes')
      .select('id,name,subject,level')
      .eq('teacher_id', teacherId)
      .order('name')
    if (classError) throw classError
    const classes = (classRows ?? []) as ClassRow[]
    if (!classes.length) return { classes: [], sessions: [] }

    const classIds = classes.map((row) => row.id)

    const { data: enrollmentRows, error: enrollmentError } = await client
      .from('enrollments')
      .select('class_id')
      .in('class_id', classIds)
    if (enrollmentError) throw enrollmentError

    const rollCount = new Map<string, number>()
    for (const row of (enrollmentRows ?? []) as { class_id: string }[]) {
      rollCount.set(row.class_id, (rollCount.get(row.class_id) ?? 0) + 1)
    }

    const { data: sessionRows, error: sessionError } = await client
      .from('class_sessions')
      .select('id,class_id,weekday,starts_at,ends_at,room')
      .in('class_id', classIds)
      .order('weekday')
      .order('starts_at')
    if (sessionError) throw sessionError

    const classById = new Map(classes.map((row) => [row.id, row]))

    return {
      classes: classes.map((row) => ({
        id: row.id,
        name: row.name,
        subject: row.subject,
        level: row.level,
        students: rollCount.get(row.id) ?? 0,
      })),
      sessions: ((sessionRows ?? []) as SessionRow[]).map((row) => {
        const klass = classById.get(row.class_id)
        return {
          id: row.id,
          classId: row.class_id,
          className: klass?.name ?? '',
          subject: klass?.subject ?? '',
          weekday: row.weekday,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          room: row.room,
        }
      }),
    }
  } catch (error) {
    console.warn('[schedule] timetable unavailable:', messageOf(error))
    return null
  }
}

export async function createSession(input: {
  classId: string
  weekday: number
  startsAt: string
  endsAt: string
  room: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  if (input.endsAt <= input.startsAt) return { ok: false, error: 'The session has to end after it starts.' }

  const { error } = await supabase.from('class_sessions').insert({
    class_id: input.classId,
    weekday: input.weekday,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    room: input.room.trim(),
  })
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'That class already has a session at this time.' }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function deleteSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const { error } = await supabase.from('class_sessions').delete().eq('id', sessionId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** The roll for one class on one day, with any marks already taken. */
export async function loadRegister(classId: string, date: string): Promise<RegisterLearner[] | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const { data: enrollmentRows, error: enrollmentError } = await client
      .from('enrollments')
      .select('child_id, children(full_name)')
      .eq('class_id', classId)
    if (enrollmentError) throw enrollmentError

    const { data: markRows, error: markError } = await client
      .from('attendance')
      .select('child_id,status')
      .eq('class_id', classId)
      .eq('session_date', date)
    if (markError) throw markError

    const taken = new Map(((markRows ?? []) as MarkRow[]).map((row) => [row.child_id, row.status]))

    return ((enrollmentRows ?? []) as EnrolledChildRow[])
      .map((row) => ({
        childId: row.child_id,
        name: nameOf(row),
        // A fresh register starts from present; the teacher only marks exceptions.
        status: taken.get(row.child_id) ?? 'present',
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.warn('[schedule] register unavailable:', messageOf(error))
    return null
  }
}

/** Writes (or rewrites) the register for one class on one day. */
export async function saveRegister(input: {
  classId: string
  date: string
  marks: { childId: string; status: AttendanceStatus }[]
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  if (!input.marks.length) return { ok: false, error: 'There is nobody on this register yet.' }

  const { error } = await supabase.from('attendance').upsert(
    input.marks.map((mark) => ({
      class_id: input.classId,
      child_id: mark.childId,
      session_date: input.date,
      status: mark.status,
    })),
    { onConflict: 'class_id,child_id,session_date' },
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

async function findChildId(guardianId: string, childName: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('children')
    .select('id')
    .eq('guardian_id', guardianId)
    .eq('full_name', childName)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as { id: string } | null)?.id ?? null
}

/**
 * A guardian's child's recent registers. Null means there is no row for this
 * learner (or the tables are unreachable), so the caller keeps its sample data.
 */
export async function loadChildAttendance(input: {
  guardianId: string
  childName: string
}): Promise<AttendanceRecord[] | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const childId = await findChildId(input.guardianId, input.childName)
    if (!childId) return null

    const { data, error } = await client
      .from('attendance')
      .select('session_date,status,marked_at, classes(name,subject)')
      .eq('child_id', childId)
      .order('session_date', { ascending: false })
      .limit(60)
    if (error) throw error

    return ((data ?? []) as {
      session_date: string
      status: AttendanceStatus
      marked_at: string | null
      classes: { name: string; subject: string } | { name: string; subject: string }[] | null
    }[]).map((row) => {
      const klass = Array.isArray(row.classes) ? row.classes[0] ?? null : row.classes
      return {
        date: row.session_date,
        className: klass?.name ?? '',
        subject: klass?.subject ?? '',
        status: row.status,
        markedAt: row.marked_at,
      }
    })
  } catch (error) {
    console.warn('[schedule] attendance fallback:', messageOf(error))
    return null
  }
}

/** A guardian's child's weekly timetable. Null means no learner row yet. */
export async function loadChildSessions(input: {
  guardianId: string
  childName: string
}): Promise<ChildSession[] | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const childId = await findChildId(input.guardianId, input.childName)
    if (!childId) return null

    const { data: enrollmentRows, error: enrollmentError } = await client
      .from('enrollments')
      .select('class_id')
      .eq('child_id', childId)
    if (enrollmentError) throw enrollmentError

    const classIds = [...new Set(((enrollmentRows ?? []) as { class_id: string }[]).map((row) => row.class_id))]
    if (!classIds.length) return []

    const { data, error } = await client
      .from('class_sessions')
      .select('id,class_id,weekday,starts_at,ends_at,room, classes(name,subject)')
      .in('class_id', classIds)
      .order('weekday')
      .order('starts_at')
    if (error) throw error

    return ((data ?? []) as {
      id: string
      weekday: number
      starts_at: string
      ends_at: string
      room: string
      classes: { name: string; subject: string } | { name: string; subject: string }[] | null
    }[]).map((row) => {
      const klass = Array.isArray(row.classes) ? row.classes[0] ?? null : row.classes
      return {
        id: row.id,
        className: klass?.name ?? '',
        subject: klass?.subject ?? '',
        weekday: row.weekday,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        room: row.room,
      }
    })
  } catch (error) {
    console.warn('[schedule] timetable fallback:', messageOf(error))
    return null
  }
}

export function attendanceRate(records: AttendanceRecord[]): number | null {
  if (!records.length) return null
  const attended = records.filter((row) => row.status === 'present' || row.status === 'late').length
  return Math.round((attended / records.length) * 100)
}

/** Mon–Fri of the current week for the classes this teacher owns. */
export async function loadTeacherAttendanceWeek(teacherId: string): Promise<WeekAttendance[] | null> {
  if (!supabase) return null
  const client = supabase

  try {
    const { data: classRows, error: classError } = await client
      .from('classes')
      .select('id')
      .eq('teacher_id', teacherId)
    if (classError) throw classError
    const classIds = ((classRows ?? []) as { id: string }[]).map((row) => row.id)
    if (!classIds.length) return []

    const now = new Date()
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
    const toValue = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4)

    const { data, error } = await client
      .from('attendance')
      .select('session_date,status')
      .in('class_id', classIds)
      .gte('session_date', toValue(monday))
      .lte('session_date', toValue(friday))
    if (error) throw error

    const counts = new Map<string, { present: number; absent: number }>()
    for (const row of (data ?? []) as { session_date: string; status: AttendanceStatus }[]) {
      const entry = counts.get(row.session_date) ?? { present: 0, absent: 0 }
      if (row.status === 'present' || row.status === 'late') entry.present += 1
      else entry.absent += 1
      counts.set(row.session_date, entry)
    }

    return WEEKDAY_LABELS.slice(0, 5).map((label, index) => {
      const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)
      const entry = counts.get(toValue(day))
      return { label, present: entry?.present ?? 0, absent: entry?.absent ?? 0 }
    })
  } catch (error) {
    console.warn('[schedule] weekly attendance unavailable:', messageOf(error))
    return null
  }
}
