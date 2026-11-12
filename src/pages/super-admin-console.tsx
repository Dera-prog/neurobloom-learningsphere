import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Cloud,
  CreditCard,
  Crown,
  Database,
  FileText,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  Receipt,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { cn, initials, naira } from '../lib/utils'

const SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    blurb: 'Who is on the platform, what has been paid, and what is connected.',
    copy: 'Live figures straight from the platform database: who is on the platform, what has been paid, and which integrations are actually connected.',
  },
  {
    id: 'access',
    label: 'Access & roles',
    icon: Users,
    blurb: 'Every account stored on the platform.',
    copy: 'Every account stored on the platform, read live from the profiles table. Roles are fixed at sign-up, and only this seat can promote someone to administrator.',
  },
  {
    id: 'safeguarding',
    label: 'Safeguarding',
    icon: ShieldCheck,
    blurb: 'Flagged incidents from classes, chat and shared content.',
    copy: 'Flagged incidents across live classes, chat and shared content. Because children — including children with additional needs — use the platform, these belong on this desk first.',
  },
  {
    id: 'compliance',
    label: 'Data & compliance',
    icon: Lock,
    blurb: 'Protections enforced by the platform and the records stored.',
    copy: 'The protections enforced by the platform itself, plus how many records are actually stored.',
  },
  {
    id: 'platform',
    label: 'Platform & live ops',
    icon: Settings,
    blurb: 'Configuration and integrations reported by the running platform.',
    copy: 'Configuration and integrations reported by the running platform — not estimates.',
  },
  {
    id: 'admins',
    label: 'Admins & activity',
    icon: UserCheck,
    blurb: 'The accounts that hold administrator access.',
    copy: 'The accounts that actually hold administrator access, with their latest sign-in taken from the auth service.',
  },
  {
    id: 'vendors',
    label: 'Vendors & licences',
    icon: Receipt,
    blurb: 'The services the classroom depends on.',
    copy: 'The services the classroom depends on and the state each one is actually reporting.',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    blurb: 'Measures pulled from the live database at load time.',
    copy: 'Measures pulled from the live database at load time. Anything the platform cannot yet measure is not shown here.',
  },
] as const

const PROFILE_SECTION = {
  id: 'profile',
  label: 'Profile',
  icon: UserCheck,
  blurb: 'Your Super Admin identity and what this seat owns.',
  copy: 'Your owner-level identity on the platform, read from the auth service and the live console feed.',
} as const

const ALL_SECTIONS = [...SECTIONS, PROFILE_SECTION]

type SectionId = (typeof SECTIONS)[number]['id']

const profilePath = '/super-admin/console/profile'
const pathFor = (id: SectionId) => (id === 'overview' ? '/super-admin/console' : `/super-admin/console/${id}`)

/* ------------------------------ Live data -------------------------------- */

interface AccountRow {
  id: string
  role: 'junior' | 'senior' | 'special' | 'teacher' | 'parent' | 'admin'
  name: string
  email: string
  joinedAt: string
  lastSignInAt: string | null
}

interface PaymentRow {
  id: string
  user_id: string
  child_id: string
  plan_id: string
  reference: string
  amount: number
  currency: string
  status: string
  channel: string | null
  paid_at: string | null
  created_at: string
}

interface EmailRow {
  id: string
  recipient: string
  kind: string
  status: string
  detail: string | null
  created_at: string
}

interface Integrations {
  payments: boolean
  email: boolean
  database: boolean
}

interface ConsoleData {
  generatedAt: string
  integrations: Integrations
  paystackMode: 'live' | 'test' | null
  evaluationReports: number | null
  accounts: AccountRow[]
  payments: PaymentRow[]
  emails: EmailRow[]
  progress: { tracked: number; activeThisWeek: number }
}

interface FeedState {
  status: 'loading' | 'ready' | 'error'
  data: ConsoleData | null
  error?: string
}

function useConsoleFeed() {
  const [feed, setFeed] = useState<FeedState>({ status: 'loading', data: null })

  const load = useCallback(async () => {
    setFeed((current) => ({ ...current, status: 'loading' }))
    if (!supabase) {
      setFeed({ status: 'error', data: null, error: 'Supabase is not configured in this build.' })
      return
    }
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setFeed({ status: 'error', data: null, error: 'Your session expired. Sign in again to load live data.' })
      return
    }
    try {
      const response = await fetch('/api/super-admin-data', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        setFeed({
          status: 'error',
          data: null,
          error: body?.message || `The live data request failed (${response.status}).`,
        })
        return
      }
      setFeed({ status: 'ready', data: body as ConsoleData })
    } catch {
      setFeed({ status: 'error', data: null, error: 'Could not reach the platform data service.' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { ...feed, reload: load }
}

/* -------------------------------- Helpers -------------------------------- */

const ROLE_LABEL: Record<AccountRow['role'], string> = {
  junior: 'Junior secondary',
  senior: 'Senior secondary',
  special: 'Special-needs learner',
  teacher: 'Teacher',
  parent: 'Parent / guardian',
  admin: 'Administrator',
}

const PLAN_LABEL: Record<string, string> = {
  general: 'General Plan',
  premium: 'Premium Plan',
  premium_plus: 'Premium Plus',
  special: 'Special Needs Premium',
  parent_access: 'Parent Access',
}

const dateFmt = new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit' })

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date)
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : `${dateFmt.format(date)} · ${timeFmt.format(date)}`
}

function formatTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : timeFmt.format(date)
}

function childName(id: string) {
  return id ? id.charAt(0).toUpperCase() + id.slice(1) : '—'
}

type Tone = 'ok' | 'warn' | 'urgent' | 'info' | 'neutral'

const CHIP_TONE: Record<Tone, string> = {
  ok: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25',
  warn: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
  urgent: 'bg-red-400/10 text-red-300 border-red-400/25',
  info: 'bg-indigo-400/15 text-indigo-200 border-indigo-400/30',
  neutral: 'bg-white/[0.06] text-white/65 border-white/10',
}

function Chip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        CHIP_TONE[tone],
      )}
    >
      {children}
    </span>
  )
}

