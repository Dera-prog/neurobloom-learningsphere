import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Crown,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { cn, initials } from '../lib/utils'

const LINKS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'access', label: 'Access & roles', icon: Users },
  { id: 'safeguarding', label: 'Safeguarding', icon: ShieldCheck },
  { id: 'compliance', label: 'Data & compliance', icon: Lock },
  { id: 'platform', label: 'Platform & live ops', icon: Settings },
  { id: 'admins', label: 'Admins & activity', icon: Activity },
  { id: 'vendors', label: 'Vendors & licences', icon: Receipt },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
]

const STATS = [
  { label: 'Platform uptime', value: '99.98%', sub: 'Last 30 days', icon: Activity, tone: 'ok' },
  { label: 'Safeguarding flags', value: '3', sub: '1 urgent · under review', icon: ShieldCheck, tone: 'warn' },
  { label: 'Administrator accounts', value: '4', sub: '2 ops · 2 sub-admins', icon: Users, tone: 'neutral' },
  { label: 'Open escalations', value: '5', sub: '2 technical · 3 access', icon: LifeBuoy, tone: 'warn' },
]

const ESCALATIONS = [
  { title: 'Teacher account locked out during a live JSS3 class', meta: 'Technical · raised by support desk', level: 'Urgent' },
  { title: 'Parent requesting full data export for two children', meta: 'Data protection · raised by parent care', level: 'High' },
  { title: 'ASD learner’s break settings changed by an ops admin', meta: 'Inclusive support · needs owner approval', level: 'High' },
  { title: 'Refund dispute over a cancelled Premium plan', meta: 'Billing · raised by finance desk', level: 'Normal' },
  { title: 'Second admin fails two-factor check at sign-in', meta: 'Security · automatic escalation', level: 'Normal' },
]

const SECURITY_POSTURE = [
  { label: 'Two-factor authentication', value: 'Required for every super admin', tone: 'ok' },
  { label: 'Password policy', value: 'Strong · 12+ characters', tone: 'ok' },
  { label: 'Audit logging', value: 'On · every privileged action', tone: 'ok' },
  { label: 'Backups', value: 'Nightly · 30-day retention', tone: 'ok' },
  { label: 'Email delivery', value: 'Mailgun setup needed', tone: 'warn' },
]

const ACCOUNTS = [
  { name: 'Chidera Uzoma', scope: 'Super Admin · full platform', twoFa: 'On', status: 'Active' },
  { name: 'Amina Bello', scope: 'Ops admin · approvals, finance', twoFa: 'On', status: 'Active' },
  { name: 'Tunde Cole', scope: 'Support admin · help desk only', twoFa: 'On', status: 'Active' },
  { name: 'Ifeoma Nwosu', scope: 'Content admin · curriculum only', twoFa: 'Pending', status: 'In review' },
]

const INCIDENTS = [
  { title: 'Unapproved contact request inside a live class', meta: 'Raised by class monitor · yesterday 16:42', level: 'Urgent', state: 'Under review' },
  { title: 'Chat flagged for repeated name-calling', meta: 'Auto-flagged · JSS2 group chat', level: 'High', state: 'Moderated' },
  { title: 'Recording access request from a parent', meta: 'Parent of an ASD learner · 2 days ago', level: 'Normal', state: 'Resolved' },
]

const COMPLIANCE = [
  { label: 'NDPR (Nigeria)', value: 'Aligned', tone: 'ok', note: 'Consent records kept for every minor' },
  { label: 'GDPR', value: 'Review due', tone: 'warn', note: 'Data export flow under review' },
  { label: 'COPPA', value: 'Enforced', tone: 'ok', note: 'Parental consent before collection' },
]

const DATA_ROWS = [
  { label: 'Parental consent coverage', value: '100% of minor accounts' },
  { label: 'Sensitive learning profiles', value: 'Specialists & owners only' },
  { label: 'Live-class recordings', value: '90-day retention · restricted' },
  { label: 'Last audit-log review', value: 'Today · no anomalies found' },
]

const PLATFORM_ROWS = [
  { label: 'Classes & timetables', value: 'Published · JSS1–SSS3' },
  { label: 'Curriculum', value: 'Current across all sections' },
  { label: 'Payments (Paystack)', value: 'Connected · test keys' },
  { label: 'Email & SMS delivery', value: 'Mailgun setup needed' },
  { label: 'Video classrooms', value: 'Simulated player' },
  { label: 'Uptime · peak hours', value: '99.98% · last 30 days' },
]

