import { childrenData, type ChildId, type ChildProfile } from '../data/content'
import { supabase } from './supabase'

export const CHILD_SLOTS: ChildId[] = ['tunde', 'chidi']
export const CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']

export interface ReportFile {
  name: string
  size: number
  type: string
  path?: string | null
  uploadedAt: string
}

export interface ChildRecord {
  name: string
  className: string
  specialNeeds: boolean
  /** The two seeded sample learners keep their demo history. */
  demo?: boolean
  report?: ReportFile | null
}

export interface DailyProgress {
  minutes: number
  lessons: number
  practice: number
  streakDays: number
  targetMinutes: number
}

export interface ResolvedChild extends ChildProfile {
  slot: ChildId
  specialNeeds: boolean
  daily: DailyProgress
  hasHistory: boolean
  report?: ReportFile | null
}

const DEMO_CHILDREN: ChildRecord[] = [
  { name: 'Tunde Bakare', className: 'JSS2', specialNeeds: false, demo: true },
  { name: 'Chidi Eze', className: 'JSS1', specialNeeds: true, demo: true },
]

const DEMO_DAILY: Record<ChildId, DailyProgress> = {
  tunde: { minutes: 48, lessons: 3, practice: 86, streakDays: 7, targetMinutes: 60 },
  chidi: { minutes: 35, lessons: 2, practice: 74, streakDays: 12, targetMinutes: 45 },
}

const EMPTY_DAILY: DailyProgress = { minutes: 0, lessons: 0, practice: 0, streakDays: 0, targetMinutes: 45 }

export function demoChildRecords(): ChildRecord[] {
  return DEMO_CHILDREN.map((child) => ({ ...child }))
}

function cleanReport(value: unknown): ReportFile | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null
  return {
    name: raw.name.trim().slice(0, 160),
    size: typeof raw.size === 'number' && raw.size > 0 ? raw.size : 0,
    type: typeof raw.type === 'string' ? raw.type.slice(0, 90) : '',
    path: typeof raw.path === 'string' ? raw.path : null,
    uploadedAt: typeof raw.uploadedAt === 'string' ? raw.uploadedAt : new Date().toISOString(),
  }
}

export function normalizeChildRecords(value: unknown): ChildRecord[] {
  if (!Array.isArray(value)) return demoChildRecords()
  const records = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const raw = entry as Record<string, unknown>
    const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 80) : ''
    if (name.length < 2) return []
    const className =
      typeof raw.className === 'string' && CLASS_LEVELS.includes(raw.className) ? raw.className : 'JSS1'
    return [
      {
        name,
        className,
        specialNeeds: raw.specialNeeds === true,
        demo: raw.demo === true,
        report: cleanReport(raw.report),
      },
    ]
  })
  return records.length ? records.slice(0, CHILD_SLOTS.length) : demoChildRecords()
}

function emptyProfile(slot: ChildId, record: ChildRecord): ResolvedChild {
  const special = record.specialNeeds
  return {
    id: slot,
    name: record.name,
    level: record.className,
    emoji: special ? '🦋' : '🎒',
    color: special ? '#8b7bb0' : '#64748b',
    soft: special ? '#efe9f6' : '#f1f5f9',
    plan: special ? 'special' : 'general',
    average: 0,
    averageLabel: special ? 'Communication growth' : 'Average Score',
    averageTrend: 'No results yet',
    attendance: 0,
    attendanceLabel: 'No classes yet',
    workDone: '0 / 0',
    workLabel: 'Nothing assigned yet',
    streak: '0 days',
    streakLabel: 'No streak yet',
    lessonCompletion: [
      { name: 'Completed', value: 0, color: '#10b981' },
      { name: 'In progress', value: 0, color: '#f59e0b' },
      { name: 'Not started', value: 100, color: '#e5e7eb' },
    ],
    grades: [],
    trend: [],
    daily: { ...EMPTY_DAILY },
    slot,
    specialNeeds: special,
    hasHistory: false,
    special,
    report: record.report ?? null,
  }
}

function demoProfile(slot: ChildId, record: ChildRecord): ResolvedChild {
  const base = childrenData[slot]
  return {
    ...base,
    name: record.name || base.name,
    level: record.className || base.level,
    slot,
    specialNeeds: record.specialNeeds,
    daily: { ...DEMO_DAILY[slot] },
    hasHistory: true,
    special: record.specialNeeds || base.special,
    report: record.report ?? null,
  }
}

export function resolveChildren(records: ChildRecord[] | undefined): Record<ChildId, ResolvedChild> {
  const list = records && records.length ? records : demoChildRecords()
  const resolve = (slot: ChildId, index: number) => {
    const record = list[index]
    if (!record) return demoProfile(slot, demoChildRecords()[index])
    return record.demo ? demoProfile(slot, record) : emptyProfile(slot, record)
  }
  return {
    tunde: resolve('tunde', 0),
    chidi: resolve('chidi', 1),
  }
}

export function orderedChildren(records: ChildRecord[] | undefined): ResolvedChild[] {
  const list = records && records.length ? records : demoChildRecords()
  const resolved = resolveChildren(records)
  return CHILD_SLOTS.slice(0, list.length).map((slot) => resolved[slot])
}

// Signup runs before the account's synced state exists, so the children the
// guardian entered ride along in localStorage until the store hydrates.
const signupKey = (email: string) => `neurobloom:signup-children:${email.trim().toLowerCase()}`

export function saveSignupChildren(email: string, children: ChildRecord[]) {
  if (!email.trim()) return
  try {
    localStorage.setItem(signupKey(email), JSON.stringify(children))
  } catch {
    // Private browsing can block storage; the dashboard then starts without children.
  }
}

export function takeSignupChildren(email: string | undefined): ChildRecord[] {
  if (!email) return []
  try {
    const raw = localStorage.getItem(signupKey(email))
    if (!raw) return []
    localStorage.removeItem(signupKey(email))
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return []
    return normalizeChildRecords(parsed)
  } catch {
    return []
  }
}

export async function uploadEvaluationReport(file: File, userId: string): Promise<{ path?: string; error?: string }> {
  if (!supabase) return {}
  const safeName = file.name.replace(/[^\w.\-]+/g, '-').slice(-90) || 'evaluation-report'
  const path = `${userId}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage
    .from('evaluation-reports')
    .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' })
  if (error) return { error: error.message }
  return { path }
}
