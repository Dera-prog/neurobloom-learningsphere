import type { TeacherClass } from '../data/content'
import { isSupabaseConfigured, supabase } from './supabase'

const PALETTE: Record<string, { color: string; soft: string }> = {
  Mathematics: { color: '#6c3fc5', soft: '#f0eefb' },
  'Further Maths': { color: '#0ea5e9', soft: '#e8f4fd' },
  English: { color: '#0ea5e9', soft: '#e8f4fd' },
  'Basic Science': { color: '#10b981', soft: '#ecfdf5' },
  Physics: { color: '#f59e0b', soft: '#fffbeb' },
  Chemistry: { color: '#ec4899', soft: '#fdf2f8' },
  Numeracy: { color: '#ec4899', soft: '#fdf2f8' },
}
const FALLBACK = { color: '#10b981', soft: '#ecfdf5' }

interface ClassRow {
  id: string
  name: string
  subject: string
  level: string
  teacher_name: string
  schedule_time: string
  duration: string
  created_at: string
}

export interface ClassRosterEntry {
  childId: string
  name: string
  level: string
}

function toTeacherClass(row: ClassRow, students: number): TeacherClass {
  const palette = PALETTE[row.subject] ?? FALLBACK
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    subject: row.subject,
    color: palette.color,
    soft: palette.soft,
    students,
    time: row.schedule_time || '—',
    duration: row.duration || '—',
    status: 'upcoming',
  }
}

/**
 * The classes a teacher actually owns, with live roll sizes. Returns null when
 * the tables are unreachable so demo mode can keep its sample timetable.
 */
export async function loadTeacherClasses(teacherId: string): Promise<TeacherClass[] | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('classes')
    .select('id,name,subject,level,teacher_name,schedule_time,duration,created_at')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true })
  if (error) return null

  const rows = (data ?? []) as ClassRow[]
  const counts = new Map<string, number>()
  if (rows.length) {
    const { data: enrollments, error: rollError } = await supabase
      .from('enrollments')
      .select('class_id')
      .in('class_id', rows.map((row) => row.id))
    if (!rollError) {
      for (const row of (enrollments ?? []) as { class_id: string }[]) {
        counts.set(row.class_id, (counts.get(row.class_id) ?? 0) + 1)
      }
    }
  }
  return rows.map((row) => toTeacherClass(row, counts.get(row.id) ?? 0))
}

export async function createTeacherClass(input: {
  name: string
  level: string
  subject: string
  time: string
  duration: string
  teacherId: string
  teacherName: string
}): Promise<TeacherClass | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: input.name,
      level: input.level,
      subject: input.subject,
      schedule_time: input.time,
      duration: input.duration,
      teacher_id: input.teacherId,
      teacher_name: input.teacherName,
    })
    .select('id,name,subject,level,teacher_name,schedule_time,duration,created_at')
    .single()
  if (error || !data) {
    if (error) console.warn('Could not schedule class:', error.message)
    return null
  }
  return toTeacherClass(data as ClassRow, 0)
}

/** The roll of one class, for the teacher's roster export. */
export async function loadClassRoster(classId: string): Promise<ClassRosterEntry[] | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('enrollments')
    .select('child_id, children(full_name, class_level)')
    .eq('class_id', classId)
  if (error) return null
  const rows = (data ?? []) as unknown as {
    child_id: string
    children: { full_name: string; class_level: string } | { full_name: string; class_level: string }[] | null
  }[]
  return rows.map((row) => {
    const child = Array.isArray(row.children) ? row.children[0] : row.children
    return {
      childId: row.child_id,
      name: child?.full_name ?? 'Learner',
      level: child?.class_level ?? '',
    }
  })
}
