import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import {
  initialAssignments,
  seedThreads,
  teacherClasses as seedTeacherClasses,
  teacherGrading,
  teacherRequests as seedTutorRequests,
  resources as seedResources,
  supervisionDefaults,
  type AcceptedSession,
  type Assignment,
  type Audience,
  type Booking,
  type ChildId,
  type GradingItem,
  type PlanId,
  type ReportEntry,
  type Resource,
  type TeacherClass,
  type Thread,
  type TutorRequest,
} from '../data/content'
import { useAuth } from '../lib/auth'
import { clearOnboardingPending, hasPendingOnboarding } from '../lib/onboarding'
import { paymentsConfigured } from '../lib/payments'
import { supabase } from '../lib/supabase'

export const STORAGE_KEY = 'neurobloom:demo:v4'

export interface Mood {
  emoji: string
  label: string
  date: string
}

export interface Preferences {
  fontScale: number
  reduceMotion: boolean
  highContrast: boolean
  notifyRequests: boolean
  notifyGrading: boolean
  notifyPayouts: boolean
  themeMode: 'teal' | 'classic'
}

export interface ParentAccessState {
  active: boolean
  until: string | null
}

export interface SupportRequest {
  id: string
  child: string
  topic: string
  message: string
  email: string
  at: string
  status: string
}

export interface OnboardingState {
  complete: boolean
  steps: string[]
}

export interface AppState {
  // A signup keeps this on until the account builds up its own history; it is
  // persisted so signing out and back in never reveals the demo dashboard.
  newAccount: boolean
  points: number
  assignments: Assignment[]
  threads: Thread[]
  bookings: Booking[]
  tutorRequests: TutorRequest[]
  acceptedSessions: AcceptedSession[]
  gradingQueue: GradingItem[]
  teacherClasses: TeacherClass[]
  contentLibrary: Resource[]
  mood: Mood | null
  moodHistory: Mood[]
  completedActivities: string[]
  totalActivityMinutes: number
  focusMinutes: number
  quizScores: Record<string, number>
  alertsRead: boolean
  notificationsRead: boolean
  supervision: Record<string, boolean>
  plans: Record<ChildId, PlanId>
  parentAccess: Record<ChildId, ParentAccessState>
  preferences: Preferences
  availability: Record<string, boolean>
  reports: ReportEntry[]
  supportRequests: SupportRequest[]
  onboarding: OnboardingState
}

export type Action =
  | { type: 'SUBMIT_ASSIGNMENT'; id: string; answers?: number[]; score?: number; autoGraded: boolean; text?: string; fileName?: string }
  | { type: 'GRADE_SUBMISSION'; queueId: string; score: number; feedback: string }
  | { type: 'SEND_MESSAGE'; threadId: string; text: string; author?: string }
  | { type: 'CREATE_THREAD'; thread: Thread }
  | { type: 'READ_THREAD'; threadId: string }
  | { type: 'BOOK_TUTOR'; booking: Booking }
  | { type: 'ACCEPT_REQUEST'; id: string }
  | { type: 'DECLINE_REQUEST'; id: string }
  | { type: 'ADD_POINTS'; amount: number }
  | { type: 'SET_MOOD'; mood: Mood }
  | { type: 'COMPLETE_ACTIVITY'; id: string; minutes: number; points: number }
  | { type: 'ADD_FOCUS'; minutes: number }
  | { type: 'SAVE_QUIZ_SCORE'; quizId: string; score: number }
  | { type: 'CREATE_ASSIGNMENT'; assignment: Assignment; level: string }
  | { type: 'CREATE_CLASS'; klass: TeacherClass }
  | { type: 'ADD_RESOURCE'; resource: Resource }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'MARK_ALERTS_READ' }
  | { type: 'TOGGLE_SUPERVISION'; key: string }
  | { type: 'CHANGE_PLAN'; child: ChildId; plan: PlanId }
  | { type: 'SET_PARENT_ACCESS'; child: ChildId; active: boolean; until?: string | null }
  | { type: 'SET_PREF'; key: keyof Preferences; value: number | boolean | string }
  | { type: 'TOGGLE_AVAILABILITY'; day: string }
  | { type: 'ADD_REPORT'; report: ReportEntry }
  | { type: 'ADD_SUPPORT_REQUEST'; request: SupportRequest }
  | { type: 'MARK_ONBOARDING_STEP'; step: string }
  | { type: 'FINISH_ONBOARDING' }
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'RESET' }

function oneMonthFromNow() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

