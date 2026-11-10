import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileText,
  HeartHandshake,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { HeaderActions, RoleBadge, RoleLayout } from '../components/layout'
import { Messenger, ComposeMessageModal } from '../components/chat'
import { Donut, MultiLine, TrendArea } from '../components/charts'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  ProgressBar,
  SectionCard,
  Select,
  StatCard,
  TextArea,
  Toggle,
  buttonStyles,
} from '../components/ui'
import { useToast } from '../components/toast'
import { useApp } from '../store/store'
import {
  billingHistory,
  childrenData,
  parentAccessAddon,
  parentAlerts,
  parentTeachers,
  plans,
  PREMIUM_PLAN_IDS,
  specialActivities,
  specialAwards,
  specialSupport,
  type ChildId,
  type PlanId,
} from '../data/content'
import { cn, dayMonth, downloadCsv, downloadText, greeting, longDate, naira, nextMonthlyDay, uid } from '../lib/utils'
import { useAuth } from '../lib/auth'
import { NewUserDashboard } from '../components/onboarding'
import { looksLikeEmail, sendConfirmationEmail } from '../lib/email'
import { applyCoupon, clearParentAccessIntent, listMyPayments, paymentsConfigured, startCheckout, type PaymentRow } from '../lib/payments'

const childOrder: ChildId[] = ['tunde', 'chidi']

function ChildSwitch({ child, onChange }: { child: ChildId; onChange: (c: ChildId) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose child">
      {childOrder.map((id) => {
        const profile = childrenData[id]
        const active = child === id
        return (
          <button
            type="button"
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'flex flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition sm:max-w-64',
              active ? 'border-role/50 bg-role-soft shadow-sm' : 'border-border bg-card hover:bg-muted/50',
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg" style={{ background: profile.soft }} aria-hidden>
              {profile.emoji}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-foreground">{profile.name}</span>
              <span className="block text-[10px] text-muted-foreground">{profile.level} · {profile.id === 'chidi' ? 'ASD support' : 'Junior secondary'}</span>
            </span>
            {active ? <CheckCircle2 size={16} className="ml-auto shrink-0 text-role" /> : null}
          </button>
        )
      })}
    </div>
  )
}

function planName(id: string) {
  return plans.find((p) => p.id === id)?.name ?? 'General Plan'
}

