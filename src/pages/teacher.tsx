import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  MessageCircle,
  Plus,
  Presentation,
  Star,
  Timer,
  TrendingUp,
  Users,
  Video,
  Wallet,
} from 'lucide-react'
import { HeaderActions, RoleBadge, RoleLayout } from '../components/layout'
import { Messenger, ComposeMessageModal } from '../components/chat'
import { CreateAssignmentModal, CreateClassModal, GradeModal } from '../components/assignment'
import { LiveRoomModal } from '../components/lesson'
import { Donut, GroupedBars } from '../components/charts'
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
  Tabs,
  Toggle,
  buttonStyles,
} from '../components/ui'
import { useToast } from '../components/toast'
import { useApp } from '../store/store'
import { useAuth } from '../lib/auth'
import { NewUserDashboard } from '../components/onboarding'
import {
  attendanceWeek,
  earningsBreakdown,
  earningsMonths,
  payoutRows,
  teacherStudents,
  type GradingItem,
  type TeacherClass,
} from '../data/content'
import { cn, dayMonth, downloadCsv, greeting, longDate, naira, nextMonthlyDay, uid } from '../lib/utils'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const thisMonthEarnings = earningsMonths[earningsMonths.length - 1]
const lastMonthEarnings = earningsMonths[earningsMonths.length - 2]
const thisMonthGross = (thisMonthEarnings?.value ?? 0) * 1000
const monthGrowth = lastMonthEarnings?.value
  ? Math.round(((thisMonthEarnings.value - lastMonthEarnings.value) / lastMonthEarnings.value) * 100)
  : 0
const latestPayout = payoutRows[0]
const availableBalance = Math.round(thisMonthGross * 0.85)