function makeInitialState(): AppState {
  return {
    newAccount: false,
    points: 1180,
    assignments: initialAssignments.map((a) => ({ ...a })),
    threads: seedThreads.map((t) => ({ ...t, messages: t.messages.map((m) => ({ ...m })) })),
    bookings: [
      {
        id: 'bk-seed-1',
        tutorName: 'Ms. Ada Nwosu',
        tutorEmoji: '👩🏽‍🔬',
        subject: 'Physics',
        when: 'Friday, 4:00 PM',
        rate: 18000,
        audience: 'senior',
        status: 'upcoming',
        notes: 'Focus on electricity and WAEC practical questions.',
      },
    ],
    tutorRequests: seedTutorRequests.map((r) => ({ ...r })),
    acceptedSessions: [],
    gradingQueue: teacherGrading.map((g) => ({ ...g })),
    teacherClasses: seedTeacherClasses.map((c) => ({ ...c })),
    contentLibrary: seedResources.map((r) => ({ ...r })),
    mood: null,
    moodHistory: [
      { emoji: '🙂', label: 'Good', date: 'Mon' },
      { emoji: '😄', label: 'Great', date: 'Tue' },
      { emoji: '😐', label: 'Okay', date: 'Wed' },
    ],
    completedActivities: [],
    totalActivityMinutes: 0,
    focusMinutes: 38,
    quizScores: {},
    alertsRead: false,
    notificationsRead: false,
    supervision: { ...supervisionDefaults },
    plans: { tunde: 'general', chidi: 'special' },
    parentAccess: {
      tunde: { active: false, until: null },
      chidi: { active: false, until: null },
    },
    preferences: { fontScale: 1, reduceMotion: false, highContrast: false, notifyRequests: true, notifyGrading: true, notifyPayouts: true, themeMode: 'teal' },
    availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false },
    reports: [],
    supportRequests: [],
    // Existing and demo accounts skip setup; a fresh signup flips this on.
    onboarding: { complete: true, steps: [] },
  }
}