const ACTIVITY_LOG = [
  { text: 'Approved teacher application · Mathematics', time: 'Today 09:14' },
  { text: 'Suspended a dormant learner account', time: 'Today 08:40' },
  { text: 'Changed recording retention from 60 to 90 days', time: 'Yesterday 17:22' },
  { text: 'Granted support admin access to the help desk', time: 'Yesterday 11:05' },
  { text: 'Reviewed two-factor enrolment for 4 admins', time: 'Mon 15:31' },
]

const VENDORS = [
  { name: 'Supabase', use: 'Database & accounts', state: 'Active', renewal: 'Monthly' },
  { name: 'Vercel', use: 'Hosting & deployment', state: 'Active', renewal: 'Monthly' },
  { name: 'Paystack', use: 'Payments', state: 'Active · test keys', renewal: 'Per transaction' },
  { name: 'Mailgun', use: 'Email delivery', state: 'Setup needed', renewal: '—' },
]

const KPIS = [
  { label: 'Uptime & live-class reliability', value: '99.98%' },
  { label: 'Critical safeguarding incidents', value: '0' },
  { label: 'Average complaint resolution', value: '4.2 hours' },
  { label: 'Parent, teacher & student satisfaction', value: '4.6 / 5' },
  { label: 'Progress reports on time', value: '100%' },
]

function chipTone(tone: string) {
  if (tone === 'ok') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (tone === 'warn') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (tone === 'urgent') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

const levelTone = (level: string) => (level === 'Urgent' ? 'urgent' : level === 'High' ? 'warn' : 'neutral')

function SectionHeading({ id, title, copy }: { id: string; title: string; copy: string }) {
  return (
    <div className="mb-4">
      <h2 id={id} className="scroll-mt-24 text-base font-extrabold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">{copy}</p>
    </div>
  )
}

function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e3e6f0] bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{title}</h3>
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
        <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(tone))}>{value}</span>
      ) : (
        <span className="text-right text-[11px] text-slate-500">{value}</span>
      )}
    </div>
  )
}