function Panel({
  title,
  icon: Icon,
  badge,
  action,
  children,
  className,
}: {
  title: string
  icon?: LucideIcon
  badge?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-white/10 bg-white/[0.04]', action ? 'overflow-visible' : 'overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#a5b4fc]">
              <Icon size={14} />
            </span>
          ) : null}
          <h2 className="truncate text-[13px] font-bold text-white">{title}</h2>
        </div>
        {action ?? (badge ? (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/55">
            {badge}
          </span>
        ) : null)}
      </div>
      <div className="px-4 py-3.5 sm:px-5">{children}</div>
    </section>
  )
}

function Row({ label, value, tone, note }: { label: string; value: string; tone?: Tone; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] py-2.5 last:border-0">
      <span className="min-w-0">
        <span className="block text-[12px] font-medium text-white/60">{label}</span>
        {note ? <span className="mt-0.5 block text-[10px] leading-relaxed text-white/35">{note}</span> : null}
      </span>
      {tone ? (
        <span className="shrink-0 pt-0.5">
          <Chip tone={tone}>{value}</Chip>
        </span>
      ) : (
        <span className="shrink-0 pt-0.5 text-right text-[12px] font-semibold text-white">{value}</span>
      )}
    </div>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3.5 text-[12px] leading-relaxed text-white/50">
      {children}
    </p>
  )
}

function Avatar({ name, tone = 'info' }: { name: string; tone?: 'info' | 'neutral' }) {
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
        tone === 'info' ? 'bg-indigo-400/15 text-indigo-200' : 'bg-white/10 text-white/70',
      )}
      aria-hidden
    >
      {initials(name || '?')}
    </span>
  )
}

const STAT_TONES = {
  indigo: 'bg-indigo-400/15 text-indigo-300',
  emerald: 'bg-emerald-400/15 text-emerald-300',
  amber: 'bg-amber-400/15 text-amber-300',
  violet: 'bg-violet-400/15 text-violet-300',
} as const

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'indigo',
}: {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  tone?: keyof typeof STAT_TONES
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/45">{label}</p>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', STAT_TONES[tone])}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight text-white">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium text-white/45">{sub}</p>
    </div>
  )
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[12px] font-semibold text-white/60">
      <RefreshCw size={14} className="animate-spin" /> {label}
    </div>
  )
}