export function ParentHome() {
  const { state, dispatch } = useApp()
  const { profile: account } = useAuth()
  const [child, setChild] = useState<ChildId>('tunde')

  if (account?.role === 'parent' && !state.onboarding.complete) {
    return <NewUserDashboard role="parent" />
  }

  const profile = childrenData[child]
  const planId = state.plans[child]
  const alerts = parentAlerts.filter((a) => a.child === child)
  const unread = state.alertsRead ? 0 : alerts.filter((a) => a.tone !== 'info').length

  return (
    <RoleLayout role="parent">
      <PageHeader
        title={`${greeting()}, Mrs. Bakare`}
        subtitle={`${longDate()} · Monitoring 2 children`}
        badge={<RoleBadge role="parent" />}
        actions={<HeaderActions role="parent" />}
      />

      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
        <ChildSwitch child={child} onChange={setChild} />

        <Card className="relative overflow-hidden border-0 bg-[image:var(--hero-gradient)] p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                <Sparkles size={13} /> {planName(planId)} active
              </span>
              <h2 className="mt-3 flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-[28px]">
                <span aria-hidden>{profile.emoji}</span> {profile.name}
              </h2>
              <p className="mt-1.5 text-sm text-white/75">
                {profile.level} · {profile.special ? 'Specialist-supported learning' : 'Junior secondary'} · {profile.streak} streak
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/parent/progress" className={buttonStyles('primary', 'md', '!bg-white !text-[#334155] hover:!bg-white/90')}>
                  View progress
                </Link>
                <Link to="/parent/messages" className={buttonStyles('ghost', 'md', 'text-white hover:bg-white/15 hover:text-white')}>
                  Message teachers <ArrowRight size={15} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Average</p>
                <p className="text-2xl font-extrabold">{profile.average}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Attendance</p>
                <p className="text-2xl font-extrabold">{profile.attendance}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Work done</p>
                <p className="text-2xl font-extrabold">{profile.workDone.split(' / ')[0]}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Streak</p>
                <p className="text-2xl font-extrabold">{profile.streak.split(' ')[0]}d</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label={profile.averageLabel} value={`${profile.average}%`} icon={TrendingUp} color="#64748b" soft="#f1f5f9" trend={{ value: profile.averageTrend }} />
          <StatCard label="Attendance" value={`${profile.attendance}%`} icon={CalendarCheck} color="#10b981" soft="#ecfdf5" sub={profile.attendanceLabel} />
          <StatCard label="Work completed" value={profile.workDone} icon={ClipboardList} color="#6c3fc5" soft="#f0eefb" sub={profile.workLabel} />
          <StatCard label="Learning streak" value={profile.streak} icon={Star} color="#f59e0b" soft="#fffbeb" sub={profile.streakLabel} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <SectionCard
              title={`${profile.name.split(' ')[0]}’s progress`}
              subtitle="Score against class average"
              icon={TrendingUp}
              action={<Link to="/parent/progress" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">Full report</Link>}
            >
              <TrendArea
                data={profile.trend}
                series={[
                  { key: 'score', label: `${profile.name.split(' ')[0]}`, color: profile.color },
                  { key: 'classAvg', label: 'Class average', color: '#94a3b8', dashed: true },
                ]}
                yDomain={[40, 100]}
                height={240}
              />
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Latest</p>
                  <p className="text-xs font-bold text-foreground">{profile.average}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Growth</p>
                  <p className="text-xs font-bold text-emerald-600">{profile.averageTrend}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Class avg</p>
                  <p className="text-xs font-bold text-foreground">{profile.trend[profile.trend.length - 1].classAvg}%</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Grades this term" subtitle="Continuous assessment and teacher remarks" icon={BookOpen}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {profile.grades.map((g) => (
                  <div key={g.code} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">{g.subject}</p>
                        <p className="text-[10px] text-muted-foreground">{g.teacher}</p>
                      </div>
                      <Badge tone="warn">{g.grade}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={g.score} color={g.color} height="h-1.5" label={`${g.subject} score`} />
                      <span className="text-[10px] font-bold text-muted-foreground">{g.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Lesson completion" subtitle="How much of the term is complete" icon={BookOpen}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center">
                <Donut data={profile.lessonCompletion} centerValue={`${profile.lessonCompletion[0].value}%`} centerLabel="completed" height={180} />
                <div className="space-y-2">
                  {profile.lessonCompletion.map((c) => (
                    <div key={c.name} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
                      </span>
                      <span className="font-bold text-foreground">{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard
              title="Alerts"
              subtitle={`${alerts.length} updates for ${profile.name.split(' ')[0]}`}
              icon={Bell}
              action={
                unread > 0 ? (
                  <button
                    type="button"
                    className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline"
                    onClick={() => dispatch({ type: 'MARK_ALERTS_READ' })}
                  >
                    Mark read
                  </button>
                ) : <Badge tone="success">All read</Badge>
              }
            >
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl border p-2.5',
                      !state.alertsRead && a.tone === 'warn' ? 'border-amber-200 bg-amber-50/60' : 'border-border/70',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        a.tone === 'warn' ? 'bg-amber-100 text-amber-700' : a.tone === 'good' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700',
                      )}
                      aria-hidden
                    >
                      {a.tone === 'warn' ? <AlertTriangle size={13} /> : a.tone === 'good' ? <CheckCircle2 size={13} /> : <Bell size={13} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold leading-snug text-foreground">{a.text}</p>
                      <p className="text-[10px] text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              {alerts.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No alerts for this child.</p> : null}
            </SectionCard>

            <SectionCard title="This week" subtitle="Upcoming sessions and classes" icon={Clock}>
              <div className="space-y-2">
                {child === 'chidi'
                  ? specialSupport.sessions.map((s) => (
                      <div key={s.id} className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5">
                        <span className="text-lg" aria-hidden>{s.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-foreground">{s.title}</p>
                          <p className="text-[10px] text-muted-foreground">{s.when}</p>
                        </div>
                        <Badge tone="role">{s.next.split(',')[0]}</Badge>
                      </div>
                    ))
                  : [
                      { title: 'Mathematics', detail: 'Mr. Adeyemi · 10:00 AM', emoji: '🔢' },
                      { title: 'English Language', detail: 'Mrs. Okafor · 12:00 PM', emoji: '📖' },
                      { title: 'Basic Science', detail: 'Mr. Ibrahim · 2:00 PM', emoji: '🔬' },
                    ].map((s) => (
                      <div key={s.title} className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5">
                        <span className="text-lg" aria-hidden>{s.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-foreground">{s.title}</p>
                          <p className="text-[10px] text-muted-foreground">{s.detail}</p>
                        </div>
                        <Badge tone="neutral">Class</Badge>
                      </div>
                    ))}
              </div>
            </SectionCard>

            <SectionCard title="Subscription" subtitle={planName(planId)} icon={CreditCard} action={<Badge tone="warn">Renews 12 Nov</Badge>}>
              <p className="text-2xl font-extrabold text-foreground">{naira(plans.find((p) => p.id === planId)?.price ?? 8500)}<span className="text-xs font-semibold text-muted-foreground"> /month</span></p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {child === 'chidi' ? 'Specialist support, therapy activities and family sessions.' : 'General classes, assignments and feedback.'}
              </p>
              <Link to="/parent/subscriptions" className={buttonStyles('outline', 'sm', 'mt-3 w-full')}>
                Manage subscription
              </Link>
            </SectionCard>

            <SectionCard title="Teachers" subtitle="Your child’s teaching team" icon={Users} action={<Link to="/parent/teachers" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">All</Link>}>
              <div className="space-y-2">
                {parentTeachers[child].map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: t.soft, color: t.color }} aria-hidden>{t.initials}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.subject}</p>
                    </div>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> {t.rating}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}

export function ParentProgress() {
  const { state } = useApp()
  const toast = useToast()
  const [child, setChild] = useState<ChildId>('tunde')
  const profile = childrenData[child]

  const exportReport = () => {
    const lines = [
      `${profile.name} – Progress report`,
      `${profile.level} · ${longDate()}`,
      '',
      `Average: ${profile.average}% (${profile.averageTrend})`,
      `Attendance: ${profile.attendance}%`,
      `Work completed: ${profile.workDone} (${profile.workLabel})`,
      '',
      'Grades',
      ...profile.grades.map((g) => `${g.subject}: ${g.score}% (${g.grade}) – ${g.teacher}`),
      '',
      'Plan',
      planName(state.plans[child]),
    ]
    downloadText(`${profile.name.replace(/\s+/g, '-')}-progress.txt`, lines.join('\n'))
    toast('Report downloaded', `${profile.name}’s progress report is ready.`)
  }

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Academic progress"
        subtitle="A clear picture of this term"
        badge={<Badge tone="role">{profile.level}</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1300px] space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChildSwitch child={child} onChange={setChild} />
          <Button variant="outline" onClick={exportReport}>
            <Download size={15} /> Download report
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={profile.averageLabel} value={`${profile.average}%`} icon={TrendingUp} color={profile.color} soft={profile.soft} trend={{ value: profile.averageTrend }} />
          <StatCard label="Attendance" value={`${profile.attendance}%`} icon={CalendarCheck} color="#10b981" soft="#ecfdf5" sub={profile.attendanceLabel} />
          <StatCard label="Work done" value={profile.workDone} icon={ClipboardList} color="#6c3fc5" soft="#f0eefb" sub={profile.workLabel} />
          <StatCard label="Streak" value={profile.streak} icon={Star} color="#f59e0b" soft="#fffbeb" sub={profile.streakLabel} />
        </div>

        <SectionCard title="Performance over time" subtitle="Individual score vs class average" icon={TrendingUp}>
          <TrendArea
            data={profile.trend}
            series={[
              { key: 'score', label: profile.name.split(' ')[0], color: profile.color },
              { key: 'classAvg', label: 'Class average', color: '#94a3b8', dashed: true },
            ]}
            yDomain={[40, 100]}
            height={260}
          />
        </SectionCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <SectionCard title="Subject grades" subtitle="Latest continuous assessment" icon={BookOpen}>
            <div className="space-y-3">
              {profile.grades.map((g) => (
                <div key={g.code} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">{g.subject}</p>
                      <p className="text-[10px] text-muted-foreground">{g.teacher}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone="warn">{g.grade}</Badge>
                      <p className="mt-0.5 text-[10px] font-bold text-muted-foreground">{g.score}%</p>
                    </div>
                  </div>
                  <ProgressBar value={g.score} color={g.color} className="mt-2" label={`${g.subject} score`} />
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="space-y-5">
            <SectionCard title="Lesson completion" subtitle="Across this term" icon={BookOpen}>
              <Donut data={profile.lessonCompletion} centerValue={`${profile.lessonCompletion[0].value}%`} centerLabel="completed" height={190} />
              <div className="mt-2 space-y-1.5">
                {profile.lessonCompletion.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}</span>
                    <span className="font-bold text-foreground">{c.value}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <Card className={cn('p-4', profile.special ? 'border-role bg-role-soft/60' : 'bg-role-soft/50')}>
              <p className="text-xs font-bold text-foreground">{profile.special ? 'Specialist note' : 'Teacher note'}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {profile.special
                  ? 'Chidi is naming feelings more confidently and joined group play twice this week. Continue the visual schedule at home.'
                  : 'Tunde has improved steadily in Mathematics. Encouraging him to attempt the algebra quiz again will lift his average further.'}
              </p>
              <Link to="/parent/messages" className={buttonStyles('outline', 'sm', 'mt-3 w-full')}>
                Reply to teacher
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}

export function ParentAttendance() {
  const [child, setChild] = useState<ChildId>('tunde')
  const profile = childrenData[child]

  const week = [
    { day: 'Mon', subject: child === 'chidi' ? 'Speech & Language' : 'Mathematics' },
    { day: 'Tue', subject: child === 'chidi' ? 'Emotional Regulation' : 'English Language' },
    { day: 'Wed', subject: child === 'chidi' ? 'Social Skills Play' : 'Basic Science' },
    { day: 'Thu', subject: child === 'chidi' ? 'Speech & Language' : 'Social Studies' },
    { day: 'Fri', subject: child === 'chidi' ? 'Creative Expression' : 'Fine Arts' },
  ].map((row, i) => ({
    ...row,
    status: child === 'tunde' && i === 2 ? 'Absent' : child === 'chidi' && i === 4 ? 'Excused' : 'Present',
    time: ['10:00 AM', '11:30 AM', '2:00 PM', '10:00 AM', '9:00 AM'][i],
  }))

  const present = week.filter((w) => w.status === 'Present').length
  const absences = week.filter((w) => w.status !== 'Present').length
  const excused = week.filter((w) => w.status === 'Excused').length

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Attendance"
        subtitle="Class and specialist session attendance"
        badge={<Badge tone="success">{profile.attendance}% this term</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <ChildSwitch child={child} onChange={setChild} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Attendance rate" value={`${profile.attendance}%`} icon={CalendarCheck} color="#10b981" soft="#ecfdf5" sub={profile.attendanceLabel} />
          <StatCard label="Present this week" value={`${present}/5`} icon={CheckCircle2} color="#6c3fc5" soft="#f0eefb" sub="Keep it up" />
          <StatCard label="Absences" value={absences} icon={AlertTriangle} color="#f97316" soft="#fff4e8" sub={excused ? `${excused} excused` : 'None excused'} />
          <StatCard label="Punctuality" value="94%" icon={Clock} color="#0ea5e9" soft="#e8f4fd" sub="On time this month" />
        </div>

        <SectionCard title="This week" subtitle="Daily attendance record" icon={CalendarCheck}>
          <div className="grid grid-cols-5 gap-2">
            {week.map((w) => (
              <div
                key={w.day}
                className={cn(
                  'rounded-xl border p-2.5 text-center',
                  w.status === 'Present' ? 'border-emerald-200 bg-emerald-50' : w.status === 'Excused' ? 'border-sky-200 bg-sky-50' : 'border-rose-200 bg-rose-50',
                )}
              >
                <p className="text-[11px] font-bold text-foreground">{w.day}</p>
                <p className="mt-1 text-lg" aria-hidden>{w.status === 'Present' ? '✅' : w.status === 'Excused' ? '🗓️' : '❌'}</p>
                <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground">{w.status}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Session records" subtitle="Most recent first" icon={ClipboardList}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-bold">Day</th>
                  <th className="px-2 py-2 font-bold">Subject / session</th>
                  <th className="px-2 py-2 font-bold">Time</th>
                  <th className="px-2 py-2 font-bold">Status</th>
                  <th className="px-2 py-2 text-right font-bold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {week.map((w) => (
                  <tr key={w.day}>
                    <td className="px-2 py-3 font-semibold text-foreground">{w.day}</td>
                    <td className="px-2 py-3 text-muted-foreground">{w.subject}</td>
                    <td className="px-2 py-3 text-muted-foreground">{w.time}</td>
                    <td className="px-2 py-3">
                      <Badge tone={w.status === 'Present' ? 'success' : w.status === 'Excused' ? 'sky' : 'danger'}>{w.status}</Badge>
                    </td>
                    <td className="px-2 py-3 text-right text-muted-foreground">1 hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <Card className="flex flex-wrap items-center justify-between gap-3 bg-role-soft/50 p-4">
          <p className="text-xs font-semibold text-foreground">Need to report an upcoming absence?</p>
          <Link to="/parent/messages" className={buttonStyles('outline', 'sm')}>
            Message the teacher <ArrowRight size={13} />
          </Link>
        </Card>
      </div>
    </RoleLayout>
  )
}

export function ParentAssignments() {
  const { state } = useApp()
  const toast = useToast()
  const [child, setChild] = useState<ChildId>('tunde')
  const profile = childrenData[child]
  const assignments = state.assignments.filter((a) => a.stage === 'junior')
  const completedActivities = specialActivities.filter((a) => state.completedActivities.includes(a.id))

  const exportWork = () => {
    if (child === 'tunde') {
      downloadCsv('tunde-assignments.csv', [
        ['Assignment', 'Subject', 'Status', 'Score', 'Due'],
        ...assignments.map((a) => [a.title, a.subject, a.status, a.score !== undefined ? `${a.score}/${a.points}` : '—', a.dueLabel]),
      ])
    } else {
      downloadCsv('chidi-activities.csv', [
        ['Activity', 'Tag', 'Minutes', 'Completed'],
        ...specialActivities.map((a) => [a.title, a.tag, a.minutes, state.completedActivities.includes(a.id) ? 'Yes' : 'No']),
      ])
    }
    toast('Export ready', `${profile.name}’s learning record has been downloaded.`)
  }

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Assignments & activities"
        subtitle="What your child is working on"
        badge={<Badge tone="role">{profile.level}</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChildSwitch child={child} onChange={setChild} />
          <Button variant="outline" onClick={exportWork}>
            <Download size={15} /> Export record
          </Button>
        </div>

        {child === 'tunde' ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Assignments" value={assignments.length} icon={ClipboardList} color="#64748b" soft="#f1f5f9" sub="This term" />
              <StatCard label="Submitted" value={assignments.filter((a) => a.status !== 'pending').length} icon={CheckCircle2} color="#10b981" soft="#ecfdf5" sub="Teacher notified" />
              <StatCard label="Graded" value={assignments.filter((a) => a.status === 'graded').length} icon={Star} color="#6c3fc5" soft="#f0eefb" sub="Feedback ready" />
              <StatCard label="Average score" value="84%" icon={TrendingUp} color="#0ea5e9" soft="#e8f4fd" trend={{ value: '5%' }} />
            </div>

            <SectionCard title="Tunde’s assignments" subtitle="Status visible to you and his teachers" icon={ClipboardList}>
              <div className="space-y-2.5">
                {assignments.map((a) => (
                  <div key={a.id} className="flex flex-col gap-2.5 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-extrabold" style={{ background: `${a.subjectColor}18`, color: a.subjectColor }} aria-hidden>
                      {a.subject.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">{a.subject} · {a.dueLabel} · {a.points} pts</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.score !== undefined ? <span className="text-[11px] font-bold text-emerald-600">{a.score}/{a.points}</span> : null}
                      <Badge tone={a.status === 'graded' ? 'success' : a.status === 'submitted' ? 'primary' : 'warn'}>
                        {a.status === 'pending' ? 'To do' : a.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {assignments.length === 0 ? <EmptyState emoji="🌱" title="No assignments yet" description="New work will appear here." /> : null}
            </SectionCard>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Activities" value={specialActivities.length} icon={HeartHandshake} color="var(--role-accent)" soft="var(--role-soft)" sub="This week" />
              <StatCard label="Completed" value={completedActivities.length} icon={CheckCircle2} color="#10b981" soft="#ecfdf5" sub="Calm wins" />
              <StatCard label="Activity minutes" value={state.totalActivityMinutes} icon={Timer} color="#0ea5e9" soft="#e8f4fd" sub="Learning time" />
              <StatCard label="Awards" value={specialAwards.filter((a) => a.earned).length} icon={Star} color="#f59e0b" soft="#fffbeb" sub="Earned so far" />
            </div>

            <SectionCard title="Chidi’s learning activities" subtitle="Therapy-oriented and creative practice" icon={HeartHandshake}>
              <div className="space-y-2.5">
                {specialActivities.map((a) => {
                  const done = state.completedActivities.includes(a.id)
                  return (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: a.soft }} aria-hidden>{a.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-foreground">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground">{a.tag} · {a.minutes} min · +{a.reward} points</p>
                      </div>
                      <Badge tone={done ? 'success' : 'neutral'}>{done ? 'Completed' : 'Suggested'}</Badge>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            <Card className="rounded-3xl border-role bg-role-soft/60 p-4">
              <p className="text-xs font-bold text-role-ink">Specialist progress note</p>
              <p className="mt-1 text-[11px] leading-relaxed text-role-ink">
                Chidi completed {completedActivities.length} activities and practised naming feelings. Ms. Sarah recommends
                continuing the visual schedule at home. View the full support plan under Special Support.
              </p>
              <Link to="/parent/support" className={buttonStyles('outline', 'sm', 'mt-3')}>
                View support plan <ArrowRight size={13} />
              </Link>
            </Card>
          </>
        )}
      </div>
    </RoleLayout>
  )
}

export function ParentTeachers() {
  const [child, setChild] = useState<ChildId>('tunde')
  const [contact, setContact] = useState<string | null>(null)
  const toast = useToast()
  const profile = childrenData[child]
  const teachers = parentTeachers[child]

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Teachers"
        subtitle="Your child’s verified teaching team"
        badge={<Badge tone="success">All verified</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1100px] space-y-5 p-4 sm:p-6">
        <ChildSwitch child={child} onChange={setChild} />

        <Card className="flex flex-wrap items-center justify-between gap-3 bg-role-soft/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <ShieldCheck size={16} className="text-role" /> Every teacher is identity-checked and safeguarding trained.
          </div>
          <Button size="sm" variant="outline" onClick={() => toast('Booking request sent', 'The teacher will confirm a meeting time with you.')}>
            <CalendarCheck size={14} /> Book a meeting
          </Button>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => (
            <Card key={t.id} hover className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-extrabold" style={{ background: t.soft, color: t.color }} aria-hidden>{t.initials}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.subject}</p>
                  <p className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                    <Star size={10} className="fill-amber-400 text-amber-400" /> {t.rating} rating
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Teaches {profile.name.split(' ')[0]} · responds within a school day.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="role" className="flex-1" onClick={() => setContact(t.name)}>
                  <MessageCircle size={13} /> Message
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast('Meeting requested', `${t.name} will propose two time slots.`)}>
                  Meet
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <SectionCard title="Communication guidelines" subtitle="Safe, transparent and child-friendly" icon={ShieldCheck}>
          <ul className="grid grid-cols-1 gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
            {[
              'Messages between teachers and students are monitored.',
              'Parents can view all teacher conversations.',
              'Meetings happen inside the platform with recording.',
              'Report anything uncomfortable in Safety & Reports.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-1.5 rounded-lg bg-muted/50 p-2.5">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" /> {t}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <ComposeMessageModal
        open={Boolean(contact)}
        onClose={() => setContact(null)}
        to={contact ?? ''}
        subtitle={`${profile.name}’s teacher`}
        audience="parent"
        author="Mrs. Ngozi Bakare"
        emoji="👪"
      />
    </RoleLayout>
  )
}

/**
 * Next renewal is one calendar month after each charge. Renewals are not written
 * to the ledger, so roll forward until the date is in the future.
 */
function nextRenewal(from: Date) {
  const next = new Date(from)
  for (let i = 0; i < 240 && next.getTime() <= Date.now(); i += 1) {
    const day = next.getDate()
    next.setMonth(next.getMonth() + 1)
    if (next.getDate() < day) next.setDate(0)
  }
  return next
}

export function ParentSubscriptions() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const { profile: account } = useAuth()
  const [child, setChild] = useState<ChildId>('tunde')
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null)
  const [email, setEmail] = useState('')
  const [coupon, setCoupon] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)
  const [paidNotice] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const paidChild = params.get('child')
    return {
      planId: params.get('paid'),
      child: paidChild === 'tunde' || paidChild === 'chidi' ? (paidChild as ChildId) : null,
    }
  })
  const announced = useRef(false)
  const [payments, setPayments] = useState<PaymentRow[] | null>(null)
  const profile = childrenData[child]
  const current = state.plans[child]
  const childPayments = (payments ?? []).filter((p) => p.child_id === child && p.status === 'success')
  const lastPayment = childPayments[0] ?? null
  const nextCharge = lastPayment ? nextRenewal(new Date(lastPayment.created_at)) : null
  const nextPaymentLabel = paymentsConfigured
    ? nextCharge
      ? `Next payment ${dayMonth(nextCharge)} · auto-renews via Paystack`
      : 'No payments yet · choose a plan to subscribe'
    : `Next payment ${dayMonth(nextMonthlyDay(12))} · auto-renew on`
  const history = billingHistory.filter((b) => b.child === profile.name)
  const pending = pendingPlan ? plans.find((p) => p.id === pendingPlan) ?? null : null
  const couponPreview = pending ? applyCoupon(coupon, pending.price) : null
  const couponInvalid = coupon.trim().length > 0 && !couponPreview
  const payable = couponPreview?.total ?? pending?.price ?? 0

  useEffect(() => {
    if (!paymentsConfigured) return
    let cancelled = false
    void listMyPayments().then((rows) => {
      if (!cancelled) setPayments(rows)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const requestPlan = (next: PlanId) => {
    setEmail(account?.email ?? '')
    setCoupon('')
    setPendingPlan(next)
  }

  useEffect(() => {
    if (!paidNotice.planId || announced.current) return
    announced.current = true
    const chosen = plans.find((p) => p.id === paidNotice.planId)
    const paidChild = paidNotice.child ?? child
    if (paidNotice.child) setChild(paidNotice.child)
    toast('Payment confirmed', {
      description: chosen
        ? `${chosen.name} is active for ${childrenData[paidChild].name}.`
        : 'Your new plan is active.',
      tone: 'success',
    })
    window.history.replaceState({}, '', '/parent/subscriptions')
  }, [paidNotice, child, toast])

  const confirmPlan = async () => {
    if (!pending || savingPlan) return
    if (coupon.trim() && !couponPreview) {
      toast('That promo code isn’t valid', { description: 'Remove it or try BLOOM10, FAMILY15 or WAEC20.', tone: 'warn' })
      return
    }

    if (paymentsConfigured) {
      setSavingPlan(true)
      const result = await startCheckout(child, pending.id, couponPreview?.code)
      setSavingPlan(false)
      if (!result.ok) {
        toast('Payment not started', { description: result.message, tone: 'warn' })
      }
      return
    }

    if (!looksLikeEmail(email)) {
      toast('Add a confirmation email', { description: 'We send the plan summary there.', tone: 'warn' })
      return
    }
    setSavingPlan(true)
    dispatch({ type: 'CHANGE_PLAN', child, plan: pending.id })
    setPendingPlan(null)
    const result = await sendConfirmationEmail('plan', email, {
      childName: profile.name,
      planName: pending.name,
      price: naira(payable),
      nextPayment: dayMonth(nextMonthlyDay(12)),
      parentName: account?.full_name ?? '',
    })
    setSavingPlan(false)
    setCoupon('')
    toast(result.sent ? 'Plan updated' : 'Plan saved', {
      description: result.sent ? `Confirmation sent to ${email.trim()}.` : result.message,
      tone: result.ok ? 'success' : 'warn',
    })
  }

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Subscriptions"
        subtitle="Manage plans, billing and payment methods"
        badge={<Badge tone="role">{planName(current)}</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <ChildSwitch child={child} onChange={setChild} />

        <Card className="flex flex-wrap items-center justify-between gap-3 bg-role-soft/60 p-4">
          <div>
            <p className="text-xs font-bold text-foreground">{profile.name} is on the {planName(current)}</p>
            <p className="text-[11px] text-muted-foreground">{nextPaymentLabel}</p>
          </div>
          {paymentsConfigured && payments !== null && !lastPayment ? (
            <Badge tone="warn">No payment on file</Badge>
          ) : (
            <Badge tone="success">Active</Badge>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => {
            const active = current === p.id
            return (
              <Card key={p.id} className={cn('flex flex-col p-5', active && 'border-role/50 shadow-sm', p.popular && !active && 'border-sky-200')}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-foreground">{p.name}</p>
                  {active ? <Badge tone="success">Current</Badge> : p.popular ? <Badge tone="sky">Popular</Badge> : null}
                </div>
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {naira(p.price)}
                  <span className="text-xs font-semibold text-muted-foreground"> /month</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{p.tagline}</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={active ? 'outline' : 'role'}
                  disabled={active}
                  onClick={() => requestPlan(p.id)}
                >
                  {active ? 'Current plan' : `Switch to ${p.name}`}
                </Button>
              </Card>
            )
          })}
        </div>

        <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-extrabold text-foreground">Parent Access</p>
              <Badge tone="warn">Premium only</Badge>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Optional {naira(parentAccessAddon.price)}/month add-on for a second guardian. Only available on the Premium,
              Premium Plus and Special Needs Premium plans.
            </p>
          </div>
          <Link
            to="/parent/access"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100 sm:self-auto"
          >
            Manage Parent Access <ArrowRight size={12} />
          </Link>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <SectionCard title="Billing history" subtitle="Payments and receipts" icon={Wallet}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left">
                <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-bold">Date</th>
                    {paymentsConfigured ? (
                      <>
                        <th className="px-2 py-2 font-bold">Plan</th>
                        <th className="px-2 py-2 text-right font-bold">Amount</th>
                        <th className="px-2 py-2 text-right font-bold">Status</th>
                      </>
                    ) : (
                      <>
                        <th className="px-2 py-2 font-bold">Child</th>
                        <th className="px-2 py-2 font-bold">Plan</th>
                        <th className="px-2 py-2 text-right font-bold">Amount</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 text-xs">
                  {paymentsConfigured ? (
                    childPayments.length ? (
                      childPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-2 py-3 text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-2 py-3 font-semibold text-foreground">{planName(p.plan_id)}</td>
                          <td className="px-2 py-3 text-right font-bold text-foreground">{naira(Math.round(p.amount / 100))}</td>
                          <td className="px-2 py-3 text-right">
                            <Badge tone="success">Paid</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-2 py-6 text-center text-[11px] text-muted-foreground">
                          {payments === null ? 'Loading receipts…' : 'No payments yet — your first receipt appears here.'}
                        </td>
                      </tr>
                    )
                  ) : (
                    history.map((b) => (
                      <tr key={b.id}>
                        <td className="px-2 py-3 text-muted-foreground">{b.date}</td>
                        <td className="px-2 py-3 font-semibold text-foreground">{b.child}</td>
                        <td className="px-2 py-3 text-muted-foreground">{b.plan}</td>
                        <td className="px-2 py-3 text-right font-bold text-foreground">{naira(b.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="space-y-5">
            <SectionCard title="Payment method" subtitle="Secure and encrypted" icon={CreditCard}>
              {paymentsConfigured ? (
                <>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <ShieldCheck size={14} className="text-emerald-600" /> Handled by Paystack
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      Card, bank transfer and USSD details are entered on Paystack’s secure checkout and never stored on
                      NeuroBloom.
                    </p>
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                    Every charge is followed by a Paystack receipt with links to cancel the subscription or change your
                    card.
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-xs font-bold text-foreground">Mastercard · •••• 8842</p>
                    <p className="text-[10px] text-muted-foreground">Expires 09/28 · Ngozi Bakare</p>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    variant="outline"
                    onClick={() => toast('Payment updated', 'A secure verification link was sent to your email.')}
                  >
                    Update card
                  </Button>
                </>
              )}
            </SectionCard>

            <Card className="bg-emerald-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-900"><ShieldCheck size={15} /> Child-safe billing</p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                No card details are stored on your child’s account. Cancel or change plans any time before renewal.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(pending)}
        onClose={() => setPendingPlan(null)}
        title="Confirm plan change"
        subtitle={pending ? `${profile.name} · ${pending.name}` : undefined}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPendingPlan(null)} disabled={savingPlan}>
              Keep current plan
            </Button>
            <Button variant="role" size="sm" onClick={() => void confirmPlan()} disabled={savingPlan || couponInvalid}>
              {savingPlan
                ? 'Switching…'
                : paymentsConfigured && pending
                  ? `Pay ${naira(payable)} & switch`
                  : 'Confirm switch'}
            </Button>
          </div>
        }
      >
        {pending ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
              <p className="text-xs font-bold text-foreground">
                {pending.name} · {naira(payable)}
                <span className="font-medium text-muted-foreground"> {couponPreview ? 'first payment' : '/month'}</span>
                {couponPreview ? (
                  <span className="ml-1.5 text-[10px] font-semibold text-emerald-700 line-through">{naira(pending.price)}</span>
                ) : null}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {paymentsConfigured
                  ? couponPreview
                    ? 'Charged once today at the promo price. A promo payment does not set up an automatic renewal — choose a plan again when you want to continue at the regular price.'
                    : 'Charged today, then automatically every month until you cancel. The Paystack receipt email has links to cancel or change your card.'
                  : `Takes effect now. Next payment ${dayMonth(nextMonthlyDay(12))}. You can change or cancel before renewal.`}
              </p>
            </div>

            <div>
              <Input
                label="Promo code (optional)"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value.toUpperCase())}
                placeholder="e.g. BLOOM10"
                aria-invalid={couponInvalid}
                hint={couponPreview ? `${couponPreview.label} applied` : 'Try BLOOM10, FAMILY15 or WAEC20'}
              />
              {couponPreview ? (
                <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900">
                  <div className="flex items-center justify-between">
                    <span>{couponPreview.label}</span>
                    <span className="font-semibold">−{naira(couponPreview.discount)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-emerald-200 pt-1 font-bold">
                    <span>Due today</span>
                    <span>{naira(couponPreview.total)}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-emerald-800">
                    This is a one-off payment at the discounted price, recorded on your receipt. No automatic renewal starts from it.
                  </p>
                </div>
              ) : couponInvalid ? (
                <p role="alert" className="mt-1.5 text-[11px] font-medium text-destructive">
                  That promo code isn’t valid. Check the spelling or clear the field.
                </p>
              ) : null}
            </div>

            {paymentsConfigured ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-900">
                You’ll be taken to Paystack to pay securely by card, bank transfer or USSD. The plan
                activates the moment the payment succeeds and appears in the mobile app right away.
              </p>
            ) : (
              <Input
                label="Confirmation email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                hint="We send the plan summary and next payment date here."
              />
            )}
          </div>
        ) : null}
      </Modal>
    </RoleLayout>
  )
}

function billingRange(start: Date, end: Date) {
  const startLabel = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startLabel} – ${endLabel}`
}

export function ParentBilling() {
  const { state } = useApp()
  const toast = useToast()
  const { profile: account } = useAuth()
  const [child, setChild] = useState<ChildId>('tunde')
  const [payments, setPayments] = useState<PaymentRow[] | null>(null)
  const profile = childrenData[child]
  const current = state.plans[child]
  const plan = plans.find((p) => p.id === current) ?? plans[0]
  const access = state.parentAccess[child]
  const accessActive = access.active && (!access.until || new Date(access.until) > new Date())
  const eligible = PREMIUM_PLAN_IDS.includes(current)

  useEffect(() => {
    if (!paymentsConfigured) return
    let cancelled = false
    void listMyPayments().then((rows) => {
      if (!cancelled) setPayments(rows)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const demoHistory = billingHistory.filter((b) => b.child === profile.name)
  const childPayments = (payments ?? []).filter((p) => p.child_id === child && p.status === 'success')
  const lastPayment = childPayments[0] ?? null
  // Seeded demo families have a billing record but no Paystack row, so their
  // validity comes from that record until a real charge exists.
  const start = lastPayment
    ? new Date(lastPayment.created_at)
    : demoHistory.length
      ? new Date(demoHistory[0].date)
      : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 12)
  const end = nextRenewal(start)
  const autoRenews = Boolean(lastPayment) || demoHistory.length > 0 || !paymentsConfigured

  const receipts = childPayments.length
    ? childPayments.map((p) => ({
        id: p.id,
        date: new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        plan: planName(p.plan_id),
        amount: Math.round(p.amount / 100),
      }))
    : demoHistory.map((b) => ({ id: b.id, date: b.date, plan: b.plan, amount: b.amount }))

  const downloadReceipt = (receipt: { date: string; plan: string; amount: number }) => {
    downloadText(
      `receipt-${profile.name.replace(/\s+/g, '-')}-${receipt.date.replace(/\s+/g, '-')}.txt`,
      [
        'NeuroBloom LearningSphere — payment receipt',
        `Billed to: ${account?.full_name ?? 'Mrs. Ngozi Bakare'} (${account?.email ?? 'parent account'})`,
        `Learner: ${profile.name} · ${profile.level}`,
        `Plan: ${receipt.plan}`,
        `Amount: ${naira(receipt.amount)}`,
        `Paid: ${receipt.date}`,
        `Subscription validity: ${billingRange(start, end)}`,
      ].join('\n'),
    )
    toast('Receipt downloaded', `${receipt.plan} · ${receipt.date}`)
  }

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="My Billing"
        subtitle="Your subscription, renewal date and payment details"
        badge={<Badge tone="role">{plan.name}</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1100px] space-y-5 p-4 sm:p-6">
        <ChildSwitch child={child} onChange={setChild} />

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Current plan</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{plan.name}</h2>
                <Badge tone="success">Active</Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {profile.name} · {profile.level} · {naira(plan.price)}/month
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <Clock size={12} className="shrink-0" />
                <span>
                  Subscription validity: <strong className="font-bold text-foreground">{billingRange(start, end)}</strong>
                </span>
                <span aria-hidden className="text-border">|</span>
                <span>{autoRenews ? 'Auto-renews monthly' : 'No automatic renewal'}</span>
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {autoRenews
                  ? `The next ${naira(plan.price)} charge is due ${dayMonth(end)}. Cancel any time before then and the plan stays active until the period ends.`
                  : 'This plan was paid as a one-off, so nothing renews automatically. Choose the plan again when you want to continue.'}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link to="/parent/subscriptions" className={buttonStyles('outline', 'md')}>
                Manage subscription
              </Link>
              <Link to="/parent/subscriptions" className={buttonStyles('primary', 'md')}>
                Upgrade
              </Link>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-extrabold text-foreground">Parent Access</p>
              <Badge tone="warn">Premium only</Badge>
              <Badge tone={accessActive ? 'success' : 'neutral'}>{accessActive ? 'Active' : 'Not active'}</Badge>
            </div>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
              Optional {naira(parentAccessAddon.price)}/month add-on for a second guardian.{' '}
              {eligible
                ? `Available on ${plan.name}; it is billed separately from the plan above.`
                : 'Available only on the Premium, Premium Plus and Special Needs Premium plans.'}
              {accessActive && access.until ? ` Paid through ${dayMonth(new Date(access.until))}.` : ''}
            </p>
          </div>
          <Link
            to="/parent/access"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100 sm:self-auto"
          >
            Add or manage Parent Access <ArrowRight size={12} />
          </Link>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-foreground">Manage Billing Information</p>
              <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted-foreground">
                Manage your payment methods and billing information. Card, bank transfer and USSD details are entered on
                Paystack’s secure checkout and never stored on NeuroBloom.
              </p>
            </div>
            <Link to="/parent/subscriptions" className={buttonStyles('outline', 'sm', 'shrink-0')}>
              Manage billing
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/70 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Billing email', value: account?.email ?? 'Parent account' },
              { label: 'Billing contact', value: account?.full_name ?? 'Mrs. Ngozi Bakare' },
              { label: 'Payment method', value: paymentsConfigured ? 'Paystack secure checkout' : 'Mastercard · •••• 8842' },
              { label: 'Next payment', value: autoRenews ? `${dayMonth(end)} · ${naira(plan.price)}` : 'None scheduled' },
            ].map((row) => (
              <div key={row.label} className="rounded-xl bg-muted/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{row.label}</p>
                <p className="mt-1 truncate text-[11px] font-bold text-foreground">{row.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <SectionCard title="Receipts" subtitle={`Charges for ${profile.name}`} icon={Wallet}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-bold">Date</th>
                  <th className="px-2 py-2 font-bold">Plan</th>
                  <th className="px-2 py-2 text-right font-bold">Amount</th>
                  <th className="px-2 py-2 text-right font-bold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {receipts.length ? (
                  receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-2 py-3 text-muted-foreground">{receipt.date}</td>
                      <td className="px-2 py-3 font-semibold text-foreground">{receipt.plan}</td>
                      <td className="px-2 py-3 text-right font-bold text-foreground">{naira(receipt.amount)}</td>
                      <td className="px-2 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => downloadReceipt(receipt)}
                          className="inline-flex items-center gap-1 py-1 text-[11px] font-bold text-role hover:underline"
                        >
                          <Download size={12} /> Download
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-2 py-6 text-center text-[11px] text-muted-foreground">
                      {payments === null && paymentsConfigured ? 'Loading receipts…' : 'No payments yet — your first receipt appears here.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <Card className="bg-emerald-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <ShieldCheck size={15} /> Child-safe billing
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
            No card details are stored on your child’s account. Plan changes and cancellations take effect at the next
            renewal, and every charge produces a receipt you can download above.
          </p>
        </Card>
      </div>
    </RoleLayout>
  )
}

export function ParentAccess() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [child, setChild] = useState<ChildId>('tunde')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [registerFlow] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('register') !== 'access') return false
    const registerChild = params.get('child')
    if (registerChild === 'tunde' || registerChild === 'chidi') setChild(registerChild)
    return true
  })
  const announced = useRef(false)
  const openedRegisterStep = useRef(false)
  const profile = childrenData[child]
  const planId = state.plans[child]
  const eligible = PREMIUM_PLAN_IDS.includes(planId)
  const entry = state.parentAccess[child]
  const active = entry.active && (!entry.until || new Date(entry.until) > new Date())

  useEffect(() => {
    if (!registerFlow || openedRegisterStep.current) return
    if (!eligible || active) return
    openedRegisterStep.current = true
    clearParentAccessIntent()
    setConfirming(true)
    window.history.replaceState({}, '', '/parent/access')
  }, [registerFlow, eligible, active])

  useEffect(() => {
    if (announced.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') !== parentAccessAddon.id) return
    announced.current = true
    const paidChild = params.get('child')
    if (paidChild === 'tunde' || paidChild === 'chidi') setChild(paidChild)
    toast('Parent Access is active', {
      description: 'The optional add-on is now on for this child.',
      tone: 'success',
    })
    window.history.replaceState({}, '', '/parent/access')
  }, [toast])

  const addAccess = async () => {
    if (!eligible || saving) return
    if (paymentsConfigured) {
      setSaving(true)
      const result = await startCheckout(child, parentAccessAddon.id)
      setSaving(false)
      if (!result.ok) {
        toast('Payment not started', { description: result.message, tone: 'warn' })
      } else {
        setConfirming(false)
      }
      return
    }
    setSaving(true)
    dispatch({ type: 'SET_PARENT_ACCESS', child, active: true })
    setSaving(false)
    setConfirming(false)
    toast('Parent Access added', {
      description: `${profile.name} · ${naira(parentAccessAddon.price)}/month · optional.`,
      tone: 'success',
    })
  }

  const removeAccess = () => {
    dispatch({ type: 'SET_PARENT_ACCESS', child, active: false })
    setConfirming(false)
    toast('Parent Access turned off', {
      description: 'This add-on is optional. Your parent portal keeps working.',
      tone: 'success',
    })
  }

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Parent Access"
        subtitle="Optional add-on for Premium learners"
        badge={<Badge tone="neutral">Optional</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1000px] space-y-5 p-4 sm:p-6">
        <ChildSwitch child={child} onChange={setChild} />

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border/70 bg-role-soft/50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-role-soft text-role-ink">
                  <UserCheck size={20} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold text-foreground">Parent Access</h2>
                    <Badge tone="neutral">Optional</Badge>
                    {active ? <Badge tone="success">Active</Badge> : null}
                  </div>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                    Give a second guardian their own login to {profile.name}’s dashboard. This is an optional
                    add-on — the parent portal you are using now keeps working with or without it.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-foreground">
                  {naira(parentAccessAddon.price)}
                  <span className="text-xs font-semibold text-muted-foreground"> /month</span>
                </p>
                <p className="text-[10px] text-muted-foreground">Billed separately</p>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <ul className="grid gap-2 sm:grid-cols-2">
              {parentAccessAddon.features.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" /> {feature}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 sm:w-56">
              {eligible ? (
                <Button variant={active ? 'outline' : 'role'} onClick={() => setConfirming(true)}>
                  {active ? 'Turn off add-on' : `Add Parent Access · ${naira(parentAccessAddon.price)}`}
                </Button>
              ) : (
                <Link to="/parent/subscriptions" className={buttonStyles('outline', 'md')}>
                  View premium plans
                </Link>
              )}
              <p className="text-center text-[10px] text-muted-foreground">
                {active && entry.until
                  ? `Paid through ${dayMonth(new Date(entry.until))}`
                  : 'No charge unless you add it'}
              </p>
            </div>
          </div>
        </Card>

        {!eligible ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
            <Lock size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-bold text-amber-900">Available on premium plans</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                {profile.name} is on the {planName(planId)}. Parent Access is optional and only available on the
                Premium, Premium Plus and Special Needs Premium plans — nothing changes if you skip it.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <SectionCard title="Optional" subtitle="Never required">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Learning, classes and reports continue exactly as they are if you leave this off.
              </p>
            </SectionCard>
            <SectionCard title="One child" subtitle="Billed per child">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                The add-on covers {profile.name} only; you can add it separately for each child.
              </p>
            </SectionCard>
            <SectionCard title="Turn off anytime" subtitle="No lock-in">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Remove the add-on whenever you like; the rest of the parent portal is unchanged.
              </p>
            </SectionCard>
          </div>
        )}
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={
          registerFlow && !active
            ? 'Finish your Parent Access signup'
            : active
              ? 'Turn off Parent Access?'
              : 'Add Parent Access?'
        }
        subtitle={registerFlow && !active ? `${profile.name} · Step 2 of 2` : `${profile.name} · Optional add-on`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={saving}>
              Keep as is
            </Button>
            <Button
              variant={active ? 'outline' : 'role'}
              size="sm"
              onClick={() => (active ? removeAccess() : void addAccess())}
              disabled={saving}
            >
              {saving ? 'Starting…' : active ? 'Turn off' : paymentsConfigured ? `Pay ${naira(parentAccessAddon.price)}` : 'Add add-on'}
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed text-muted-foreground">
          {registerFlow && !active
            ? `${profile.name}’s ${planName(planId)} is active. Add Parent Access for ${naira(parentAccessAddon.price)}/month so a second guardian gets their own login. You can turn it off at any time.`
            : active
              ? 'Turning this off removes the extra guardian access. Your own parent portal is not affected.'
              : paymentsConfigured
                ? `You’ll be taken to Paystack to pay ${naira(parentAccessAddon.price)} securely. This is an optional monthly add-on and the child’s premium plan stays unchanged.`
                : `${naira(parentAccessAddon.price)} per month per child. This is optional and can be turned off at any time.`}
        </p>
      </Modal>
    </RoleLayout>
  )
}

export function ParentMessages() {
  const { state } = useApp()
  const [contact, setContact] = useState<string | null>(null)
  const [child, setChild] = useState<ChildId>('tunde')
  const teachers = parentTeachers[child]
  const unread = state.threads
    .filter((t) => t.audience === 'parent')
    .reduce((sum, t) => sum + (t.unread ?? 0), 0)

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Messages"
        subtitle="Speak with teachers and specialists"
        badge={unread > 0 ? <Badge tone="role">{unread} unread</Badge> : <Badge tone="success">All caught up</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChildSwitch child={child} onChange={setChild} />
          <p className="text-[11px] text-muted-foreground">{state.threads.filter((t) => t.audience === 'parent').length} conversations</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <SectionCard title="Quick contacts" subtitle={`${childrenData[child].name}’s team`} icon={MessageCircle}>
            <div className="space-y-2">
              {teachers.map((t) => (
                <button type="button" key={t.id} onClick={() => setContact(t.name)} className="flex w-full items-center gap-2.5 rounded-lg border border-border/70 p-2.5 text-left transition hover:bg-muted/50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: t.soft, color: t.color }} aria-hidden>{t.initials}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold text-foreground">{t.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{t.subject}</span>
                  </span>
                  <ArrowRight size={13} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </SectionCard>

          <Card className="p-3 sm:p-4">
            <Messenger audience="parent" author="Mrs. Ngozi Bakare" />
          </Card>
        </div>
      </div>

      <ComposeMessageModal
        open={Boolean(contact)}
        onClose={() => setContact(null)}
        to={contact ?? ''}
        subtitle="Teacher conversation"
        audience="parent"
        author="Mrs. Ngozi Bakare"
        emoji="👪"
      />
    </RoleLayout>
  )
}

export function ParentSafety() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [child, setChild] = useState<ChildId>('tunde')
  const [category, setCategory] = useState('Unkind message')
  const [detail, setDetail] = useState('')

  const submit = () => {
    if (!detail.trim()) return
    dispatch({
      type: 'ADD_REPORT',
      report: {
        id: uid('rp'),
        child: childrenData[child].name,
        category,
        detail: detail.trim(),
        at: 'Just now',
        status: 'Under review',
      },
    })
    toast('Report submitted', 'Our safeguarding team will review this within 24 hours.')
    setDetail('')
  }

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Safety & reports"
        subtitle="Supervision controls and safeguarding"
        badge={<Badge tone="success">2 children protected</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1150px] space-y-5 p-4 sm:p-6">
        <ChildSwitch child={child} onChange={setChild} />

        <Card className="flex flex-wrap items-center gap-3 border-0 bg-[linear-gradient(120deg,#052e22,#10b981)] p-5 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15" aria-hidden><ShieldCheck size={24} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Your child’s safety is our priority</p>
            <p className="mt-0.5 text-[11px] text-white/75">All classes are moderated, teachers are verified, and only trusted adults can message your child.</p>
          </div>
          <Badge className="!bg-white/15 !text-white">Safeguarding active</Badge>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SectionCard title="Parental supervision" subtitle={`Applied to ${childrenData[child].name}`} icon={ShieldCheck}>
            <div className="divide-y divide-border/60">
              <Toggle
                checked={state.supervision.restrictMessaging}
                onChange={() => dispatch({ type: 'TOGGLE_SUPERVISION', key: 'restrictMessaging' })}
                label="Restricted messaging"
                description="Only teachers and approved contacts can message your child."
              />
              <Toggle
                checked={state.supervision.screenTimeLimit}
                onChange={() => dispatch({ type: 'TOGGLE_SUPERVISION', key: 'screenTimeLimit' })}
                label="Screen-time limit"
                description="Pause lessons after 2 hours of daily learning."
              />
              <Toggle
                checked={state.supervision.weeklyDigest}
                onChange={() => dispatch({ type: 'TOGGLE_SUPERVISION', key: 'weeklyDigest' })}
                label="Weekly safety digest"
                description="Receive a summary of conversations and activity each Sunday."
              />
              <Toggle
                checked={state.supervision.classRecordings}
                onChange={() => dispatch({ type: 'TOGGLE_SUPERVISION', key: 'classRecordings' })}
                label="Class recordings"
                description="Keep recordings available for you to review for 30 days."
              />
            </div>
          </SectionCard>

          <div className="space-y-5">
            <SectionCard title="Report a concern" subtitle="We respond within 24 hours" icon={AlertTriangle}>
              <div className="space-y-3">
                <Select label="What happened?" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {['Unkind message', 'Inappropriate content', 'Teacher conduct', 'Bullying', 'Other concern'].map((c) => <option key={c}>{c}</option>)}
                </Select>
                <TextArea
                  label="Tell us more"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={4}
                  placeholder="Describe the concern. Include names, dates or screenshots if you can."
                />
                <Button className="w-full" variant="danger" onClick={submit} disabled={!detail.trim()}>
                  Submit report
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Recent reports" subtitle="Tracked by our safeguarding team" icon={ClipboardList}>
              {state.reports.length === 0 ? (
                <EmptyState emoji="🛡️" title="No reports yet" description="Anything you report will appear here with its status." />
              ) : (
                <div className="space-y-2">
                  {state.reports.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-foreground">{r.category}</p>
                        <Badge tone="warn">{r.status}</Badge>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">{r.child} · {r.at}</p>
                      <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{r.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        <SectionCard title="Safety features" subtitle="Built into every lesson" icon={ShieldCheck}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Verified teachers', detail: 'Identity and safeguarding checks' },
              { title: 'Moderated chat', detail: 'AI + human review of messages' },
              { title: 'Private profiles', detail: 'No public contact details' },
              { title: 'One-tap report', detail: 'Available in every conversation' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border/70 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-foreground"><CheckCircle2 size={13} className="text-emerald-500" /> {f.title}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{f.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </RoleLayout>
  )
}

export function ParentSupport() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const { configured, profile: account } = useAuth()
  const [child, setChild] = useState<ChildId>('chidi')
  const [topic, setTopic] = useState('Speech therapy')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const profile = childrenData[child]
  const isSpecial = child === 'chidi'
  const requests = (state.supportRequests ?? []).filter((r) => r.child === profile.name)

  const submitSupport = async () => {
    if (!message.trim() || sending) return
    const recipient = email.trim() || account?.email || ''
    if (configured && !looksLikeEmail(recipient)) {
      toast('Add an email address', { description: 'We send the confirmation and reply there.', tone: 'warn' })
      return
    }

    const reference = `NB-${Date.now().toString(36).toUpperCase().slice(-6)}`
    setSending(true)
    dispatch({
      type: 'ADD_SUPPORT_REQUEST',
      request: {
        id: uid('support'),
        child: profile.name,
        topic,
        message: message.trim(),
        email: recipient,
        at: 'Just now',
        status: 'Received',
      },
    })
    setMessage('')

    if (!configured) {
      setSending(false)
      toast('Support request saved', 'Email confirmations turn on as soon as Mailgun is connected.')
      return
    }

    const result = await sendConfirmationEmail('support', recipient, {
      parentName: account?.full_name ?? '',
      childName: profile.name,
      topic,
      message: message.trim(),
      reference,
    })
    setSending(false)
    toast(result.sent ? 'Support request sent' : 'Support request saved', {
      description: result.sent ? `Confirmation sent to ${recipient}.` : result.message,
      tone: result.ok ? 'success' : 'warn',
    })
  }

  return (
    <RoleLayout role="parent">
      <PageHeader
        title="Special support"
        subtitle={`${profile.name} · ASD and ADHD specialist learning plan`}
        badge={<Badge tone="purple">Special Needs Premium</Badge>}
        actions={<HeaderActions role="parent" />}
      />
      <div className="mx-auto max-w-[1250px] space-y-5 p-4 sm:p-6">
        <ChildSwitch child={child} onChange={setChild} />

        {!isSpecial ? (
          <Card className="rounded-3xl border-role bg-role-soft/60 p-6 text-center">
            <span className="text-4xl" aria-hidden>🦋</span>
            <p className="mt-2 text-lg font-extrabold text-role-ink">Special support is active for Chidi</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              Chidi is on the Special Needs Premium plan with speech therapy, emotional regulation and social skills support.
              Switch to Chidi to view goals, specialist notes and family guidance.
            </p>
            <Button className="mt-4" variant="role" onClick={() => setChild('chidi')}>
              Open Chidi’s support plan
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Active goals" value={specialSupport.goals.length} icon={Target} color="var(--role-accent)" soft="var(--role-soft)" sub="Reviewed monthly" />
              <StatCard label="Sessions this week" value={specialSupport.sessions.length} icon={CalendarCheck} color="#0ea5e9" soft="#e8f4fd" sub="Speech, regulation, play" />
              <StatCard label="Activity minutes" value={state.totalActivityMinutes + 65} icon={Timer} color="#10b981" soft="#ecfdf5" sub="This month" />
              <StatCard label="Communication growth" value="+8 pts" icon={TrendingUp} color="#ec4899" soft="#fdf2f8" sub="Since September" />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <SectionCard title="Chidi’s goals" subtitle="Personalised, strengths-based plan" icon={Target}>
                <div className="space-y-3.5">
                  {specialSupport.goals.map((g) => (
                    <div key={g.id} className="rounded-xl border border-border/70 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-foreground">{g.title}</p>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{g.detail}</p>
                        </div>
                        <span className="text-[11px] font-extrabold" style={{ color: g.color }}>{g.progress}%</span>
                      </div>
                      <ProgressBar value={g.progress} color={g.color} className="mt-2" label={`${g.title} progress`} />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="space-y-5">
                <SectionCard title="Specialist sessions" subtitle="Weekly support schedule" icon={CalendarCheck}>
                  <div className="space-y-2.5">
                    {specialSupport.sessions.map((s) => (
                      <div key={s.id} className="flex items-center gap-2.5 rounded-xl border border-border/70 p-2.5">
                        <span className="text-lg" aria-hidden>{s.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-foreground">{s.title}</p>
                          <p className="text-[10px] text-muted-foreground">{s.specialist} · {s.when}</p>
                        </div>
                        <Badge tone="role">{s.next.split(',')[0]}</Badge>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-3 w-full" size="sm" variant="role" onClick={() => toast('Session booked', 'Ms. Sarah will confirm the family session time.')}>
                    Book family session
                  </Button>
                </SectionCard>

                <SectionCard title="Family guidance" subtitle="Practical support at home" icon={HeartHandshake}>
                  <div className="space-y-2">
                    {specialSupport.guidance.map((g) => (
                      <div key={g.id} className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-role-soft text-role-ink" aria-hidden><FileText size={14} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-foreground">{g.title}</p>
                          <p className="text-[10px] text-muted-foreground">{g.type} · {g.size}</p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center py-2 text-[10px] font-bold text-role hover:underline"
                          onClick={() => {
                            downloadText(`${g.title}.txt`, `${g.title}\n${g.type} · ${g.size}\n\nGuidance prepared by the NeuroBloom specialist team.`)
                            toast('Download ready', `${g.title} saved.`)
                          }}
                        >
                          Get
                        </button>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>

            <SectionCard title="Regulation & communication" subtitle="Progress across four weeks" icon={TrendingUp}>
              <MultiLine
                data={specialSupport.behaviorTrend}
                series={[
                  { key: 'regulation', label: 'Regulation', color: '#a855f7' },
                  { key: 'communication', label: 'Communication', color: '#0ea5e9' },
                ]}
                yDomain={[30, 100]}
                height={220}
              />
            </SectionCard>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="rounded-3xl border-role bg-role-soft/60 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>👩🏾‍🏫</span>
                  <p className="text-xs font-bold text-role-ink">Ms. Sarah · Speech Therapist</p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-role-ink">
                  “Chidi is using feeling words more often and asking for breaks independently. Keep the visual schedule
                  visible at home — predictability helps him feel safe.”
                </p>
              </Card>
              <Card className="rounded-3xl border-sky-200 bg-sky-50/60 p-4">
                <p className="text-xs font-bold text-sky-900">What parents can do this week</p>
                <ul className="mt-2 space-y-1.5">
                  {['Keep the morning routine visual and predictable.', 'Praise the attempt, not only the result.', 'Use the calm corner before big transitions.'].map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-[11px] text-sky-800">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <SectionCard title="Request specialist support" subtitle="A specialist replies within one working day" icon={HeartHandshake}>
                <div className="space-y-3">
                  <Select label="What do you need help with?" value={topic} onChange={(event) => setTopic(event.target.value)}>
                    {['Speech therapy', 'Sensory support', 'Emotional regulation', 'Specialist session', 'Billing & plan', 'Something else'].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </Select>
                  <TextArea
                    label="Tell us what’s happening"
                    rows={4}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Share what has changed at home, at school or in sessions."
                  />
                  {configured ? (
                    <Input
                      label="Confirmation email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={account?.email ?? 'you@example.com'}
                      hint="We send a copy of this request and the specialist’s reply here."
                    />
                  ) : null}
                  <Button className="w-full" variant="role" disabled={!message.trim() || sending} onClick={() => void submitSupport()}>
                    {sending ? 'Sending…' : 'Send support request'}
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Recent requests" subtitle="Tracked by the support team" icon={ClipboardList}>
                {requests.length === 0 ? (
                  <EmptyState emoji="💬" title="No requests yet" description="Anything you ask for will appear here with its status." />
                ) : (
                  <div className="space-y-2">
                    {requests.slice(0, 4).map((request) => (
                      <div key={request.id} className="rounded-xl border border-border/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-bold text-foreground">{request.topic}</p>
                          <Badge tone="purple">{request.status}</Badge>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">{request.child} · {request.at}</p>
                        <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{request.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </RoleLayout>
  )
}