function feedbackFor(score: number, total: number) {
  const ratio = total ? score / total : 0
  if (ratio >= 0.9) return 'Outstanding work! Your answers were accurate and well thought out. Keep this up.'
  if (ratio >= 0.7) return 'Strong effort! Review the questions you missed and try the practice set again.'
  return 'Good attempt. Look over the worked examples in My Classes, then give it another go.'
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SUBMIT_ASSIGNMENT': {
      const existing = state.assignments.find((a) => a.id === action.id)
      if (!existing || existing.status !== 'pending') return state
      const gradingItem: GradingItem | null =
        !action.autoGraded && existing
          ? {
              id: `g-${action.id}-${Date.now()}`,
              assignmentId: action.id,
              title: existing.title,
              context: `${existing.subject} · ${existing.type}`,
              student: existing.stage === 'junior' ? 'Tunde Bakare' : 'Amaka Achebe',
              submitted: 'Just now',
              total: existing.points,
            }
          : null
      return {
        ...state,
        points: state.points + (action.autoGraded ? action.score ?? 0 : 5),
        assignments: state.assignments.map((a) =>
          a.id === action.id
            ? {
                ...a,
                status: action.autoGraded ? 'graded' : 'submitted',
                score: action.autoGraded ? action.score : undefined,
                feedback: action.autoGraded ? feedbackFor(action.score ?? 0, a.points) : undefined,
                submittedAt: 'Just now',
                answerText: action.text,
                attachmentName: action.fileName,
              }
            : a,
        ),
        gradingQueue: action.autoGraded
          ? state.gradingQueue.filter((g) => g.assignmentId !== action.id)
          : gradingItem
            ? [gradingItem, ...state.gradingQueue]
            : state.gradingQueue,
      }
    }
    case 'GRADE_SUBMISSION': {
      const item = state.gradingQueue.find((g) => g.id === action.queueId)
      return {
        ...state,
        gradingQueue: state.gradingQueue.filter((g) => g.id !== action.queueId),
        assignments: item?.assignmentId
          ? state.assignments.map((a) =>
              a.id === item.assignmentId
                ? { ...a, status: 'graded', score: action.score, feedback: action.feedback }
                : a,
            )
          : state.assignments,
      }
    }
    case 'SEND_MESSAGE':
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? {
                ...t,
                unread: 0,
                messages: [
                  ...t.messages,
                  {
                    id: `msg-${Date.now()}`,
                    author: action.author ?? 'You',
                    text: action.text,
                    time: 'Just now',
                    mine: true,
                  },
                ],
              }
            : t,
        ),
      }
    case 'CREATE_THREAD':
      return { ...state, threads: [action.thread, ...state.threads] }
    case 'READ_THREAD':
      return {
        ...state,
        threads: state.threads.map((t) => (t.id === action.threadId ? { ...t, unread: 0 } : t)),
      }
    case 'BOOK_TUTOR':
      return { ...state, bookings: [action.booking, ...state.bookings] }
    case 'ACCEPT_REQUEST': {
      const request = state.tutorRequests.find((r) => r.id === action.id)
      if (!request) return state
      const session: AcceptedSession = {
        id: `as-${action.id}`,
        student: request.student,
        level: request.level,
        topic: request.topic,
        rate: request.rate,
        when: 'Tomorrow, 4:00 PM',
        status: 'confirmed',
      }
      return {
        ...state,
        tutorRequests: state.tutorRequests.filter((r) => r.id !== action.id),
        acceptedSessions: [session, ...state.acceptedSessions],
      }
    }
    case 'DECLINE_REQUEST':
      return { ...state, tutorRequests: state.tutorRequests.filter((r) => r.id !== action.id) }
    case 'ADD_POINTS':
      return { ...state, points: state.points + action.amount }
    case 'SET_MOOD': {
      const history = [action.mood, ...state.moodHistory.filter((m) => m.date !== action.mood.date)].slice(0, 7)
      return { ...state, mood: action.mood, moodHistory: history }
    }
    case 'COMPLETE_ACTIVITY': {
      if (state.completedActivities.includes(action.id)) return state
      return {
        ...state,
        completedActivities: [...state.completedActivities, action.id],
        totalActivityMinutes: state.totalActivityMinutes + action.minutes,
        points: state.points + action.points,
      }
    }
    case 'ADD_FOCUS':
      return { ...state, focusMinutes: state.focusMinutes + action.minutes }
    case 'SAVE_QUIZ_SCORE':
      return {
        ...state,
        quizScores: {
          ...state.quizScores,
          [action.quizId]: Math.max(state.quizScores[action.quizId] ?? 0, action.score),
        },
      }
    case 'CREATE_ASSIGNMENT': {
      const stage: 'junior' | 'senior' = action.level.startsWith('JSS') ? 'junior' : 'senior'
      const assignment: Assignment = { ...action.assignment, stage }
      return { ...state, assignments: [assignment, ...state.assignments] }
    }
    case 'CREATE_CLASS':
      return { ...state, teacherClasses: [...state.teacherClasses, action.klass] }
    case 'ADD_RESOURCE':
      return { ...state, contentLibrary: [action.resource, ...state.contentLibrary] }
    case 'MARK_NOTIFICATIONS_READ':
      return { ...state, notificationsRead: true }
    case 'MARK_ALERTS_READ':
      return { ...state, alertsRead: true }
    case 'TOGGLE_SUPERVISION':
      return {
        ...state,
        supervision: { ...state.supervision, [action.key]: !state.supervision[action.key] },
      }
    case 'CHANGE_PLAN':
      return { ...state, plans: { ...state.plans, [action.child]: action.plan } }
    case 'SET_PARENT_ACCESS':
      return {
        ...state,
        parentAccess: {
          ...state.parentAccess,
          [action.child]: {
            active: action.active,
            until: action.active ? (action.until ?? oneMonthFromNow()) : null,
          },
        },
      }
    case 'SET_PREF':
      return {
        ...state,
        preferences: { ...state.preferences, [action.key]: action.value } as Preferences,
      }
    case 'TOGGLE_AVAILABILITY':
      return {
        ...state,
        availability: { ...state.availability, [action.day]: !state.availability[action.day] },
      }
    case 'ADD_REPORT':
      return { ...state, reports: [action.report, ...state.reports] }
    case 'ADD_SUPPORT_REQUEST':
      return { ...state, supportRequests: [action.request, ...state.supportRequests] }
    case 'MARK_ONBOARDING_STEP': {
      const done = state.onboarding.steps.includes(action.step)
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          steps: done
            ? state.onboarding.steps.filter((step) => step !== action.step)
            : [...state.onboarding.steps, action.step],
        },
      }
    }
    case 'FINISH_ONBOARDING':
      return { ...state, onboarding: { ...state.onboarding, complete: true } }
    case 'HYDRATE':
      return action.state
    case 'RESET':
      return makeInitialState()
    default:
      return state
  }
}

