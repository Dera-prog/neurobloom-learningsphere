import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Crown,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  Receipt,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
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
    icon: Users,
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

type SectionId = (typeof SECTIONS)[number]['id']

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

function chipTone(tone: string) {
  if (tone === 'ok') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (tone === 'warn') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (tone === 'urgent') return 'bg-red-50 text-red-700 border-red-200'
  if (tone === 'info') return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e3e6f0] bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{title}</h2>
        {badge ? (
          <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide', chipTone('neutral'))}>
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#eef0f6] py-2 last:border-0">
      <span className="text-[11px] font-semibold text-slate-700">{label}</span>
      {tone ? (
        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(tone))}>{value}</span>
      ) : (
        <span className="text-right text-[11px] text-slate-500">{value}</span>
      )}
    </div>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-[#dfe3ef] bg-[#fafbfe] p-3 text-[11px] leading-relaxed text-slate-500">{children}</p>
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[#e3e6f0] bg-white p-4 text-[11px] font-semibold text-slate-500">
      <RefreshCw size={13} className="animate-spin" /> {label}
    </div>
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

  const active = SECTIONS.find((item) => item.id === params.section) ?? SECTIONS[0]
  const knownSection = !params.section || SECTIONS.some((item) => item.id === params.section)

  useEffect(() => {
    if (!knownSection) navigate('/super-admin/console', { replace: true })
  }, [knownSection, navigate])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [active.id])

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
      planMix: [...mix.values()].sort((a, b) => b.kobo - a.kobo),
    }
  }, [data])

  const integrations = data?.integrations
  const waiting = feed.status === 'loading' && !data

  function renderSection() {
    if (active.id === 'overview') {
      if (waiting) return <LoadingBlock label="Loading platform figures…" />
      if (!data) return null
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: 'Accounts on platform',
                value: derived.accounts.length.toLocaleString(),
                sub: `${derived.learners} learners · ${derived.teachers} teachers`,
                icon: Users,
                good: false,
              },
              {
                label: 'Revenue settled',
                value: naira(derived.settled, true),
                sub: `${derived.successful.length} successful payment${derived.successful.length === 1 ? '' : 's'}`,
                icon: Receipt,
                good: derived.settled > 0,
              },
              {
                label: 'Administrator seats',
                value: derived.admins.length.toLocaleString(),
                sub: 'Owner-level access',
                icon: ShieldCheck,
                good: false,
              },
              {
                label: 'Active this week',
                value: data.progress.activeThisWeek.toLocaleString(),
                sub: `of ${data.progress.tracked} with saved progress`,
                icon: BarChart3,
                good: data.progress.activeThisWeek > 0,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[#e3e6f0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-slate-500">{stat.label}</p>
                  <stat.icon size={14} className="text-[#1d4ed8]" />
                </div>
                <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
                <p className={cn('mt-0.5 text-[10px] font-semibold', stat.good ? 'text-emerald-600' : 'text-slate-500')}>{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <Panel title="Recent payments" badge={derived.payments.length ? `${derived.payments.length} in ledger` : 'ledger empty'}>
              {derived.payments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] text-left">
                    <thead>
                      <tr className="border-b border-[#eef0f6]">
                        {['Date', 'Account', 'Plan', 'Amount', 'Status'].map((heading) => (
                          <th key={heading} scope="col" className="px-1 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {derived.payments.slice(0, 6).map((payment) => (
                        <tr key={payment.id} className="border-b border-[#eef0f6] last:border-0">
                          <td className="px-1 py-2 text-[10px] text-slate-500">{formatDate(payment.paid_at || payment.created_at)}</td>
                          <td className="max-w-[140px] truncate px-1 py-2 text-[11px] font-semibold text-slate-800">
                            {derived.names.get(payment.user_id) ?? 'Unknown account'}
                          </td>
                          <td className="px-1 py-2 text-[10px] text-slate-600">
                            {PLAN_LABEL[payment.plan_id] ?? payment.plan_id} · {childName(payment.child_id)}
                          </td>
                          <td className="whitespace-nowrap px-1 py-2 text-[11px] font-bold text-slate-800">
                            {naira((Number(payment.amount) || 0) / 100)}
                          </td>
                          <td className="px-1 py-2">
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[9px] font-bold',
                                chipTone(payment.status === 'success' ? 'ok' : 'warn'),
                              )}
                            >
                              {payment.status}
                            </span>
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
            <Panel title="Integration status">
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

          <Panel title="Newest accounts" badge={`${derived.accounts.length} total`}>
            {derived.accounts.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {derived.accounts.slice(0, 4).map((account) => (
                  <li key={account.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eef0f6] p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-slate-800">{account.name || account.email}</p>
                      <p className="truncate text-[10px] text-slate-500">{account.email || 'No email on file'}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#e3e6f0] bg-[#fafbfe] px-2 py-0.5 text-[9px] font-bold text-slate-600">
                      {ROLE_LABEL[account.role] ?? account.role}
                    </span>
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
              <span
                key={role}
                className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold', role === 'admin' ? chipTone('info') : chipTone('neutral'))}
              >
                {ROLE_LABEL[role]} · {derived.countRole(role)}
              </span>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e3e6f0] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[#eef0f6] bg-[#fafbfe]">
                    {['Account', 'Role', 'Joined', 'Last sign-in'].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {derived.accounts.map((account) => (
                    <tr key={account.id} className="border-b border-[#eef0f6] last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-bold text-slate-800">{account.name || 'Unnamed account'}</p>
                        <p className="text-[10px] text-slate-500">{account.email || 'No email'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[9px] font-bold',
                            account.role === 'admin' ? chipTone('info') : chipTone('neutral'),
                          )}
                        >
                          {ROLE_LABEL[account.role] ?? account.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600">{formatDate(account.joinedAt)}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-600">
                        {account.lastSignInAt ? formatDateTime(account.lastSignInAt) : 'Never signed in'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!derived.accounts.length ? <p className="p-4 text-[11px] text-slate-500">No accounts yet.</p> : null}
          </div>
        </div>
      )
    }

    if (active.id === 'safeguarding') {
      return (
        <Panel title="Incident queue">
          <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-[#dfe3ef] bg-[#fafbfe] p-3">
            <LifeBuoy size={15} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-[11px] font-bold text-slate-700">No incident log is connected yet</p>
              <p className="mt-0.5 max-w-2xl text-[10px] leading-relaxed text-slate-500">
                The platform has no safeguarding table, so this queue is intentionally empty rather than filled with sample
                incidents. Once an incident register is added, flagged cases will be reviewed here.
              </p>
            </div>
          </div>
        </Panel>
      )
    }

    if (active.id === 'compliance') {
      if (waiting) return <LoadingBlock label="Loading stored records…" />
      if (!data) return null
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Controls in force">
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
          <Panel title="Stored records">
            <Row label="Accounts" value={derived.accounts.length.toLocaleString()} />
            <Row label="Saved progress records" value={data.progress.tracked.toLocaleString()} />
            <Row label="Payment records" value={derived.payments.length.toLocaleString()} />
            <Row label="Email log records" value={derived.emails.length.toLocaleString()} />
          </Panel>
        </div>
      )
    }

    if (active.id === 'platform') {
      if (waiting) return <LoadingBlock label="Loading platform status…" />
      if (!data) return null
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Configuration & health">
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
            <Row label="Accounts active this week" value={`${data.progress.activeThisWeek} of ${data.progress.tracked}`} />
            <Row label="Latest payment" value={derived.latestPayment ? formatDateTime(derived.latestPayment) : 'None yet'} />
            <Row label="Data refreshed" value={formatDateTime(data.generatedAt)} />
          </Panel>
          <Panel title="Email delivery log" badge={`${derived.emails.length} logged`}>
            {derived.emails.length ? (
              <ul className="space-y-2">
                {derived.emails.slice(0, 8).map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#eef0f6] p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-slate-800">{item.recipient}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.kind} · {formatDateTime(item.created_at)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold',
                        chipTone(item.status === 'sent' || item.status === 'delivered' ? 'ok' : 'warn'),
                      )}
                    >
                      {item.status}
                    </span>
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
      )
    }

    if (active.id === 'admins') {
      if (waiting) return <LoadingBlock label="Loading administrator accounts…" />
      if (!data) return null
      return (
        <Panel title="Administrator seats" badge={`${derived.admins.length} held`}>
          {derived.admins.length ? (
            <ul className="space-y-2">
              {derived.admins.map((admin) => (
                <li key={admin.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#eef0f6] p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-slate-800">{admin.name || admin.email}</p>
                    <p className="truncate text-[10px] text-slate-500">{admin.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone('info'))}>Administrator</span>
                    <p className="mt-1 text-[9px] text-slate-400">
                      {admin.lastSignInAt ? `Last in ${formatDate(admin.lastSignInAt)}` : 'Never signed in'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>No administrator accounts found.</EmptyNote>
          )}
        </Panel>
      )
    }

    if (active.id === 'vendors') {
      return (
        <Panel title="Active services">
          <div className="space-y-2">
            {[
              { name: 'Supabase', use: 'Database, accounts & storage', ok: Boolean(integrations?.database), okText: 'Connected', badText: 'Unavailable' },
              { name: 'Vercel', use: 'Hosting & serverless API', ok: true, okText: 'Serving this console', badText: '' },
              { name: 'Paystack', use: 'Payments & subscriptions', ok: Boolean(integrations?.payments), okText: 'Connected', badText: 'Not configured' },
              { name: 'Mailgun', use: 'Transactional email', ok: Boolean(integrations?.email), okText: 'Connected', badText: 'Setup needed' },
            ].map((vendor) => (
              <div key={vendor.name} className="flex items-center justify-between gap-3 rounded-xl border border-[#eef0f6] p-2.5">
                <div>
                  <p className="text-[11px] font-bold text-slate-800">{vendor.name}</p>
                  <p className="text-[10px] text-slate-500">{vendor.use}</p>
                </div>
                <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(vendor.ok ? 'ok' : 'warn'))}>
                  {vendor.ok ? vendor.okText : vendor.badText}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )
    }

    if (waiting) return <LoadingBlock label="Loading reports…" />
    if (!data) return null
    return (
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { value: derived.accounts.length.toLocaleString(), label: 'Accounts onboarded' },
            {
              value: `${derived.successful.length}`,
              label: `Payments settled${derived.settled > 0 ? ` · ${naira(derived.settled, true)}` : ''}`,
            },
            { value: data.progress.activeThisWeek.toLocaleString(), label: 'Active in the last 7 days' },
            { value: derived.emails.length.toLocaleString(), label: 'Emails logged' },
            { value: `${derived.admins.length}`, label: 'Administrator seats' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-[#e3e6f0] bg-white p-4">
              <p className="text-lg font-extrabold tracking-tight text-slate-900">{kpi.value}</p>
              <p className="mt-1 text-[10px] leading-snug text-slate-500">{kpi.label}</p>
            </div>
          ))}
        </div>
        {derived.failedEmails > 0 ? (
          <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-amber-600">
            <Mail size={11} /> {derived.failedEmails} email record{derived.failedEmails === 1 ? '' : 's'} did not report a
            successful send.
          </p>
        ) : null}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Panel title="Accounts by role">
            {(['admin', 'teacher', 'parent', 'junior', 'senior', 'special'] as const).map((role) => (
              <Row key={role} label={ROLE_LABEL[role]} value={derived.countRole(role).toLocaleString()} />
            ))}
            <Row label="Total accounts" value={derived.accounts.length.toLocaleString()} />
          </Panel>
          <Panel title="Plan mix" badge={`${derived.successful.length} settled`}>
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
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#f4f5fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#171238] px-4 py-6 text-white lg:flex">
        <Link to="/super-admin" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10" aria-hidden>
            <Crown size={18} />
          </span>
          <span>
            <span className="block text-base font-extrabold tracking-tight">NeuroBloom</span>
            <span className="block text-[9px] font-semibold tracking-[0.18em] text-white/50">SUPER ADMIN</span>
          </span>
        </Link>

        <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-white/[0.06] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-xs font-bold text-white">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{name}</p>
            <p className="truncate text-[10px] text-white/50">{email}</p>
          </div>
        </div>

        <nav aria-label="Super Admin sections" className="mt-5 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {SECTIONS.map((item) => (
            <NavLink
              key={item.id}
              to={pathFor(item.id)}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] transition',
                  isActive
                    ? 'bg-white/10 font-semibold text-white'
                    : 'font-medium text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <item.icon size={15} /> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          <div className="rounded-xl bg-white/[0.06] p-3">
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

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-[#e3e6f0] bg-[#f4f5fb]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">
                <Crown size={11} /> Exclusive access
              </p>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">{active.label}</h1>
              <p className="text-[11px] text-slate-500">{active.blurb}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-[#e3e6f0] bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:inline-flex">
                <span className={cn('h-1.5 w-1.5 rounded-full', feed.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500')} />
                Live data · {feed.status === 'ready' && data ? formatTime(data.generatedAt) : 'syncing'}
              </span>
              <button
                type="button"
                onClick={() => void feed.reload()}
                disabled={feed.status === 'loading'}
                aria-label="Refresh live data"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e3e6f0] bg-white text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
              >
                <RefreshCw size={14} className={feed.status === 'loading' ? 'animate-spin' : undefined} />
              </button>
              <span className="flex items-center gap-2 rounded-full border border-[#e3e6f0] bg-white py-1 pl-1 pr-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d4ed8] text-[10px] font-bold text-white">
                  {initials(name)}
                </span>
                <span className="text-[11px] font-bold text-slate-700">{name}</span>
              </span>
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
                    isActive ? 'border-[#1d4ed8] bg-[#1d4ed8] text-white' : 'border-[#e3e6f0] bg-white text-slate-600',
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
            <div className="mb-4 flex flex-wrap items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-amber-900">Live data could not be loaded</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">{feed.error}</p>
              </div>
              <button
                type="button"
                onClick={() => void feed.reload()}
                className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-800"
              >
                Try again
              </button>
            </div>
          ) : null}

          <p className="mb-4 max-w-3xl text-xs leading-relaxed text-slate-500">{active.copy}</p>

          {renderSection()}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e6f0] pt-5">
            <p className="max-w-xl text-[10px] leading-relaxed text-slate-400">
              Every figure on this console is read live from Supabase and the serverless API. This console is separate from
              the Admin Manager workspace used by the operations team.
            </p>
            {profile?.email ? (
              <span className="hidden items-center gap-1 text-[10px] text-slate-400 sm:flex">
                <FileText size={11} /> {profile.email}
              </span>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