function DotList({ items }: { items: Array<{ title: string; detail: string }> }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a5b4fc]" aria-hidden />
          <span>
            <span className="block text-[12px] font-semibold text-white/85">{item.title}</span>
            <span className="block text-[11px] leading-relaxed text-white/45">{item.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

interface Derived {
  accounts: AccountRow[]
  payments: PaymentRow[]
  emails: EmailRow[]
  successful: PaymentRow[]
  settled: number
  learners: number
  teachers: number
  admins: AccountRow[]
  countRole: (role: AccountRow['role']) => number
  names: Map<string, string>
  latestPayment: string | null
  failedEmails: number
  liveIntegrations: number
  recentSignIns: number
  neverSignedIn: number
  planMix: Array<{ plan: string; count: number; kobo: number }>
}

/* -------------------------------- Console -------------------------------- */

export function SuperAdminConsole() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const params = useParams<{ section?: string }>()
  const feed = useConsoleFeed()
  const data = feed.data
  const name = profile?.full_name || 'Super Admin'
  const email = profile?.email || 'Owner access'

  const active = ALL_SECTIONS.find((item) => item.id === params.section) ?? SECTIONS[0]
  const knownSection = !params.section || ALL_SECTIONS.some((item) => item.id === params.section)

  useEffect(() => {
    if (!knownSection) navigate('/super-admin/console', { replace: true })
  }, [knownSection, navigate])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [active.id])

  const [accountsMenuOpen, setAccountsMenuOpen] = useState(false)
  const accountsMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setAccountsMenuOpen(false)
  }, [active.id])

  useEffect(() => {
    if (!accountsMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (accountsMenuRef.current && !accountsMenuRef.current.contains(event.target as Node)) {
        setAccountsMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountsMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [accountsMenuOpen])

  async function handleSignOut() {
    await signOut()
    navigate('/super-admin')
  }

  const derived = useMemo<Derived>(() => {
    const accounts = data?.accounts ?? []
    const payments = data?.payments ?? []
    const emails = data?.emails ?? []
    const successful = payments.filter((payment) => payment.status === 'success')
    const settledKobo = successful.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    const countRole = (role: AccountRow['role']) => accounts.filter((account) => account.role === role).length
    const learners = countRole('junior') + countRole('senior') + countRole('special')
    const names = new Map(accounts.map((account) => [account.id, account.name || account.email || 'Unknown account']))
    const latestPayment = successful[0]?.paid_at || successful[0]?.created_at || null
    const failedEmails = emails.filter((item) => item.status !== 'sent' && item.status !== 'delivered').length
    const liveIntegrations = [data?.integrations.payments, data?.integrations.email].filter(Boolean).length
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentSignIns = accounts.filter(
      (account) => account.lastSignInAt && new Date(account.lastSignInAt).getTime() >= weekAgo,
    ).length
    const neverSignedIn = accounts.filter((account) => !account.lastSignInAt).length
    const mix = new Map<string, { plan: string; count: number; kobo: number }>()
    for (const payment of successful) {
      const entry = mix.get(payment.plan_id) ?? { plan: payment.plan_id, count: 0, kobo: 0 }
      entry.count += 1
      entry.kobo += Number(payment.amount) || 0
      mix.set(payment.plan_id, entry)
    }
    return {
      accounts,
      payments,
      emails,
      successful,
      settled: settledKobo / 100,
      learners,
      teachers: countRole('teacher'),
      admins: accounts.filter((account) => account.role === 'admin'),
      countRole,
      names,
      latestPayment,
      failedEmails,
      liveIntegrations,
      recentSignIns,
      neverSignedIn,
      planMix: [...mix.values()].sort((a, b) => b.kobo - a.kobo),
    }
  }, [data])

  const integrations = data?.integrations
  const waiting = feed.status === 'loading' && !data
  const reportFiles = data?.evaluationReports
  const paystackModeLabel =
    data?.paystackMode === 'live' ? 'Live keys' : data?.paystackMode === 'test' ? 'Test keys' : 'Not configured'
  const reportFilesLabel = reportFiles == null ? 'Bucket unavailable' : reportFiles.toLocaleString()
  const me = derived.accounts.find((account) => account.id === profile?.id) ?? null

  function renderSection() {
    if (active.id === 'overview') {
      if (waiting) return <LoadingBlock label="Loading platform figures…" />
      if (!data) return null
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Accounts on platform"
              value={derived.accounts.length.toLocaleString()}
              sub={`${derived.learners} learner${derived.learners === 1 ? '' : 's'} · ${derived.teachers} teacher${derived.teachers === 1 ? '' : 's'}`}
              icon={Users}
            />
            <StatCard
              label="Revenue settled"
              value={naira(derived.settled, true)}
              sub={`${derived.successful.length} successful payment${derived.successful.length === 1 ? '' : 's'}`}
              icon={Receipt}
              tone="emerald"
            />
            <StatCard
              label="Administrator seats"
              value={derived.admins.length.toLocaleString()}
              sub="Owner-level access"
              icon={ShieldCheck}
              tone="violet"
            />
            <StatCard
              label="Active this week"
              value={data.progress.activeThisWeek.toLocaleString()}
              sub={`of ${data.progress.tracked} with saved progress`}
              icon={Activity}
              tone="amber"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr]">
            <Panel
              title="Recent payments"
              icon={CreditCard}
              badge={derived.payments.length ? `${derived.payments.length} in ledger` : 'ledger empty'}
            >
              {derived.payments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Date', 'Account', 'Plan', 'Amount', 'Status'].map((heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="px-1.5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white/40"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {derived.payments.slice(0, 6).map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-white/[0.07] transition last:border-0 hover:bg-white/[0.03]"
                        >
                          <td className="whitespace-nowrap px-1.5 py-2.5 text-[11px] text-white/50">
                            {formatDate(payment.paid_at || payment.created_at)}
                          </td>
                          <td className="max-w-[150px] px-1.5 py-2.5">
                            <span className="flex items-center gap-2">
                              <Avatar name={derived.names.get(payment.user_id) ?? '?'} />
                              <span className="truncate text-[12px] font-semibold text-white/85">
                                {derived.names.get(payment.user_id) ?? 'Unknown account'}
                              </span>
                            </span>
                          </td>
                          <td className="px-1.5 py-2.5 text-[11px] text-white/55">
                            {PLAN_LABEL[payment.plan_id] ?? payment.plan_id} · {childName(payment.child_id)}
                          </td>
                          <td className="whitespace-nowrap px-1.5 py-2.5 text-[12px] font-bold text-white">
                            {naira((Number(payment.amount) || 0) / 100)}
                          </td>
                          <td className="px-1.5 py-2.5">
                            <Chip tone={payment.status === 'success' ? 'ok' : 'warn'}>{payment.status}</Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyNote>No charges have been recorded yet. Successful Paystack checkouts will appear here automatically.</EmptyNote>
              )}
            </Panel>
            <Panel title="Integration status" icon={Activity}>
              <Row
                label="Supabase database"
                value={integrations?.database ? 'Connected' : 'Unavailable'}
                tone={integrations?.database ? 'ok' : 'warn'}
              />
              <Row
                label="Paystack payments"
                value={integrations?.payments ? 'Connected' : 'Not configured'}
                tone={integrations?.payments ? 'ok' : 'warn'}
              />
              <Row
                label="Mailgun email"
                value={integrations?.email ? 'Connected' : 'Setup needed'}
                tone={integrations?.email ? 'ok' : 'warn'}
              />
              <Row label="Latest payment" value={derived.latestPayment ? formatDateTime(derived.latestPayment) : 'None yet'} />
            </Panel>
          </div>

          <Panel
            title="Newest accounts"
            icon={Users}
            action={
              <div ref={accountsMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountsMenuOpen((open) => !open)}
                  aria-expanded={accountsMenuOpen}
                  aria-haspopup="true"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  {derived.accounts.length} total
                  <ChevronDown size={12} className={cn('transition', accountsMenuOpen && 'rotate-180')} />
                </button>
                {accountsMenuOpen ? (
                  <div className="absolute right-0 top-full z-30 mt-2 w-[26rem] max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-white/15 bg-[#1d1843] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]">
                    <p className="border-b border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white/45">
                      All platform accounts
                    </p>
                    <ul data-accounts-menu className="max-h-72 overflow-y-auto">
                      {derived.accounts.map((account) => (
                        <li
                          key={account.id}
                          className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2.5 last:border-0"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Avatar name={account.name || account.email || '?'} />
                            <span className="min-w-0">
                              <span className="block truncate text-[12px] font-semibold text-white/85">
                                {account.name || 'Unnamed account'}
                              </span>
                              <span className="block truncate text-[10px] text-white/45">{account.email || 'No email'}</span>
                            </span>
                          </span>
                          <Chip tone={account.role === 'admin' ? 'info' : 'neutral'}>
                            {ROLE_LABEL[account.role] ?? account.role}
                          </Chip>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            }
          >
            {derived.accounts.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {derived.accounts.slice(0, 4).map((account) => (
                  <li
                    key={account.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5 transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={account.name || account.email || '?'} />
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold text-white/85">
                          {account.name || account.email}
                        </span>
                        <span className="block truncate text-[11px] text-white/45">{account.email || 'No email on file'}</span>
                      </span>
                    </span>
                    <Chip tone={account.role === 'admin' ? 'info' : 'neutral'}>{ROLE_LABEL[account.role] ?? account.role}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote>No accounts yet.</EmptyNote>
            )}
          </Panel>
        </div>
      )
    }

    if (active.id === 'access') {
      if (waiting) return <LoadingBlock label="Loading accounts…" />
      if (!data) return null
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(['admin', 'teacher', 'parent', 'junior', 'senior', 'special'] as const).map((role) => (
              <Chip key={role} tone={role === 'admin' ? 'info' : 'neutral'}>
                {ROLE_LABEL[role]} · {derived.countRole(role)}
              </Chip>
            ))}
          </div>
          <Panel title="All platform accounts" icon={Users} badge={`${derived.accounts.length} accounts`}>
            <div className="-mx-4 overflow-x-auto sm:-mx-5">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Account', 'Role', 'Joined', 'Last sign-in'].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white/40 sm:px-5"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {derived.accounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b border-white/[0.07] transition last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3 sm:px-5">
                        <span className="flex items-center gap-2.5">
                          <Avatar name={account.name || account.email || '?'} />
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] font-semibold text-white/85">
                              {account.name || 'Unnamed account'}
                            </span>
                            <span className="block truncate text-[11px] text-white/45">{account.email || 'No email'}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Chip tone={account.role === 'admin' ? 'info' : 'neutral'}>
                          {ROLE_LABEL[account.role] ?? account.role}
                        </Chip>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[11px] text-white/55 sm:px-5">{formatDate(account.joinedAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[11px] text-white/55 sm:px-5">
                        {account.lastSignInAt ? formatDateTime(account.lastSignInAt) : 'Never signed in'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!derived.accounts.length ? <p className="pt-3 text-[12px] text-white/50">No accounts yet.</p> : null}
          </Panel>
        </div>
      )
    }

    if (active.id === 'safeguarding') {
      if (waiting) return <LoadingBlock label="Loading safeguarding figures…" />
      if (!data) return null
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Learners on platform"
              value={derived.learners.toLocaleString()}
              sub="Junior, senior and special-needs"
              icon={Users}
            />
            <StatCard
              label="Parents / guardians"
              value={derived.countRole('parent').toLocaleString()}
              sub="Guardian accounts on file"
              icon={ShieldCheck}
              tone="violet"
            />
            <StatCard
              label="Evaluation reports on file"
              value={reportFilesLabel}
              sub={reportFiles == null ? 'Private bucket could not be listed' : 'Stored in the private report bucket'}
              icon={FileText}
              tone="emerald"
            />
          </div>

          <Panel title="Incident queue" icon={LifeBuoy}>
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/50">
                <LifeBuoy size={15} />
              </span>
              <div>
                <p className="text-[12px] font-bold text-white/85">No incident log is connected yet</p>
                <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-white/50">
                  The platform has no safeguarding table, so this queue is intentionally empty rather than filled with sample
                  incidents. Once an incident register is added, flagged cases will be reviewed here.
                </p>
              </div>
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Protections in force" icon={ShieldCheck}>
              <Row label="Role fixed at sign-up" note="Accounts cannot self-select administrator access" value="On" tone="ok" />
              <Row
                label="Guardian sign-off gate"
                note="Review mode until a verification sender is wired"
                value="Review mode"
                tone="warn"
              />
              <Row label="Per-role dashboards" note="Each role only sees its own workspace" value="On" tone="ok" />
              <Row label="Evaluation reports" note="Read from a private storage bucket" value="Private" tone="ok" />
              <Row label="Console access" note="Verified by the server on every request" value="Server-checked" tone="ok" />
            </Panel>
            <Panel title="What the register will hold" icon={FileText}>
              <DotList
                items={[
                  { title: 'Date raised and reporter', detail: 'Who logged the case and when it was opened.' },
                  { title: 'Learner reference', detail: 'Linked by account reference, never names inside summaries.' },
                  { title: 'Class or session', detail: 'The live class, chat thread or shared item involved.' },
                  { title: 'Category and severity', detail: 'So cases can be triaged and escalated consistently.' },
                  { title: 'Action taken and owner', detail: 'The decision, the person responsible and the follow-up date.' },
                ]}
              />
              <p className="mt-3 text-[10px] leading-relaxed text-white/35">
                Nothing is stored in this queue today — these are the fields the register is scoped to hold once it ships.
              </p>
            </Panel>
          </div>
        </div>
      )
    }

    if (active.id === 'compliance') {
      if (waiting) return <LoadingBlock label="Loading stored records…" />
      if (!data) return null
      return (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Controls in force" icon={Lock}>
              <Row label="Row-level security" value="On · every table" tone="ok" />
              <Row label="Console access" value="Server-verified role" tone="ok" />
              <Row label="Service role key" value="Server-side only" tone="ok" />
              <Row label="Evaluation reports" value="Private bucket" tone="ok" />
              <Row label="Payment ledger writes" value="Server-side only" tone="ok" />
              <Row
                label="Email delivery"
                value={integrations?.email ? 'Connected' : 'Mailgun setup needed'}
                tone={integrations?.email ? 'ok' : 'warn'}
              />
            </Panel>
            <Panel title="Stored records" icon={Database}>
              <Row label="Accounts" value={derived.accounts.length.toLocaleString()} />
              <Row label="Saved progress records" value={data.progress.tracked.toLocaleString()} />
              <Row label="Payment records" value={derived.payments.length.toLocaleString()} />
              <Row label="Email log records" value={derived.emails.length.toLocaleString()} />
              <Row label="Evaluation report files" value={reportFilesLabel} />
            </Panel>
          </div>
          <Panel title="How data is handled" icon={KeyRound}>
            <Row label="Card details" value="Handled by Paystack" />
            <Row label="Passwords" value="Hashed by Supabase auth" />
            <Row label="Service keys" value="Server-side environment only" />
            <Row label="Evaluation reports" value="Private bucket" />
            <Row label="Account deletion" value="Cascades to progress & payments" />
          </Panel>
        </div>
      )
    }

    if (active.id === 'platform') {
      if (waiting) return <LoadingBlock label="Loading platform status…" />
      if (!data) return null
      return (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Configuration & health" icon={Settings}>
              <Row
                label="Supabase database"
                value={integrations?.database ? 'Connected' : 'Unavailable'}
                tone={integrations?.database ? 'ok' : 'warn'}
              />
              <Row
                label="Paystack payments"
                value={integrations?.payments ? 'Connected' : 'Not configured'}
                tone={integrations?.payments ? 'ok' : 'warn'}
              />
              <Row
                label="Paystack mode"
                value={data.paystackMode === 'live' ? 'Live keys' : data.paystackMode === 'test' ? 'Test keys' : 'Not configured'}
                tone={data.paystackMode === 'live' ? 'ok' : data.paystackMode === 'test' ? 'info' : 'warn'}
              />
              <Row
                label="Mailgun email"
                value={integrations?.email ? 'Connected' : 'Setup needed'}
                tone={integrations?.email ? 'ok' : 'warn'}
              />
              <Row label="Accounts active this week" value={`${data.progress.activeThisWeek} of ${data.progress.tracked}`} />
              <Row label="Latest payment" value={derived.latestPayment ? formatDateTime(derived.latestPayment) : 'None yet'} />
              <Row label="Data refreshed" value={formatDateTime(data.generatedAt)} />
            </Panel>
            <Panel title="Email delivery log" icon={Mail} badge={`${derived.emails.length} logged`}>
              {derived.emails.length ? (
                <ul className="space-y-2">
                  {derived.emails.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5 transition hover:bg-white/[0.05]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold text-white/85">{item.recipient}</span>
                        <span className="block text-[10px] text-white/45">
                          {item.kind} · {formatDateTime(item.created_at)}
                        </span>
                      </span>
                      <Chip tone={item.status === 'sent' || item.status === 'delivered' ? 'ok' : 'warn'}>{item.status}</Chip>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyNote>
                  {integrations?.email
                    ? 'No email has been logged yet. Plan, booking and support emails will appear here once sent.'
                    : 'Mailgun is not configured, so no email has been sent or logged. Add the Mailgun key and domain to turn delivery on.'}
                </EmptyNote>
              )}
            </Panel>
          </div>
          <Panel title="Data stores" icon={Database}>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Row label="Accounts" value={derived.accounts.length.toLocaleString()} />
              <Row label="Saved progress records" value={data.progress.tracked.toLocaleString()} />
              <Row label="Payment records" value={derived.payments.length.toLocaleString()} />
              <Row label="Email log records" value={derived.emails.length.toLocaleString()} />
              <Row label="Evaluation report files" value={reportFilesLabel} />
              <Row label="Active this week" value={data.progress.activeThisWeek.toLocaleString()} />
            </div>
          </Panel>
        </div>
      )
    }

    if (active.id === 'admins') {
      if (waiting) return <LoadingBlock label="Loading administrator accounts…" />
      if (!data) return null
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const adminsRecent = derived.admins.filter(
        (admin) => admin.lastSignInAt && new Date(admin.lastSignInAt).getTime() >= weekAgo,
      ).length
      const adminsNever = derived.admins.filter((admin) => !admin.lastSignInAt).length
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Administrator seats"
              value={derived.admins.length.toLocaleString()}
              sub="Held by owner-level accounts"
              icon={ShieldCheck}
              tone="violet"
            />
            <StatCard
              label="Signed in past 7 days"
              value={adminsRecent.toLocaleString()}
              sub="From the auth service"
              icon={UserCheck}
              tone="emerald"
            />
            <StatCard
              label="Never signed in"
              value={adminsNever.toLocaleString()}
              sub="Seats created but unused"
              icon={Activity}
              tone="amber"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
            <Panel title="Administrator seats" icon={Users} badge={`${derived.admins.length} held`}>
              {derived.admins.length ? (
                <ul className="space-y-2">
                  {derived.admins.map((admin) => (
                    <li
                      key={admin.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5 transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={admin.name || admin.email || '?'} tone="info" />
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-semibold text-white/85">
                            {admin.name || admin.email}
                          </span>
                          <span className="block truncate text-[11px] text-white/45">{admin.email}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <Chip tone="info">Administrator</Chip>
                        <span className="mt-1 block text-[10px] text-white/35">
                          {admin.lastSignInAt ? `Last in ${formatDate(admin.lastSignInAt)}` : 'Never signed in'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyNote>No administrator accounts found.</EmptyNote>
              )}
            </Panel>
            <Panel title="Administrator capabilities" icon={KeyRound}>
              <Row label="Promote or remove administrators" value="Owner seat" tone="info" />
              <Row label="Read every account" value="Allowed" tone="ok" />
              <Row label="Payments ledger" value="Read-only" />
              <Row label="Email delivery log" value="Read-only" />
              <Row label="Evaluation reports" value="Private bucket" />
              <Row label="Admin Manager workspace" value="Separate console" />
            </Panel>
          </div>
        </div>
      )
    }

    if (active.id === 'vendors') {
      if (waiting) return <LoadingBlock label="Loading vendor status…" />
      if (!data) return null
      const cards = [
        {
          name: 'Supabase',
          use: 'Database, accounts & private storage',
          icon: Database,
          ok: Boolean(integrations?.database),
          okText: 'Connected',
          badText: 'Unavailable',
        },
        {
          name: 'Vercel',
          use: 'Hosting & serverless API',
          icon: Cloud,
          ok: true,
          okText: 'Serving this console',
          badText: '',
        },
        {
          name: 'Paystack',
          use: 'Payments & subscriptions',
          icon: CreditCard,
          ok: Boolean(integrations?.payments),
          okText: 'Connected',
          badText: 'Not configured',
        },
        {
          name: 'Mailgun',
          use: 'Transactional email',
          icon: Mail,
          ok: Boolean(integrations?.email),
          okText: 'Connected',
          badText: 'Setup needed',
        },
      ]
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((vendor) => (
              <div
                key={vendor.name}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#a5b4fc]">
                    <vendor.icon size={17} />
                  </span>
                  <Chip tone={vendor.ok ? 'ok' : 'warn'}>{vendor.ok ? vendor.okText : vendor.badText}</Chip>
                </div>
                <p className="mt-3 text-[13px] font-bold text-white">{vendor.name}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">{vendor.use}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Credentials held server-side" icon={KeyRound}>
              <Row
                label="Paystack secret key"
                note="Used only by the serverless payment endpoints"
                value={integrations?.payments ? 'Configured' : 'Missing'}
                tone={integrations?.payments ? 'ok' : 'warn'}
              />
              <Row label="Supabase service role" note="Never sent to the browser" value="Server-side only" tone="ok" />
              <Row
                label="Mailgun key and domain"
                note="Required before real email can be sent"
                value={integrations?.email ? 'Configured' : 'Missing'}
                tone={integrations?.email ? 'ok' : 'warn'}
              />
            </Panel>
            <Panel title="Environment & licensing" icon={Settings}>
              <Row label="Hosting" value="Vercel" />
              <Row label="API runtime" value="Serverless functions" />
              <Row label="Database" value="Supabase Postgres" />
              <Row label="Payments mode" value={paystackModeLabel} tone={data.paystackMode ? 'ok' : 'warn'} />
              <Row label="Email delivery" value={integrations?.email ? 'Mailgun configured' : 'Not configured'} />
              <Row label="Licence records" value="Not stored on this platform" />
            </Panel>
          </div>
        </div>
      )
    }

    if (active.id === 'profile') {
      return (
        <div className="space-y-3">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
            <div className="relative px-5 py-6 sm:px-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#4338ca]/35 blur-3xl"
              />
              <div className="relative flex flex-wrap items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-lg font-extrabold text-white shadow-[0_18px_40px_-18px_rgba(99,102,241,0.9)]">
                  {initials(name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight text-white">{name}</h2>
                    <Chip tone="info">Super Admin</Chip>
                    <Chip tone="neutral">Owner seat</Chip>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-white/55">{email}</p>
                  <p className="mt-1 text-[11px] text-white/40">
                    {me?.joinedAt ? `On the platform since ${formatDate(me.joinedAt)}` : 'Account details are still loading.'}
                    {me?.lastSignInAt ? ` · Last sign-in ${formatDateTime(me.lastSignInAt)}` : ''}
                  </p>
                </div>
                <Link
                  to="/super-admin/console"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/20 px-4 text-[11px] font-semibold text-white transition hover:bg-white/10"
                >
                  <ArrowLeft size={13} /> Back to console
                </Link>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Administrator seats"
              value={derived.admins.length.toLocaleString()}
              sub="Including this account"
              icon={ShieldCheck}
              tone="violet"
            />
            <StatCard
              label="Accounts on platform"
              value={derived.accounts.length.toLocaleString()}
              sub="All roles"
              icon={Users}
            />
            <StatCard
              label="Integrations live"
              value={`${derived.liveIntegrations} of 2`}
              sub="Payments and email"
              icon={Activity}
              tone="emerald"
            />
            <StatCard
              label="Evaluation reports"
              value={reportFilesLabel}
              sub="Private bucket files"
              icon={FileText}
              tone="amber"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Identity" icon={UserCheck}>
              <Row label="Full name" value={name} />
              <Row label="Email" value={email} />
              <Row label="Role" value="Administrator" tone="info" />
              <Row label="Account created" value={me?.joinedAt ? formatDate(me.joinedAt) : '—'} />
              <Row label="Last sign-in" value={me?.lastSignInAt ? formatDateTime(me.lastSignInAt) : '—'} />
              <Row label="Sign-in method" value="Email & password" />
            </Panel>
            <Panel title="Access & security" icon={KeyRound}>
              <Row label="Console access" value="Server-verified role" tone="ok" />
              <Row label="Session" value="Bearer token per request" />
              <Row label="Service keys" value="Server-side only" tone="ok" />
              <Row label="Payments ledger" value="Read-only" />
              <Row label="Role changes" value="Owner seat" tone="info" />
              <Row
                label="Data refreshed"
                value={data ? formatDateTime(data.generatedAt) : '—'}
              />
            </Panel>
          </div>

          <Panel title="What this seat owns" icon={Crown}>
            <DotList
              items={[
                { title: 'Every account and role', detail: 'Issuing access and promoting or removing administrators.' },
                { title: 'Child safeguarding', detail: 'Owning incident review and escalation across classes and chat.' },
                { title: 'Data protection', detail: 'Keeping learner records private and the compliance promises honest.' },
                { title: 'Platform reliability', detail: 'Keeping live classes, payments and email delivery running.' },
                { title: 'Vendors and licences', detail: 'Managing the services the classroom depends on.' },
                { title: 'The operations team', detail: 'Overseeing the Admin Manager workspace and its activity.' },
              ]}
            />
          </Panel>
        </div>
      )
    }

    if (waiting) return <LoadingBlock label="Loading reports…" />
    if (!data) return null
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const adminsRecent = derived.admins.filter(
      (admin) => admin.lastSignInAt && new Date(admin.lastSignInAt).getTime() >= weekAgo,
    ).length
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Accounts onboarded" value={derived.accounts.length.toLocaleString()} sub="All roles" icon={Users} />
          <StatCard
            label="Payments settled"
            value={derived.successful.length.toLocaleString()}
            sub={derived.settled > 0 ? naira(derived.settled, true) : 'None settled yet'}
            icon={Receipt}
            tone="emerald"
          />
          <StatCard
            label="Active in the last 7 days"
            value={data.progress.activeThisWeek.toLocaleString()}
            sub="Saved progress activity"
            icon={Activity}
            tone="amber"
          />
          <StatCard
            label="Emails logged"
            value={derived.emails.length.toLocaleString()}
            sub="Delivery attempts recorded"
            icon={Mail}
          />
          <StatCard
            label="Administrator seats"
            value={derived.admins.length.toLocaleString()}
            sub="Owner-level access"
            icon={ShieldCheck}
            tone="violet"
          />
        </div>

        {derived.failedEmails > 0 ? (
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
            <Mail size={12} /> {derived.failedEmails} email record{derived.failedEmails === 1 ? '' : 's'} did not report a
            successful send.
          </p>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Accounts by role" icon={Users}>
            {(['admin', 'teacher', 'parent', 'junior', 'senior', 'special'] as const).map((role) => (
              <Row key={role} label={ROLE_LABEL[role]} value={derived.countRole(role).toLocaleString()} />
            ))}
            <Row label="Total accounts" value={derived.accounts.length.toLocaleString()} />
          </Panel>
          <Panel title="Plan mix" icon={CreditCard} badge={`${derived.successful.length} settled`}>
            {derived.planMix.length ? (
              derived.planMix.map((entry) => (
                <Row
                  key={entry.plan}
                  label={PLAN_LABEL[entry.plan] ?? entry.plan}
                  value={`${entry.count} · ${naira(entry.kobo / 100)}`}
                />
              ))
            ) : (
              <EmptyNote>No settled payments yet, so there is no plan mix to report.</EmptyNote>
            )}
          </Panel>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Sign-in activity" icon={UserCheck}>
            <Row label="Signed in past 7 days" value={derived.recentSignIns.toLocaleString()} />
            <Row label="Never signed in" value={derived.neverSignedIn.toLocaleString()} />
            <Row label="Administrators signed in this week" value={adminsRecent.toLocaleString()} />
            <Row label="Accounts with saved progress" value={data.progress.tracked.toLocaleString()} />
          </Panel>
          <Panel title="Platform totals" icon={Database}>
            <Row label="Payment records" value={derived.payments.length.toLocaleString()} />
            <Row label="Email log records" value={derived.emails.length.toLocaleString()} />
            <Row label="Evaluation report files" value={reportFilesLabel} />
            <Row label="Report generated" value={formatDateTime(data.generatedAt)} />
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#171238] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed -left-24 top-10 h-80 w-80 rounded-full bg-[#4338ca]/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-24 bottom-0 h-96 w-96 rounded-full bg-[#1d4ed8]/25 blur-3xl"
      />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-white/10 bg-[#120e2f]/95 px-4 py-6 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_18%_-12%,rgba(99,102,241,0.5),transparent_62%)]"
        />
        <Link to="/super-admin" className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 shadow-[0_10px_24px_-12px_rgba(99,102,241,0.9)]">
            <Crown size={18} />
          </span>
          <span>
            <span className="block text-[15px] font-extrabold tracking-tight">NeuroBloom</span>
            <span className="block text-[9px] font-bold tracking-[0.2em] text-white/45">SUPER ADMIN</span>
          </span>
        </Link>

        <Link
          to={profilePath}
          className="relative mt-6 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3 transition hover:border-white/20 hover:bg-white/[0.1]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-xs font-bold text-white">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{name}</p>
            <p className="truncate text-[10px] text-white/50">{email}</p>
          </div>
          <ArrowLeft size={12} className="ml-auto rotate-180 text-white/35" aria-hidden />
        </Link>

        <nav aria-label="Super Admin sections" className="relative mt-5 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {SECTIONS.map((item) => (
            <NavLink
              key={item.id}
              to={pathFor(item.id)}
              end
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] transition',
                  isActive
                    ? 'bg-white/[0.1] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]'
                    : 'font-medium text-white/65 hover:bg-white/[0.06] hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={15} className={cn('shrink-0', isActive ? 'text-[#c7d2fe]' : 'text-white/45')} />
                  {item.label}
                  {isActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a5b4fc]" aria-hidden /> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative mt-3 space-y-2 border-t border-white/10 pt-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
            <div className="flex items-center gap-1.5 text-white">
              <ShieldCheck size={13} className={integrations?.database ? 'text-emerald-300' : 'text-white/40'} />
              <span className="text-[10px] font-bold">
                {feed.status === 'loading' ? 'Connecting to data…' : feed.status === 'error' ? 'Data unavailable' : 'Live platform data'}
              </span>
            </div>
            <p className="mt-1 text-base font-extrabold">
              {feed.status === 'ready' && data ? `${derived.liveIntegrations} of 2` : '—'}
            </p>
            <p className="text-[9px] text-white/50">
              Integrations live · refreshed {feed.status === 'ready' && data ? formatTime(data.generatedAt) : '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <div className="relative lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#171238]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a5b4fc]">
                <Crown size={11} /> Exclusive access
                <span className="text-white/25">/</span>
                <span className="text-white/45">{active.label}</span>
              </p>
              <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight text-white">{active.label}</h1>
              <p className="text-[12px] text-white/50">{active.blurb}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/70 sm:inline-flex">
                <span className={cn('h-1.5 w-1.5 rounded-full', feed.status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400')} />
                Live data · {feed.status === 'ready' && data ? formatTime(data.generatedAt) : 'syncing'}
              </span>
              <button
                type="button"
                onClick={() => void feed.reload()}
                disabled={feed.status === 'loading'}
                aria-label="Refresh live data"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/60 transition hover:text-white disabled:opacity-50"
              >
                <RefreshCw size={14} className={feed.status === 'loading' ? 'animate-spin' : undefined} />
              </button>
              <Link
                to={profilePath}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3 transition hover:border-white/25 hover:bg-white/[0.1]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-[10px] font-bold text-white">
                  {initials(name)}
                </span>
                <span className="text-[11px] font-bold text-white/80">{name}</span>
              </Link>
            </div>
          </div>
          <div className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden">
            {SECTIONS.map((item) => (
              <NavLink
                key={item.id}
                to={pathFor(item.id)}
                end
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold transition',
                    isActive
                      ? 'border-white bg-white text-[#171238]'
                      : 'border-white/15 bg-white/[0.05] text-white/65',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6">
          {feed.status === 'error' ? (
            <div className="mb-4 flex flex-wrap items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-amber-100">Live data could not be loaded</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-100/80">{feed.error}</p>
              </div>
              <button
                type="button"
                onClick={() => void feed.reload()}
                className="rounded-xl border border-amber-400/40 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-amber-100"
              >
                Try again
              </button>
            </div>
          ) : null}

          <p className="mb-4 max-w-3xl text-[12px] leading-relaxed text-white/50">{active.copy}</p>

          {renderSection()}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <p className="max-w-xl text-[10px] leading-relaxed text-white/35">
              Every figure on this console is read live from Supabase and the serverless API. This console is separate from
              the Admin Manager workspace used by the operations team.
            </p>
            {profile?.email ? (
              <span className="hidden items-center gap-1 text-[10px] text-white/35 sm:flex">
                <FileText size={11} /> {profile.email}
              </span>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