function normalizeState(parsed: Partial<AppState>): AppState {
  const initial = makeInitialState()
  const prefs: Partial<Preferences> = parsed.preferences ?? {}
  const onboarding = parsed.onboarding
  return {
    ...initial,
    ...parsed,
    newAccount: parsed.newAccount === true,
    preferences: {
      ...initial.preferences,
      ...prefs,
      // Older saves may still hold the retired "burnt"/"forest" values.
      themeMode: prefs.themeMode === 'classic' ? 'classic' : 'teal',
    },
    plans: { ...initial.plans, ...(parsed.plans ?? {}) },
    parentAccess: { ...initial.parentAccess, ...(parsed.parentAccess ?? {}) },
    supervision: { ...initial.supervision, ...(parsed.supervision ?? {}) },
    availability: { ...initial.availability, ...(parsed.availability ?? {}) },
    quizScores: { ...initial.quizScores, ...(parsed.quizScores ?? {}) },
    // Saves written before first-run setup existed belong to returning users.
    onboarding: {
      complete: onboarding?.complete !== false,
      steps: Array.isArray(onboarding?.steps)
        ? onboarding.steps.filter((step): step is string => typeof step === 'string')
        : [],
    },
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return makeInitialState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (!parsed || typeof parsed !== 'object') return makeInitialState()
    return normalizeState(parsed)
  } catch {
    return makeInitialState()
  }
}

interface StoreValue {
  state: AppState
  dispatch: Dispatch<Action>
  ready: boolean
  threadsFor: (audience: Audience) => Thread[]
  childName: (child: ChildId) => string
}

const StoreContext = createContext<StoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { configured, session } = useAuth()
  const userId = session?.user?.id ?? null
  const [state, dispatch] = useReducer(reducer, undefined, () => (configured ? makeInitialState() : loadState()))
  const [ready, setReady] = useState(!configured)
  // Guards the autosave so a freshly hydrated page never writes back the same
  // state: a payment webhook can land between hydrate and the debounced save.
  const syncedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!configured || !supabase) {
      setReady(true)
      return
    }
    if (!userId) {
      setReady(false)
      dispatch({ type: 'RESET' })
      return
    }

    let cancelled = false
    setReady(false)

    async function hydrate(id: string) {
      const { data, error } = await supabase!
        .from('user_state')
        .select('state')
        .eq('user_id', id)
        .maybeSingle()
      if (cancelled) return

      const stored = !error && data ? (data.state as Partial<AppState> | null) : null
      const hasState = Boolean(stored && typeof stored === 'object' && Object.keys(stored).length > 0)
      // A signup marker plus no saved state means this is the account's first run.
      const firstRun = !hasState && hasPendingOnboarding(id)
      const next = hasState
        ? normalizeState(stored as Partial<AppState>)
        : { ...makeInitialState(), newAccount: firstRun, onboarding: { complete: !firstRun, steps: [] } }

      // Do not write here: an eager snapshot of the first-run state can land
      // after the user finishes setup and overwrite it. Leaving syncedRef empty
      // makes the autosave effect persist whatever state the user actually ends
      // up with, so there is a single write path.
      syncedRef.current = hasState ? JSON.stringify(next) : null
      dispatch({ type: 'HYDRATE', state: next })

      if (!hasState) clearOnboardingPending(id)
      if (!cancelled) setReady(true)
    }

    void hydrate(userId).catch((error: unknown) => {
      if (cancelled) return
      console.warn('Could not load your learning data:', error)
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [configured, userId])

  useEffect(() => {
    if (!ready) return

    if (!configured) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Storage may be unavailable in private browsing; the app still works in memory.
      }
      return
    }

    if (!userId || !supabase) return
    const snapshot = JSON.stringify(state)
    if (snapshot === syncedRef.current) return
    const client = supabase
    const timer = setTimeout(() => {
      async function save() {
        let next = state
        if (paymentsConfigured) {
          // Plans are server-owned once payments are live: a tab that was open
          // during checkout must not write its old plans back over the charge.
          const { data } = await client
            .from('user_state')
            .select('state')
            .eq('user_id', userId)
            .maybeSingle()
          const serverPlans = (data?.state as Partial<AppState> | null)?.plans
          if (serverPlans) next = { ...state, plans: { ...state.plans, ...serverPlans } }
        }
        const { error } = await client
          .from('user_state')
          .upsert({ user_id: userId, state: next, updated_at: new Date().toISOString() })
        if (error) console.warn('Could not save your learning data:', error.message)
        else syncedRef.current = snapshot
      }
      void save()
    }, 700)

    return () => clearTimeout(timer)
  }, [state, ready, configured, userId])

  const value = useMemo<StoreValue>(
    () => ({
      state,
      dispatch,
      ready,
      threadsFor: (audience) => state.threads.filter((t) => t.audience === audience),
      childName: (child) => (child === 'tunde' ? 'Tunde Bakare' : 'Chidi Eze'),
    }),
    [state, ready],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useApp() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useApp must be used inside AppStoreProvider')
  return ctx
}