export function SuperAdminConsole() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const name = profile?.full_name || 'Super Admin'
  const email = profile?.email || 'Owner access'

  async function handleSignOut() {
    await signOut()
    navigate('/super-admin')
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
          {LINKS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon size={15} /> {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          <div className="rounded-xl bg-white/[0.06] p-3">
            <div className="flex items-center gap-1.5 text-white">
              <ShieldCheck size={13} className="text-emerald-300" />
              <span className="text-[10px] font-bold">All systems normal</span>
            </div>
            <p className="mt-1 text-base font-extrabold">99.98%</p>
            <p className="text-[9px] text-white/50">Uptime · last 30 days</p>
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
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Super Admin console</h1>
              <p className="text-[11px] text-slate-500">Owner-level control across NeuroBloom LearningSphere</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex">
                99.98% uptime
              </span>
              <span className="flex items-center gap-2 rounded-full border border-[#e3e6f0] bg-white py-1 pl-1 pr-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d4ed8] text-[10px] font-bold text-white">
                  {initials(name)}
                </span>
                <span className="text-[11px] font-bold text-slate-700">{name}</span>
              </span>
            </div>
          </div>
          <div className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden">
            {LINKS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="whitespace-nowrap rounded-full border border-[#e3e6f0] bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600"
              >
                {item.label}
              </a>
            ))}
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl space-y-10 px-4 py-6 outline-none sm:px-6">
          <section aria-labelledby="overview">
            <SectionHeading
              id="overview"
              title="Owner overview"
              copy="The whole platform in one place: reliability, safeguarding, administrator access and the escalations that land on this desk alone."
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#e3e6f0] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-slate-500">{stat.label}</p>
                    <stat.icon size={14} className="text-[#1d4ed8]" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
                  <p
                    className={cn(
                      'mt-0.5 text-[10px] font-semibold',
                      stat.tone === 'warn' ? 'text-amber-600' : stat.tone === 'ok' ? 'text-emerald-600' : 'text-slate-500',
                    )}
                  >
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <Panel title="Escalations awaiting the super admin" badge={`${ESCALATIONS.length} open`}>
                <ul className="space-y-2">
                  {ESCALATIONS.map((item) => (
                    <li key={item.title} className="flex items-start justify-between gap-3 rounded-xl border border-[#eef0f6] p-2.5">
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">{item.title}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{item.meta}</p>
                      </div>
                      <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(levelTone(item.level)))}>
                        {item.level}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Security posture">
                {SECURITY_POSTURE.map((row) => (
                  <Row key={row.label} {...row} />
                ))}
              </Panel>
            </div>
          </section>

          <section aria-labelledby="access">
            <SectionHeading
              id="access"
              title="Access & roles"
              copy="Every account on the platform, including other admins. Roles are least-privilege by default, and only this seat can widen them."
            />
            <div className="overflow-hidden rounded-2xl border border-[#e3e6f0] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-[#eef0f6] bg-[#fafbfe]">
                      {['Account', 'Scope of access', 'Two-factor', 'Status'].map((heading) => (
                        <th key={heading} scope="col" className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ACCOUNTS.map((account) => (
                      <tr key={account.name} className="border-b border-[#eef0f6] last:border-0">
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-800">{account.name}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">{account.scope}</td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(account.twoFa === 'On' ? 'ok' : 'warn'))}>
                            {account.twoFa}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(account.status === 'Active' ? 'ok' : 'warn'))}>
                            {account.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section aria-labelledby="safeguarding" className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <SectionHeading
                id="safeguarding"
                title="Safeguarding"
                copy="Flagged incidents across live classes, chat and shared content. Because children — including children with additional needs — use the platform, these review here first."
              />
              <Panel title="Incident queue" badge="3 flagged">
                <ul className="space-y-2">
                  {INCIDENTS.map((incident) => (
                    <li key={incident.title} className="rounded-xl border border-[#eef0f6] p-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] font-bold text-slate-800">{incident.title}</p>
                        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(levelTone(incident.level)))}>
                          {incident.level}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] text-slate-500">{incident.meta}</p>
                        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{incident.state}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
            <div>
              <SectionHeading
                id="compliance"
                title="Data & compliance"
                copy="Child-data law, consent, sensitive learning profiles and the audit trail behind every privileged action."
              />
              <Panel title="Regulatory position">
                <div className="space-y-2">
                  {COMPLIANCE.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl border border-[#eef0f6] p-2.5">
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">{item.label}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{item.note}</p>
                      </div>
                      <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(item.tone))}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-[#eef0f6] pt-2">
                  {DATA_ROWS.map((row) => (
                    <Row key={row.label} {...row} />
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <section aria-labelledby="platform">
            <SectionHeading
              id="platform"
              title="Platform & live operations"
              copy="Configuration, integrations and the health of every live class — owned end to end from this seat."
            />
            <Panel title="Configuration & health">
              <div className="grid gap-x-8 sm:grid-cols-2">
                {PLATFORM_ROWS.map((row) => (
                  <Row key={row.label} {...row} />
                ))}
              </div>
            </Panel>
          </section>

          <section aria-labelledby="admins" className="grid gap-3 lg:grid-cols-2">
            <div>
              <SectionHeading
                id="admins"
                title="Admins & activity"
                copy="Sub-admins act within limits set here, and every privileged action is attributed in the log."
              />
              <Panel title="Recent privileged activity">
                <ol className="space-y-2">
                  {ACTIVITY_LOG.map((entry) => (
                    <li key={entry.text} className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-[#1d4ed8]" />
                      <div>
                        <p className="text-[11px] font-semibold text-slate-700">{entry.text}</p>
                        <p className="text-[10px] text-slate-400">{entry.time}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>
            </div>
            <div>
              <SectionHeading
                id="vendors"
                title="Vendors & licences"
                copy="Software relationships, licence renewals and the services the classroom depends on."
              />
              <Panel title="Active services">
                <div className="space-y-2">
                  {VENDORS.map((vendor) => (
                    <div key={vendor.name} className="flex items-center justify-between gap-3 rounded-xl border border-[#eef0f6] p-2.5">
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">{vendor.name}</p>
                        <p className="text-[10px] text-slate-500">{vendor.use}</p>
                      </div>
                      <div className="text-right">
                        <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold', chipTone(vendor.state.startsWith('Setup') ? 'warn' : 'ok'))}>
                          {vendor.state}
                        </span>
                        <p className="mt-0.5 text-[9px] text-slate-400">{vendor.renewal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <section aria-labelledby="reports">
            <SectionHeading
              id="reports"
              title="Reports"
              copy="How this seat is measured — the same indicators reported to leadership and, when required, to regulators."
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {KPIS.map((kpi) => (
                <div key={kpi.label} className="rounded-2xl border border-[#e3e6f0] bg-white p-4">
                  <p className="text-lg font-extrabold tracking-tight text-slate-900">{kpi.value}</p>
                  <p className="mt-1 text-[10px] leading-snug text-slate-500">{kpi.label}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e6f0] pt-5">
            <p className="max-w-xl text-[10px] leading-relaxed text-slate-400">
              Super Admin actions are recorded in the platform audit trail. This console is separate from the Admin
              Manager workspace used by the operations team.
            </p>
            <div className="flex items-center gap-2">
              {profile?.email ? (
                <span className="hidden items-center gap-1 text-[10px] text-slate-400 sm:flex">
                  <FileText size={11} /> {profile.email}
                </span>
              ) : null}
              <Link
                to="/super-admin"
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#e3e6f0] bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:text-slate-900"
              >
                <ArrowLeft size={12} /> Role overview
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