export function TeacherHome() {
  const { state, dispatch } = useApp()
  const { profile } = useAuth()
  const toast = useToast()
  const [gradeItem, setGradeItem] = useState<GradingItem | null>(null)
  const [live, setLive] = useState<TeacherClass | null>(null)
  const [createAssignment, setCreateAssignment] = useState(false)
  const [createClass, setCreateClass] = useState(false)

  if (profile?.role === 'teacher' && state.newAccount) {
    return <NewUserDashboard role="teacher" />
  }

  const liveClass = state.teacherClasses.find((c) => c.status === 'live')
  const students = state.teacherClasses.reduce((sum, c) => sum + c.students, 0)
  const requests = state.tutorRequests

  return (
    <RoleLayout role="teacher">
      <PageHeader
        title={`${greeting()}, Dr. Azu`}
        subtitle={`${longDate()} · Mathematics · ${state.teacherClasses.length} classes today`}
        badge={<RoleBadge role="teacher" />}
        actions={<HeaderActions role="teacher" />}
      />

      <div className="mx-auto max-w-[1450px] space-y-5 p-4 sm:p-6">
        {/* Hero */}
        <Card className="relative overflow-hidden border-0 bg-[image:var(--hero-gradient)] p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                <Wallet size={13} /> {latestPayout?.period ?? 'Latest'} payout processed
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-[28px]">
                {naira(thisMonthGross)} earned this month.
              </h2>
              <p className="mt-1.5 text-sm text-white/75">
                {state.gradingQueue.length} submissions are waiting for feedback. Your JSS2 class starts in 25 minutes.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setCreateAssignment(true)} className={buttonStyles('primary', 'md', '!bg-white !text-[#047857] hover:!bg-white/90')}>
                  <Plus size={15} /> Create assignment
                </button>
                <button type="button" onClick={() => setCreateClass(true)} className={buttonStyles('ghost', 'md', 'text-white hover:bg-white/15 hover:text-white')}>
                  Schedule a class <ArrowRight size={15} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Students</p>
                <p className="text-2xl font-extrabold">{students}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Rating</p>
                <p className="text-2xl font-extrabold">4.9★</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Sessions</p>
                <p className="text-2xl font-extrabold">142</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="This month" value={naira(thisMonthGross, true)} icon={Wallet} color="#10b981" soft="#ecfdf5" trend={{ value: `${monthGrowth}% vs last month` }} />
          <StatCard label="Active students" value={students} icon={Users} color="#6c3fc5" soft="#f0eefb" sub={`Across ${state.teacherClasses.length} classes`} />
          <StatCard label="Live now" value={liveClass ? '1 class' : '0'} icon={Video} color="#f97316" soft="#fff4e8" sub={liveClass?.name ?? 'Next at 12:00 PM'} />
          <StatCard label="To grade" value={state.gradingQueue.length} icon={ClipboardList} color="#f59e0b" soft="#fffbeb" sub="Feedback needed" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            {/* Classes */}
            <SectionCard
              title="My classes today"
              subtitle="Host or prepare for each session"
              icon={Presentation}
              action={<Badge tone="success">{state.teacherClasses.length} classes</Badge>}
            >
              <div className="space-y-2.5">
                {state.teacherClasses.map((c) => (
                  <div key={c.id} className="flex flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3 sm:w-56">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-extrabold" style={{ background: c.soft, color: c.color }} aria-hidden>
                        {c.subject.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.level} · {c.students} students</p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={12} /> {c.time}</span>
                      <span className="flex items-center gap-1"><Video size={12} /> {c.duration}</span>
                      <Badge tone={c.status === 'live' ? 'danger' : c.status === 'next' ? 'warn' : 'neutral'}>
                        {c.status === 'live' ? '● Live' : c.status === 'next' ? 'Next' : 'Upcoming'}
                      </Badge>
                    </div>
                    <Button size="sm" variant={c.status === 'live' ? 'role' : 'outline'} onClick={() => setLive(c)}>
                      {c.status === 'live' ? 'Host class' : 'Start room'}
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Grading */}
            <SectionCard
              title="Grading queue"
              subtitle="Give feedback while it is fresh"
              icon={ClipboardList}
              action={<Badge tone="warn">{state.gradingQueue.length} waiting</Badge>}
            >
              <div className="space-y-2.5">
                {state.gradingQueue.map((g) => (
                  <div key={g.id} className="flex flex-col gap-2.5 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{g.title}</p>
                      <p className="text-[10px] text-muted-foreground">{g.student} · {g.context}</p>
                      <p className="text-[10px] text-muted-foreground">Submitted {g.submitted} · {g.total} pts</p>
                    </div>
                    <Button size="sm" variant="role" onClick={() => setGradeItem(g)}>
                      Grade now
                    </Button>
                  </div>
                ))}
                {state.gradingQueue.length === 0 ? (
                  <EmptyState emoji="🎉" title="Inbox zero" description="Every submission has feedback. Your students will be proud." />
                ) : null}
              </div>
            </SectionCard>

            {/* Earnings */}
            <SectionCard title="Earnings trend" subtitle="Last six months · in thousands of naira" icon={BarChart3} action={<Link to="/teacher/earnings" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">Full report</Link>}>
              <GroupedBars data={earningsMonths} series={[{ key: 'value', label: 'Earnings (₦k)', color: '#10b981' }]} yDomain={[0, 160]} height={210} />
            </SectionCard>
          </div>

          <div className="space-y-5">
            {/* Requests */}
            <SectionCard title="Tutoring requests" subtitle="Respond within 24 hours" icon={GraduationCap} action={<Badge tone="role">{requests.length} new</Badge>}>
              <div className="space-y-2.5">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-foreground">{r.student}</p>
                      <span className="text-[10px] font-bold text-role-ink">{naira(r.rate)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{r.level} · {r.topic}</p>
                    {r.specialist ? <Badge tone="purple" className="mt-1.5">Specialist support</Badge> : null}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="role"
                        className="flex-1"
                        onClick={() => {
                          dispatch({ type: 'ACCEPT_REQUEST', id: r.id })
                          toast('Session accepted', `${r.student} is booked for tomorrow at 4:00 PM.`)
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          dispatch({ type: 'DECLINE_REQUEST', id: r.id })
                          toast('Request declined', 'The student has been notified.')
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
                {requests.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    No new requests. You’re all caught up.
                  </p>
                ) : null}
              </div>
            </SectionCard>

            {/* Students */}
            <SectionCard title="Students to watch" subtitle="Needs a little encouragement" icon={Users} action={<Link to="/teacher/students" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">All students</Link>}>
              <div className="space-y-2">
                {teacherStudents.filter((s) => s.trend < 3).slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5">
                    <span className="text-lg" aria-hidden>{s.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.level} · avg {s.average}%</p>
                    </div>
                    <Badge tone={s.trend < 0 ? 'danger' : 'warn'}>{s.trend > 0 ? '+' : ''}{s.trend}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Week attendance */}
            <SectionCard title="Attendance this week" subtitle="Present vs absent" icon={CalendarDays}>
              <GroupedBars
                data={attendanceWeek}
                series={[
                  { key: 'present', label: 'Present', color: '#10b981' },
                  { key: 'absent', label: 'Absent', color: '#fda4af' },
                ]}
                stacked
                height={170}
              />
            </SectionCard>

            <Card className="flex items-center gap-3 bg-emerald-50 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600" aria-hidden>
                <Award size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Top tutor this week</p>
                <p className="text-[11px] text-muted-foreground">Your lessons were rated 4.9★ by 12 students.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <GradeModal item={gradeItem} open={Boolean(gradeItem)} onClose={() => setGradeItem(null)} />
      <LiveRoomModal
        open={Boolean(live)}
        onClose={() => setLive(null)}
        title={live ? `${live.name} – Live Class` : 'Live class'}
        teacher="Dr. Kelechi Azu"
        teacherRole="Mathematics Teacher"
        participants={live?.students ?? 24}
        accent="#10b981"
        soft="#ecfdf5"
        host
      />
      <CreateAssignmentModal open={createAssignment} onClose={() => setCreateAssignment(false)} />
      <CreateClassModal open={createClass} onClose={() => setCreateClass(false)} />
    </RoleLayout>
  )
}

export function TeacherClasses() {
  const { state } = useApp()
  const toast = useToast()
  const [live, setLive] = useState<TeacherClass | null>(null)
  const [create, setCreate] = useState(false)

  const totalStudents = state.teacherClasses.reduce((sum, c) => sum + c.students, 0)

  return (
    <RoleLayout role="teacher">
      <PageHeader
        title="My classes"
        subtitle="Manage live lessons, rosters and schedules"
        badge={<Badge tone="role">{state.teacherClasses.length} active</Badge>}
        actions={<HeaderActions role="teacher" />}
      />
      <div className="mx-auto max-w-[1300px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Classes" value={state.teacherClasses.length} icon={Presentation} color="#10b981" soft="#ecfdf5" sub="This term" />
          <StatCard label="Students" value={totalStudents} icon={Users} color="#6c3fc5" soft="#f0eefb" sub="Active learners" />
          <StatCard label="Live now" value={state.teacherClasses.filter((c) => c.status === 'live').length} icon={Video} color="#f97316" soft="#fff4e8" sub={state.teacherClasses.find((c) => c.status === 'live')?.name ?? 'No live class'} />
          <StatCard label="Teaching hours" value="18.5h" icon={Timer} color="#0ea5e9" soft="#e8f4fd" sub="This week" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-foreground">All classes</h2>
          <Button variant="role" onClick={() => setCreate(true)}>
            <Plus size={15} /> Create class
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {state.teacherClasses.map((c) => (
            <Card key={c.id} hover className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/70 p-4" style={{ background: c.soft }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-sm font-extrabold" style={{ color: c.color }} aria-hidden>
                    {c.subject.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.level} · {c.students} students</p>
                  </div>
                </div>
                <Badge tone={c.status === 'live' ? 'danger' : c.status === 'next' ? 'warn' : 'neutral'}>
                  {c.status === 'live' ? '● Live' : c.status === 'next' ? 'Next up' : 'Upcoming'}
                </Badge>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={13} /> {c.time} · {c.duration}</span>
                  <span className="flex items-center gap-1"><Users size={13} /> {c.students} learners</span>
                </div>
                <ProgressBar value={c.status === 'live' ? 72 : 0} color={c.color} label={`${c.name} session progress`} />
                <div className="flex gap-2">
                  <Button size="sm" variant={c.status === 'live' ? 'role' : 'outline'} className="flex-1" onClick={() => setLive(c)}>
                    {c.status === 'live' ? 'Host class' : 'Open room'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast('Class materials', `Slides and notes for ${c.name} are ready to share.`)}>
                    Materials
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <SectionCard title="Weekly availability" subtitle="Green days are open for new sessions" icon={CalendarDays}>
          <div className="flex flex-wrap gap-2">
            {days.map((d) => {
              const open = state.availability[d]
              return (
                <div key={d} className={cn('flex-1 rounded-xl border px-3 py-2.5 text-center', open ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-muted/50')}>
                  <p className="text-[11px] font-bold text-foreground">{d}</p>
                  <p className={cn('text-[10px]', open ? 'font-semibold text-emerald-700' : 'text-muted-foreground')}>{open ? 'Open' : 'Closed'}</p>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      <LiveRoomModal
        open={Boolean(live)}
        onClose={() => setLive(null)}
        title={live ? `${live.name} – Live Class` : 'Live class'}
        teacher="Dr. Kelechi Azu"
        teacherRole="Mathematics Teacher"
        participants={live?.students ?? 24}
        accent="#10b981"
        soft="#ecfdf5"
        host
      />
      <CreateClassModal open={create} onClose={() => setCreate(false)} />
    </RoleLayout>
  )
}

export function TeacherStudents() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('All')
  const [contact, setContact] = useState<string | null>(null)

  const levels = ['All', ...Array.from(new Set(teacherStudents.map((s) => s.level)))]
  const visible = teacherStudents.filter(
    (s) => (level === 'All' || s.level === level) && s.name.toLowerCase().includes(query.toLowerCase()),
  )
  const average = Math.round(teacherStudents.reduce((sum, s) => sum + s.average, 0) / teacherStudents.length)
  const attendance = Math.round(teacherStudents.reduce((sum, s) => sum + s.attendance, 0) / teacherStudents.length)

  return (
    <RoleLayout role="teacher">
      <PageHeader
        title="Students"
        subtitle="Progress, attendance and support needs"
        badge={<Badge tone="role">{teacherStudents.length} learners</Badge>}
        actions={<HeaderActions role="teacher" />}
      />
      <div className="mx-auto max-w-[1350px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total students" value={teacherStudents.length} icon={Users} color="#10b981" soft="#ecfdf5" sub="Across all classes" />
          <StatCard label="Class average" value={`${average}%`} icon={TrendingUp} color="#6c3fc5" soft="#f0eefb" trend={{ value: '2.4%' }} />
          <StatCard label="Attendance" value={`${attendance}%`} icon={CalendarDays} color="#0ea5e9" soft="#e8f4fd" sub="This week" />
          <StatCard label="Support learners" value={teacherStudents.filter((s) => s.support).length} icon={BadgeCheck} color="#a855f7" soft="#f6eefe" sub="ASD support" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students" aria-label="Search students" className="w-52" />
            <Select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level" className="w-36">
              {levels.map((l) => <option key={l}>{l}</option>)}
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast('Roster exported', 'Your student list has been prepared for download.')}>
            <Download size={14} /> Export roster
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Student</th>
                  <th className="px-4 py-3 font-bold">Level</th>
                  <th className="px-4 py-3 font-bold">Average</th>
                  <th className="px-4 py-3 font-bold">Attendance</th>
                  <th className="px-4 py-3 font-bold">Trend</th>
                  <th className="px-4 py-3 font-bold">Support</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {visible.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden>{s.emoji}</span>
                        <span className="font-semibold text-foreground">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.level}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.average} color="#10b981" height="h-1.5" className="w-20" label={`${s.name} average`} />
                        <span className="font-semibold text-foreground">{s.average}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.attendance}%</td>
                    <td className="px-4 py-3">
                      <Badge tone={s.trend < 0 ? 'danger' : s.trend >= 4 ? 'success' : 'warn'}>
                        {s.trend > 0 ? '+' : ''}{s.trend}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {s.support ? <Badge tone="purple">{s.support}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setContact(s.name)}>
                        <MessageCircle size={13} /> Message
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">No students match your search.</p>
          ) : null}
        </Card>
      </div>

      <ComposeMessageModal
        open={Boolean(contact)}
        onClose={() => setContact(null)}
        to={contact ?? ''}
        subtitle="Student conversation"
        audience="teacher"
        author="Dr. Kelechi Azu"
        emoji="👩‍🏫"
      />
    </RoleLayout>
  )
}

export function TeacherAssignments() {
  const { state } = useApp()
  const toast = useToast()
  const [gradeItem, setGradeItem] = useState<GradingItem | null>(null)
  const [create, setCreate] = useState(false)
  const [tab, setTab] = useState<'queue' | 'all'>('queue')

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [['Student', 'Assignment', 'Points', 'Status']]
    state.gradingQueue.forEach((g) => rows.push([g.student, g.title, g.total, 'Awaiting grading']))
    state.assignments.filter((a) => a.status === 'graded').forEach((a) => rows.push(['Student', a.title, `${a.score ?? 0}/${a.points}`, 'Graded']))
    downloadCsv('neurobloom-grades.csv', rows)
    toast('Export ready', 'Your gradebook CSV has been downloaded.')
  }

  return (
    <RoleLayout role="teacher">
      <PageHeader
        title="Assignments"
        subtitle="Create work, grade submissions and export results"
        badge={<Badge tone="warn">{state.gradingQueue.length} to grade</Badge>}
        actions={<HeaderActions role="teacher" />}
      />
      <div className="mx-auto max-w-[1250px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="To grade" value={state.gradingQueue.length} icon={ClipboardList} color="#f59e0b" soft="#fffbeb" sub="Feedback needed" />
          <StatCard label="All assignments" value={state.assignments.length} icon={BookOpen} color="#6c3fc5" soft="#f0eefb" sub="Across classes" />
          <StatCard label="Submitted" value={state.assignments.filter((a) => a.status === 'submitted').length} icon={CheckCircle2} color="#0ea5e9" soft="#e8f4fd" sub="In review" />
          <StatCard label="Graded" value={state.assignments.filter((a) => a.status === 'graded').length} icon={Award} color="#10b981" soft="#ecfdf5" sub="This term" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { id: 'queue', label: 'Grading queue', count: state.gradingQueue.length },
              { id: 'all', label: 'All work', count: state.assignments.length },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download size={14} /> Export
            </Button>
            <Button variant="role" size="sm" onClick={() => setCreate(true)}>
              <Plus size={14} /> New assignment
            </Button>
          </div>
        </div>

        {tab === 'queue' ? (
          <div className="space-y-3">
            {state.gradingQueue.map((g) => (
              <Card key={g.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600" aria-hidden>
                  <ClipboardList size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{g.title}</p>
                  <p className="text-[11px] text-muted-foreground">{g.student} · {g.context}</p>
                  <p className="text-[10px] text-muted-foreground">Submitted {g.submitted} · {g.total} points total</p>
                </div>
                <Button size="sm" variant="role" onClick={() => setGradeItem(g)}>Grade now</Button>
              </Card>
            ))}
            {state.gradingQueue.length === 0 ? (
              <EmptyState emoji="✅" title="All caught up" description="There are no submissions waiting for feedback." />
            ) : null}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Assignment</th>
                    <th className="px-4 py-3 font-bold">Stage</th>
                    <th className="px-4 py-3 font-bold">Type</th>
                    <th className="px-4 py-3 font-bold">Due</th>
                    <th className="px-4 py-3 font-bold">Points</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 text-xs">
                  {state.assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground">{a.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.stage === 'junior' ? 'Junior' : 'Senior'}</td>
                      <td className="px-4 py-3"><Badge tone="neutral">{a.type}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{a.dueLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.points}</td>
                      <td className="px-4 py-3">
                        <Badge tone={a.status === 'graded' ? 'success' : a.status === 'submitted' ? 'primary' : 'warn'}>
                          {a.status === 'pending' ? 'Open' : a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => (a.status === 'pending' ? toast('Assignment open', 'Students can still submit this work.') : setGradeItem(state.gradingQueue.find((g) => g.assignmentId === a.id) ?? null))}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <GradeModal item={gradeItem} open={Boolean(gradeItem)} onClose={() => setGradeItem(null)} />
      <CreateAssignmentModal open={create} onClose={() => setCreate(false)} />
    </RoleLayout>
  )
}

export function TeacherTutoring() {
  const { state, dispatch } = useApp()
  const toast = useToast()

  return (
    <RoleLayout role="teacher">
      <PageHeader
        title="Private tutoring"
        subtitle="Accept requests and manage one-on-one sessions"
        badge={<Badge tone="role">{state.acceptedSessions.length} confirmed</Badge>}
        actions={<HeaderActions role="teacher" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="New requests" value={state.tutorRequests.length} icon={GraduationCap} color="#10b981" soft="#ecfdf5" sub="Respond within 24h" />
          <StatCard label="Confirmed" value={state.acceptedSessions.length} icon={CheckCircle2} color="#6c3fc5" soft="#f0eefb" sub="Upcoming sessions" />
          <StatCard label="Tutoring rate" value={naira(15000, true)} icon={Wallet} color="#f59e0b" soft="#fffbeb" sub="Per hour" />
          <StatCard label="This month" value="₦38k" icon={TrendingUp} color="#0ea5e9" soft="#e8f4fd" trend={{ value: '14%' }} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <SectionCard title="Requests" subtitle="Students waiting for your reply" icon={GraduationCap}>
            <div className="space-y-3">
              {state.tutorRequests.map((r) => (
                <Card key={r.id} className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">{r.student}</p>
                      <p className="text-[10px] text-muted-foreground">{r.level} · {r.topic}</p>
                    </div>
                    <span className="text-sm font-extrabold text-foreground">{naira(r.rate)}</span>
                  </div>
                  {r.specialist ? <Badge tone="purple" className="mt-2">Specialist support</Badge> : null}
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="role"
                      className="flex-1"
                      onClick={() => {
                        dispatch({ type: 'ACCEPT_REQUEST', id: r.id })
                        toast('Session accepted', `${r.student} is booked for tomorrow at 4:00 PM.`)
                      }}
                    >
                      Accept request
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        dispatch({ type: 'DECLINE_REQUEST', id: r.id })
                        toast('Request declined', 'The student can request another tutor.')
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              ))}
              {state.tutorRequests.length === 0 ? (
                <EmptyState emoji="🌿" title="No new requests" description="New tutoring requests will appear here." />
              ) : null}
            </div>
          </SectionCard>

          <div className="space-y-5">
            <SectionCard title="Confirmed sessions" subtitle="Your tutoring calendar" icon={CalendarDays}>
              <div className="space-y-2.5">
                {state.acceptedSessions.map((s) => (
                  <div key={s.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{s.student}</p>
                      <Badge tone="success">{s.status}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{s.level} · {s.topic}</p>
                    <p className="mt-1 text-[10px] font-semibold text-role-ink">{s.when} · {naira(s.rate)}</p>
                  </div>
                ))}
                {state.acceptedSessions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    Accept a request to fill your calendar.
                  </p>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard title="My availability" subtitle="Toggle the days you can teach" icon={CalendarDays}>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => dispatch({ type: 'TOGGLE_AVAILABILITY', day: d })}
                    aria-pressed={state.availability[d]}
                    className={cn(
                      'flex-1 rounded-lg border px-2 py-2 text-[11px] font-bold transition',
                      state.availability[d]
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-border bg-muted/50 text-muted-foreground',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                You are currently available {Object.values(state.availability).filter(Boolean).length} days a week.
              </p>
            </SectionCard>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}

export function TeacherEarnings() {
  const toast = useToast()
  const totalEarned = earningsMonths.reduce((sum, m) => sum + m.value * 1000, 0)
  const net = payoutRows.reduce((sum, p) => sum + p.net, 0)

  return (
    <RoleLayout role="teacher">
      <PageHeader
        title="Earnings"
        subtitle="Payouts, sessions and platform commission"
        badge={<Badge tone="success">Next payout {dayMonth(nextMonthlyDay(30))}</Badge>}
        actions={<HeaderActions role="teacher" />}
      />
      <div className="mx-auto max-w-[1300px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="This month" value={naira(thisMonthGross, true)} icon={Wallet} color="#10b981" soft="#ecfdf5" trend={{ value: `${monthGrowth}%` }} />
          <StatCard label="Last 6 months" value={naira(totalEarned, true)} icon={TrendingUp} color="#6c3fc5" soft="#f0eefb" sub="Gross earnings" />
          <StatCard label="Paid out" value={naira(net, true)} icon={CheckCircle2} color="#0ea5e9" soft="#e8f4fd" sub="After commission" />
          <StatCard label="Tutoring share" value="28%" icon={GraduationCap} color="#f59e0b" soft="#fffbeb" sub="Of total income" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <SectionCard title="Monthly earnings" subtitle="Gross income, in thousands of naira" icon={BarChart3}>
            <GroupedBars data={earningsMonths} series={[{ key: 'value', label: 'Earnings (₦k)', color: '#10b981' }]} yDomain={[0, 160]} height={240} />
          </SectionCard>

          <SectionCard title="Income breakdown" subtitle="Where your earnings come from" icon={BarChart3}>
            <Donut data={earningsBreakdown} centerValue="100%" centerLabel={thisMonthEarnings?.label ?? ''} height={200} />
            <div className="mt-2 space-y-1.5">
              {earningsBreakdown.map((b) => (
                <div key={b.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: b.color }} /> {b.name}
                  </span>
                  <span className="font-bold text-foreground">{b.value}%</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Payout history"
          subtitle="Platform commission is 15% of gross earnings"
          icon={Wallet}
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  downloadCsv('neurobloom-payouts.csv', [
                    ['Period', 'Gross', 'Commission', 'Net', 'Status'],
                    ...payoutRows.map((p) => [p.period, p.gross, p.commission, p.net, p.status]),
                  ])
                  toast('Statement ready', 'Your payout statement has been downloaded.')
                }}
              >
                <Download size={13} /> Statement
              </Button>
              <Button size="sm" variant="role" onClick={() => toast('Withdrawal requested', 'Your available balance will arrive in 2–3 business days.')}>
                Withdraw
              </Button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-bold">Period</th>
                  <th className="px-2 py-2 font-bold">Gross</th>
                  <th className="px-2 py-2 font-bold">Commission</th>
                  <th className="px-2 py-2 font-bold">Net paid</th>
                  <th className="px-2 py-2 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {payoutRows.map((p) => (
                  <tr key={p.id}>
                    <td className="px-2 py-3 font-semibold text-foreground">{p.period}</td>
                    <td className="px-2 py-3 text-muted-foreground">{naira(p.gross)}</td>
                    <td className="px-2 py-3 text-muted-foreground">{naira(p.commission)}</td>
                    <td className="px-2 py-3 font-bold text-foreground">{naira(p.net)}</td>
                    <td className="px-2 py-3 text-right"><Badge tone="success">{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <Card className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <Wallet size={16} /> Available balance: <span className="font-extrabold">{naira(availableBalance)}</span>
          </div>
          <Button size="sm" variant="role" onClick={() => toast('Withdrawal requested', 'Your available balance will arrive in 2–3 business days.')}>
            Withdraw earnings
          </Button>
        </Card>
      </div>
    </RoleLayout>
  )
}

export function TeacherContent() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Mathematics')
  const [resourceType, setResourceType] = useState<'PDF' | 'DOC' | 'VIDEO' | 'AUDIO'>('PDF')

  const visible = state.contentLibrary.filter(
    (r) => (type === 'All' || r.type === type) && r.title.toLowerCase().includes(query.toLowerCase()),
  )
  const views = state.contentLibrary.reduce((sum, r) => sum + (r.views ?? 0), 0)

  const add = () => {
    if (!title.trim()) return
    dispatch({
      type: 'ADD_RESOURCE',
      resource: {
        id: uid('cl'),
        title: title.trim(),
        type: resourceType,
        subject,
        size: resourceType === 'VIDEO' ? '18 min' : '2 MB',
        downloads: 0,
        category: 'Revision Notes',
        addedBy: 'Dr. Kelechi Azu',
        status: 'Published',
        views: 0,
      },
    })
    toast('Resource published', 'Your students can now find it in their library.')
    setTitle('')
    setOpen(false)
  }

  return (
    <RoleLayout role="teacher">
      <PageHeader
        title="Content library"
        subtitle="Upload lessons, notes and revision material"
        badge={<Badge tone="role">{state.contentLibrary.length} items</Badge>}
        actions={<HeaderActions role="teacher" />}
      />
      <div className="mx-auto max-w-[1250px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Resources" value={state.contentLibrary.length} icon={BookOpen} color="#10b981" soft="#ecfdf5" sub="In your library" />
          <StatCard label="Published" value={state.contentLibrary.filter((r) => (r.status ?? 'Published') === 'Published').length} icon={BadgeCheck} color="#6c3fc5" soft="#f0eefb" sub="Live for students" />
          <StatCard label="Total views" value={views.toLocaleString()} icon={Video} color="#0ea5e9" soft="#e8f4fd" trend={{ value: '12%' }} />
          <StatCard label="Drafts" value={state.contentLibrary.filter((r) => r.status === 'Draft').length} icon={FileText} color="#f59e0b" soft="#fffbeb" sub="Finish and publish" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search library" aria-label="Search library" className="w-52" />
            <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type" className="w-32">
              {['All', 'VIDEO', 'PDF', 'DOC'].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <Button variant="role" onClick={() => setOpen(true)}>
            <Plus size={15} /> Upload resource
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Title</th>
                  <th className="px-4 py-3 font-bold">Subject</th>
                  <th className="px-4 py-3 font-bold">Type</th>
                  <th className="px-4 py-3 font-bold">Size</th>
                  <th className="px-4 py-3 font-bold">Views</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {visible.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{r.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.subject}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{r.type}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{r.size}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(r.views ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge tone={(r.status ?? 'Published') === 'Published' ? 'success' : 'warn'}>{r.status ?? 'Published'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => toast('Link copied', 'Share this resource link with your class.')}>
                        Share
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 ? <p className="px-4 py-12 text-center text-sm text-muted-foreground">Nothing matches that search.</p> : null}
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Upload a resource"
        subtitle="Students see published items immediately"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="role" onClick={add} disabled={!title.trim()}>Publish resource</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quadratic equations revision" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {['Mathematics', 'Further Maths', 'Numeracy'].map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Select label="Type" value={resourceType} onChange={(e) => setResourceType(e.target.value as typeof resourceType)}>
              {['PDF', 'DOC', 'VIDEO', 'AUDIO'].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <FileText size={22} className="mx-auto text-muted-foreground" />
            <p className="mt-2 text-xs font-semibold text-foreground">Drop a file or record a lesson</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">PDF, DOC, MP4 or MP3 up to 200 MB</p>
          </div>
        </div>
      </Modal>
    </RoleLayout>
  )
}

export function TeacherMessages() {
  return (
    <RoleLayout role="teacher">
      <PageHeader
        title="Messages"
        subtitle="Students, parents and specialist colleagues"
        badge={<Badge tone="role">Verified contacts</Badge>}
        actions={<HeaderActions role="teacher" />}
      />
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <Card className="p-3 sm:p-4">
          <Messenger audience="teacher" author="Dr. Kelechi Azu" />
        </Card>
      </div>
    </RoleLayout>
  )
}

interface VerificationDoc {
  id: string
  name: string
  type: string
  status: 'Approved' | 'In review'
  added: string
}

const seedVerificationDocs: VerificationDoc[] = [
  { id: 'vd1', name: 'B.Sc. Mathematics transcript.pdf', type: 'Qualification', status: 'Approved', added: '12 Mar 2024' },
  { id: 'vd2', name: 'Government-issued ID.pdf', type: 'Identity', status: 'Approved', added: '12 Mar 2024' },
  { id: 'vd3', name: 'Safeguarding certificate 2026.pdf', type: 'Safeguarding', status: 'Approved', added: '4 Jan 2026' },
]

export function TeacherSettings() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [docs, setDocs] = useState<VerificationDoc[]>(seedVerificationDocs)
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('Qualification')

  const inReview = docs.filter((doc) => doc.status === 'In review').length

  function addDocument() {
    const name = docName.trim()
    if (!name) return
    setDocs((prev) => [
      { id: uid('vd'), name, type: docType, status: 'In review', added: 'Just now' },
      ...prev,
    ])
    setDocName('')
    toast('Document submitted', {
      description: `${name} is queued for review. The admin team usually responds within one working day.`,
      tone: 'success',
    })
  }

  return (
    <RoleLayout role="teacher">
      <PageHeader
        title="Settings"
        subtitle="Profile, availability and classroom preferences"
        badge={
          inReview ? (
            <Badge tone="warn">{inReview} document in review</Badge>
          ) : (
            <Badge tone="success">Verified teacher</Badge>
          )
        }
        actions={<HeaderActions role="teacher" />}
      />
      <div className="mx-auto max-w-[1100px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            <SectionCard title="Profile" subtitle="How students and parents see you" icon={BadgeCheck}>
              <div className="flex items-center gap-3">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-role text-xl font-extrabold text-white" aria-hidden>KA</span>
                <div>
                  <p className="text-sm font-extrabold text-foreground">Dr. Kelechi Azu</p>
                  <p className="text-[11px] text-muted-foreground">Mathematics · 12 years experience</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-600">
                    <Star size={12} className="fill-amber-400 text-amber-400" /> 4.9 · 142 reviews
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <Input label="Display name" defaultValue="Dr. Kelechi Azu" />
                <Input label="Email" defaultValue="kelechi.azu@neurobloom.ng" type="email" />
                <Input label="Subjects taught" defaultValue="Mathematics, Further Mathematics" />
              </div>
              <Button className="mt-3 w-full" variant="role" onClick={() => toast('Profile updated', 'Your details are saved.')}>
                Save profile
              </Button>
            </SectionCard>

            <SectionCard title="Availability" subtitle="Days open for classes and tutoring" icon={CalendarDays}>
              <div className="space-y-1">
                {days.map((d) => (
                  <div key={d} className="flex items-center justify-between border-b border-border/60 py-1 last:border-0">
                    <span className="text-xs font-semibold text-foreground">{d}</span>
                    <Toggle
                      checked={state.availability[d]}
                      onChange={() => dispatch({ type: 'TOGGLE_AVAILABILITY', day: d })}
                      label={`${d} availability`}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard title="Notifications" subtitle="Choose what reaches you" icon={MessageCircle}>
              <div className="divide-y divide-border/60">
                <Toggle checked={state.preferences.notifyRequests} onChange={() => dispatch({ type: 'SET_PREF', key: 'notifyRequests', value: !state.preferences.notifyRequests })} label="New tutoring requests" description="Get a message when a student requests a session." />
                <Toggle checked={state.preferences.notifyGrading} onChange={() => dispatch({ type: 'SET_PREF', key: 'notifyGrading', value: !state.preferences.notifyGrading })} label="Grading reminders" description="A gentle nudge when submissions are waiting." />
                <Toggle checked={state.preferences.notifyPayouts} onChange={() => dispatch({ type: 'SET_PREF', key: 'notifyPayouts', value: !state.preferences.notifyPayouts })} label="Payout updates" description="Know as soon as earnings are processed." />
              </div>
            </SectionCard>

            <SectionCard title="Accessibility" subtitle="Make the portal comfortable for you" icon={BookOpen}>
              <div className="divide-y divide-border/60">
                <Toggle
                  checked={state.preferences.reduceMotion}
                  onChange={() => dispatch({ type: 'SET_PREF', key: 'reduceMotion', value: !state.preferences.reduceMotion })}
                  label="Reduce motion"
                  description="Turn off decorative animations and transitions."
                />
                <Toggle
                  checked={state.preferences.highContrast}
                  onChange={() => dispatch({ type: 'SET_PREF', key: 'highContrast', value: !state.preferences.highContrast })}
                  label="High contrast"
                  description="Stronger borders and deeper text colour."
                />
              </div>
            </SectionCard>

            <SectionCard title="Payout method" subtitle="Where your earnings are sent" icon={Wallet}>
              <div className="flex items-center justify-between rounded-xl border border-border/70 p-3">
                <div>
                  <p className="text-xs font-bold text-foreground">GTBank · •••• 4821</p>
                  <p className="text-[10px] text-muted-foreground">Kelechi Azu · Savings</p>
                </div>
                <Badge tone="success">Default</Badge>
              </div>
              <Button className="mt-3 w-full" variant="outline" onClick={() => toast('Payout updated', 'A verification link has been sent to your email.')}>
                Update account
              </Button>
            </SectionCard>
          </div>
        </div>

        <Card
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 p-4',
            inReview ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50',
          )}
        >
          <p className={cn('flex items-center gap-2 text-xs font-semibold', inReview ? 'text-amber-900' : 'text-emerald-900')}>
            {inReview ? <Clock size={16} /> : <CheckCircle2 size={16} />}
            {inReview
              ? `${inReview} document is waiting for admin review.`
              : 'Your teacher verification is complete.'}
          </p>
          <Button size="sm" variant="outline" onClick={() => setVerifyOpen(true)}>
            View verification
          </Button>
        </Card>
      </div>

      <Modal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="Teacher verification"
        subtitle="Identity, qualifications and safeguarding checks"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setVerifyOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { label: 'Identity', value: 'Verified · Mar 2024' },
              { label: 'Qualifications', value: 'Verified · Mar 2024' },
              { label: 'Safeguarding', value: 'Verified · Jan 2026' },
              { label: 'Classroom observation', value: 'Passed · Feb 2026' },
            ].map((check) => (
              <div key={check.label} className="flex items-start gap-2 rounded-xl border border-border/70 p-3">
                <BadgeCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-foreground">{check.label}</p>
                  <p className="text-[10px] text-muted-foreground">{check.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-foreground">Documents</p>
            <div className="divide-y divide-border/70 rounded-xl border border-border/70">
              {docs.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText size={14} className="shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-foreground">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {doc.type} · added {doc.added}
                      </p>
                    </div>
                  </div>
                  <Badge tone={doc.status === 'Approved' ? 'success' : 'warn'}>{doc.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
            <p className="text-xs font-bold text-foreground">Add a document</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
              Upload a certificate, transcript or safeguarding renewal. The admin team reviews new documents within one
              working day.
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end">
              <Input
                label="Document name"
                value={docName}
                onChange={(event) => setDocName(event.target.value)}
                placeholder="e.g. Safeguarding renewal.pdf"
                className="h-9 text-xs"
              />
              <Select label="Type" value={docType} onChange={(event) => setDocType(event.target.value)} className="h-9 text-xs">
                {['Qualification', 'Identity', 'Safeguarding', 'Other'].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </Select>
              <Button size="sm" variant="role" onClick={addDocument} disabled={!docName.trim()}>
                <Plus size={12} /> Submit
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </RoleLayout>
  )
}
