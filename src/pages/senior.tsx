import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Play,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Video,
} from 'lucide-react'
import { HeaderActions, RoleBadge, RoleLayout } from '../components/layout'
import { Messenger } from '../components/chat'
import { AssignmentModal, QuizModal } from '../components/assignment'
import { LessonPlayerModal, LiveRoomModal } from '../components/lesson'
import { TutorBookingModal, TutorSummaryRow } from '../components/tutoring'
import { SubjectExplorerModal } from '../components/curriculum'
import type { SubjectCurriculum } from '../data/curriculum'
import { subjectBySubjectId } from '../data/curriculum'
import { StrengthRadar, TrendArea } from '../components/charts'
import {
  Badge,
  Button,
  Card,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
  Tabs,
  buttonStyles,
  Input,
  SearchField,
} from '../components/ui'
import { useToast } from '../components/toast'
import { useApp } from '../store/store'
import { useAuth } from '../lib/auth'
import { NewUserDashboard } from '../components/onboarding'
import {
  examQuestions,
  performanceTrend,
  seniorSubjects,
  seniorTutors,
  subjectStrengths,
  upcomingExams,
} from '../data/content'
import { cn, daysUntil, downloadText, greeting, longDate, nextWaecDate, naira } from '../lib/utils'

const seniorClasses = [
  { id: 'snc1', subject: 'Mathematics', teacher: 'Dr. Kelechi Azu', time: '9:00 AM', duration: '1 hr', emoji: '📐', color: '#6c3fc5', soft: '#f0eefb', live: true },
  { id: 'snc2', subject: 'English Language', teacher: 'Mrs. Okafor', time: '11:00 AM', duration: '1 hr', emoji: '📖', color: 'var(--role-accent)', soft: 'var(--role-soft)', live: false },
  { id: 'snc3', subject: 'Physics', teacher: 'Dr. Azu', time: '1:00 PM', duration: '1 hr', emoji: '⚛️', color: '#10b981', soft: '#ecfdf5', live: false },
  { id: 'snc4', subject: 'Chemistry', teacher: 'Mrs. Balogun', time: '2:30 PM', duration: '45 min', emoji: '🧪', color: '#f59e0b', soft: '#fffbeb', live: false },
]

const papers = [
  { id: 'maths-paper', subject: 'Mathematics', detail: '40 questions · 45 min', color: '#6c3fc5', soft: '#f0eefb', emoji: '📐' },
  { id: 'english-paper', subject: 'English', detail: '40 questions · 40 min', color: 'var(--role-accent)', soft: 'var(--role-soft)', emoji: '📖' },
  { id: 'physics-paper', subject: 'Physics', detail: '40 questions · 40 min', color: '#10b981', soft: '#ecfdf5', emoji: '⚛️' },
]

export function SeniorHome() {
  const { state } = useApp()
  const { profile } = useAuth()
  const toast = useToast()
  const [live, setLive] = useState<(typeof seniorClasses)[number] | null>(null)
  const [assignmentId, setAssignmentId] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)
  const [subject, setSubject] = useState<SubjectCurriculum | null>(null)

  if (profile?.role === 'senior' && state.newAccount) {
    return <NewUserDashboard role="senior" />
  }

  const waec = daysUntil(nextWaecDate())
  const assignments = state.assignments.filter((a) => a.stage === 'senior')
  const pending = assignments.filter((a) => a.status === 'pending')
  const nextBooking = state.bookings.find((b) => b.audience === 'senior')
  const seniorBookings = state.bookings.filter((b) => b.audience === 'senior')
  const average = performanceTrend[performanceTrend.length - 1].score

  return (
    <RoleLayout role="senior">
      <PageHeader
        title={`${greeting()}, Amaka`}
        subtitle={`${longDate()} · SSS3 Science · ${waec} days to WAEC`}
        badge={<RoleBadge role="senior" />}
        actions={<HeaderActions role="senior" />}
      />

      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
        <Card className="relative overflow-hidden border-0 bg-[image:var(--hero-gradient)] p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                <Target size={13} /> WAEC 2027 preparation
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-[28px]">
                Steady progress to your A1 average.
              </h2>
              <p className="mt-1.5 text-sm text-white/75">
                You’re {Math.round(100 - average)} points from your target. Physics is the subject with the fastest gains.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentId(pending[0]?.id ?? null)}
                  className={buttonStyles('primary', 'md', '!bg-white !text-role-ink hover:!bg-white/90')}
                >
                  <ClipboardList size={15} /> Start today’s set
                </button>
                <Link to="/senior/exams" className={buttonStyles('ghost', 'md', 'text-white hover:bg-white/15 hover:text-white')}>
                  Exam prep <ArrowRight size={15} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Term average</p>
                <p className="text-2xl font-extrabold">{average}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Predicted grade</p>
                <p className="text-2xl font-extrabold">A1</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">WAEC countdown</p>
                <p className="text-2xl font-extrabold">{waec}d</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Study streak</p>
                <p className="text-2xl font-extrabold">12d</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Term average" value={`${average}%`} icon={TrendingUp} color="var(--role-accent)" soft="var(--role-soft)" trend={{ value: '4.2% this term' }} />
          <StatCard label="Target" value="A1" icon={Target} color="#6c3fc5" soft="#f0eefb" sub="75%+ overall" />
          <StatCard label="Assignments due" value={pending.length} icon={ClipboardList} color="#f59e0b" soft="#fffbeb" sub="Senior track" />
          <StatCard label="Private sessions" value={seniorBookings.length} icon={GraduationCap} color="#10b981" soft="#ecfdf5" sub={seniorBookings.length ? `${seniorBookings.length} upcoming` : 'Book anytime'} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <SectionCard
              title="Performance trend"
              subtitle="Your average against the target line"
              icon={TrendingUp}
              action={<Badge tone="success">↑ 4.2% this term</Badge>}
            >
              <TrendArea
                data={performanceTrend}
                series={[
                  { key: 'score', label: 'Your average', color: 'var(--role-accent)' },
                  { key: 'target', label: 'Target', color: '#94a3b8', dashed: true },
                ]}
                yDomain={[50, 100]}
                height={230}
              />
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Best subject</p>
                  <p className="text-xs font-bold text-foreground">Mathematics · 88</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Most improved</p>
                  <p className="text-xs font-bold text-foreground">Physics · +9</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Focus area</p>
                  <p className="text-xs font-bold text-foreground">Chemistry · 72</p>
                </div>
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SectionCard
                title="Upcoming exams"
                subtitle="Mock and WAEC timetable"
                icon={CalendarDays}
                action={<Link to="/senior/exams" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">Plan</Link>}
              >
                <div className="space-y-2.5">
                  {upcomingExams.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-extrabold" style={{ background: e.soft, color: e.color }} aria-hidden>
                        {e.days}d
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-foreground">{e.subject}</p>
                        <p className="text-[10px] text-muted-foreground">{e.detail}</p>
                      </div>
                      <Badge tone={e.days < 18 ? 'warn' : 'neutral'}>{e.days < 18 ? 'Soon' : 'Scheduled'}</Badge>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Subject strengths" subtitle="Where you shine" icon={Target}>
                <StrengthRadar data={subjectStrengths} color="var(--role-accent)" height={190} />
              </SectionCard>
            </div>

            <SectionCard
              title="Assignments due"
              subtitle={`${pending.length} items need your attention`}
              icon={ClipboardList}
              action={<Link to="/senior/assignments" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">All work</Link>}
            >
              <div className="space-y-2.5">
                {pending.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold" style={{ background: `${a.subjectColor}18`, color: a.subjectColor }} aria-hidden>
                      {a.subject.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {a.subject} · {a.points} pts · {a.dueLabel}
                      </p>
                    </div>
                    <Button size="sm" variant="soft" onClick={() => setAssignmentId(a.id)}>
                      {a.type === 'Quiz' ? 'Start' : 'Open'}
                    </Button>
                  </div>
                ))}
                {pending.length === 0 ? (
                  <p className="rounded-xl bg-emerald-50 px-3 py-6 text-center text-xs font-semibold text-emerald-700">
                    All caught up. Use the free time for past questions. 🎯
                  </p>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Grades by subject"
              subtitle="Tap a subject for real-life topics and practice"
              icon={BookOpen}
              action={
                <Link to="/senior/subjects" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">
                  All subjects
                </Link>
              }
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {seniorSubjects.map((s) => {
                  const curriculum = subjectBySubjectId('senior', s.id)
                  const done = curriculum ? curriculum.topics.filter((t) => state.quizScores[t.id] !== undefined).length : 0
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => curriculum && setSubject(curriculum)}
                      className="rounded-xl border border-border/70 p-3 text-left transition hover:border-role/40 hover:bg-role-soft/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-foreground">{s.name}</p>
                        <Badge tone="sky">{s.grade}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <ProgressBar value={s.score} color={s.color} height="h-1.5" label={`${s.name} score`} />
                        <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{s.score}%</span>
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        {curriculum ? `${done}/${curriculum.topics.length} topics practised` : 'Topics coming soon'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard
              title="Private tutoring"
              subtitle="Premium plan · 1:1 sessions"
              icon={GraduationCap}
              action={<Badge tone="sky">Premium</Badge>}
            >
              {nextBooking ? (
                <div className="rounded-xl border border-role/30 bg-role-soft/60 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden>{nextBooking.tutorEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{nextBooking.tutorName}</p>
                      <p className="text-[10px] text-muted-foreground">{nextBooking.subject} · {nextBooking.when}</p>
                    </div>
                    <Badge tone="success">Confirmed</Badge>
                  </div>
                  <Button size="sm" className="mt-3 w-full" variant="role" onClick={() => toast('Session link ready', 'You’ll join from Messages 10 minutes before the session.')}>
                    Open session room
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No sessions booked yet.</p>
              )}
              <div className="mt-3 space-y-2">
                {seniorTutors.slice(0, 2).map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5">
                    <span className="text-lg" aria-hidden>{t.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.subjects[0]} · {naira(t.rate)}/hr</p>
                    </div>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> {t.rating}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="role" className="flex-1" onClick={() => setBooking(true)}>
                  Book a tutor
                </Button>
                <Link to="/senior/tutoring" className={buttonStyles('outline', 'sm')}>
                  Browse
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              title="Study resources"
              subtitle="Past questions and notes"
              icon={FileText}
              action={<Link to="/senior/resources" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">Library</Link>}
            >
              <div className="space-y-2">
                {['WAEC Past Questions – Maths', 'Physics Formulas Reference', 'English Model Essays'].map((title, i) => (
                  <div key={title} className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-role-soft text-role-ink" aria-hidden>
                      <FileText size={14} />
                    </span>
                    <p className="flex-1 truncate text-[11px] font-semibold text-foreground">{title}</p>
                    <span className="text-[10px] text-muted-foreground">{[ '12 MB', '2 MB', '5 MB' ][i]}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Today’s timetable" icon={Clock} subtitle="4 lessons scheduled">
              <div className="space-y-2">
                {seniorClasses.map((c) => (
                  <button type="button" key={c.id} onClick={() => setLive(c)} className="flex w-full items-center gap-2.5 rounded-lg border border-border/70 p-2.5 text-left transition hover:border-role/40">
                    <span className="text-base" aria-hidden>{c.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-foreground">{c.subject}</p>
                      <p className="text-[10px] text-muted-foreground">{c.time} · {c.duration}</p>
                    </div>
                    {c.live ? <Badge tone="danger">Live</Badge> : <ArrowRight size={13} className="text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <LiveRoomModal
        open={Boolean(live)}
        onClose={() => setLive(null)}
        title={live ? `${live.subject} – Live Class` : 'Live class'}
        teacher={live?.teacher ?? 'Dr. Kelechi Azu'}
        teacherRole="Subject Teacher"
        participants={18}
        accent="var(--role-accent)"
        soft="var(--role-soft)"
      />
      <AssignmentModal assignmentId={assignmentId} open={Boolean(assignmentId)} onClose={() => setAssignmentId(null)} />
      <TutorBookingModal open={booking} onClose={() => setBooking(false)} tutors={seniorTutors} audience="senior" />
      <SubjectExplorerModal subject={subject} open={Boolean(subject)} onClose={() => setSubject(null)} />
    </RoleLayout>
  )
}

export function SeniorClasses() {
  const { state } = useApp()
  const [tab, setTab] = useState<'live' | 'recorded'>('live')
  const [live, setLive] = useState<(typeof seniorClasses)[number] | null>(null)
  const [lesson, setLesson] = useState<{ title: string; subject: string; instructor: string; duration: string; progress?: number; color?: string; soft?: string } | null>(null)

  const videos = state.contentLibrary.filter((r) => r.type === 'VIDEO')

  return (
    <RoleLayout role="senior">
      <PageHeader
        title="Live classes"
        subtitle="Today’s SSS3 timetable and recorded revision"
        badge={<Badge tone="role">SSS3 Science</Badge>}
        actions={<HeaderActions role="senior" />}
      />
      <div className="mx-auto max-w-[1300px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Classes today" value={seniorClasses.length} icon={Video} color="var(--role-accent)" soft="var(--role-soft)" sub="1 starting soon" />
          <StatCard label="Attendance" value="96%" icon={CheckCircle2} color="#10b981" soft="#ecfdf5" trend={{ value: '2% this month' }} />
          <StatCard label="Revision videos" value={videos.length} icon={Play} color="#6c3fc5" soft="#f0eefb" sub="Watch anytime" />
          <StatCard label="Study hours" value="14.5h" icon={Clock} color="#f59e0b" soft="#fffbeb" sub="This week" />
        </div>

        <Tabs
          tabs={[
            { id: 'live', label: 'Live schedule', count: seniorClasses.length },
            { id: 'recorded', label: 'Recordings', count: videos.length },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'live' ? (
          <div className="space-y-3">
            {seniorClasses.map((c) => (
              <Card key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-64">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl text-xl" style={{ background: c.soft }} aria-hidden>
                    {c.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{c.subject}</p>
                    <p className="text-[11px] text-muted-foreground">{c.teacher}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={13} /> {c.time}</span>
                  <span className="flex items-center gap-1"><Video size={13} /> {c.duration}</span>
                  {c.live ? <Badge tone="danger">● Live now</Badge> : <Badge tone="neutral">Scheduled</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={c.live ? 'role' : 'outline'} onClick={() => setLive(c)}>
                    {c.live ? 'Join class' : 'View'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setLesson({ title: c.subject, subject: c.subject, instructor: c.teacher, duration: c.duration, progress: 35, color: c.color, soft: c.soft })}>
                    Notes
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {videos.map((v) => (
              <Card key={v.id} hover className="overflow-hidden">
                <div className="flex h-32 items-center justify-center bg-role-soft">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-role shadow-sm" aria-hidden>
                    <Play size={20} />
                  </span>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-bold text-foreground">{v.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{v.subject} · {v.size} · {v.addedBy}</p>
                  <Button size="sm" variant="soft" className="mt-3 w-full" onClick={() => setLesson({ title: v.title, subject: v.subject, instructor: v.addedBy, duration: v.size, progress: 0, color: 'var(--role-accent)', soft: 'var(--role-soft)' })}>
                    Watch lesson
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <LiveRoomModal
        open={Boolean(live)}
        onClose={() => setLive(null)}
        title={live ? `${live.subject} – Live Class` : 'Live class'}
        teacher={live?.teacher ?? 'Dr. Kelechi Azu'}
        teacherRole="Subject Teacher"
        participants={18}
        accent="var(--role-accent)"
        soft="var(--role-soft)"
      />
      <LessonPlayerModal open={Boolean(lesson)} onClose={() => setLesson(null)} lesson={lesson} />
    </RoleLayout>
  )
}

export function SeniorAssignments() {
  const { state } = useApp()
  const [tab, setTab] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [assignmentId, setAssignmentId] = useState<string | null>(null)

  const assignments = state.assignments.filter((a) => a.stage === 'senior')
  const counts = {
    all: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    graded: assignments.filter((a) => a.status === 'graded').length,
  }
  const visible = assignments.filter((a) => tab === 'all' || a.status === tab)

  return (
    <RoleLayout role="senior">
      <PageHeader
        title="Assignments"
        subtitle="WAEC-style problem sets and graded work"
        badge={<Badge tone="role">{counts.pending} due</Badge>}
        actions={<HeaderActions role="senior" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="To do" value={counts.pending} icon={ClipboardList} color="var(--role-accent)" soft="var(--role-soft)" sub="Senior track" />
          <StatCard label="Submitted" value={counts.submitted} icon={Clock} color="#6c3fc5" soft="#f0eefb" sub="Awaiting grading" />
          <StatCard label="Graded" value={counts.graded} icon={CheckCircle2} color="#10b981" soft="#ecfdf5" sub="Feedback ready" />
          <StatCard label="Average score" value="84%" icon={TrendingUp} color="#f59e0b" soft="#fffbeb" trend={{ value: '3.1%' }} />
        </div>

        <Tabs
          tabs={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'pending', label: 'To do', count: counts.pending },
            { id: 'submitted', label: 'Submitted', count: counts.submitted },
            { id: 'graded', label: 'Graded', count: counts.graded },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div className="space-y-3">
          {visible.map((a) => (
            <Card key={a.id} hover className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold" style={{ background: `${a.subjectColor}18`, color: a.subjectColor }} aria-hidden>
                  {a.subject.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{a.title}</p>
                    <Badge tone={a.status === 'graded' ? 'success' : a.status === 'submitted' ? 'primary' : 'warn'}>
                      {a.status === 'pending' ? 'To do' : a.status}
                    </Badge>
                    <Badge tone="neutral">{a.type}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{a.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={12} /> {a.dueLabel}</span>
                    <span className="flex items-center gap-1"><Star size={12} /> {a.points} points</span>
                    {a.status === 'graded' && a.score !== undefined ? (
                      <span className="font-bold text-emerald-600">Scored {a.score}/{a.points}</span>
                    ) : null}
                  </div>
                </div>
                <Button size="sm" variant={a.status === 'pending' ? 'role' : 'outline'} onClick={() => setAssignmentId(a.id)}>
                  {a.status === 'pending' ? (a.type === 'Quiz' ? 'Start quiz' : 'Submit work') : 'View'}
                </Button>
              </div>
              {a.status === 'graded' && a.feedback ? (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                  <span className="font-bold">Teacher feedback:</span> {a.feedback}
                </p>
              ) : null}
            </Card>
          ))}
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
              Nothing here yet.
            </p>
          ) : null}
        </div>
      </div>

      <AssignmentModal assignmentId={assignmentId} open={Boolean(assignmentId)} onClose={() => setAssignmentId(null)} />
    </RoleLayout>
  )
}

export function SeniorExams() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [paper, setPaper] = useState<(typeof papers)[number] | null>(null)
  const [plan, setPlan] = useState<string[]>([
    'Review 20 past questions daily',
    'Complete one full mock paper weekly',
    'Revise Physics formulas every morning',
  ])
  const [draft, setDraft] = useState('')

  const togglePlan = (item: string) => setPlan((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]))
  const addPlan = () => {
    const text = draft.trim()
    if (!text) {
      toast('Type a goal first', { description: 'Add a short study goal, then press Add.', tone: 'warn' })
      return
    }
    setPlan((p) => [...p, text])
    setDraft('')
  }

  return (
    <RoleLayout role="senior">
      <PageHeader
        title="Exam prep"
        subtitle={`WAEC countdown · ${daysUntil(nextWaecDate())} days`}
        badge={<Badge tone="role">Practice mode</Badge>}
        actions={<HeaderActions role="senior" />}
      />
      <div className="mx-auto max-w-[1250px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Days to WAEC" value={daysUntil(nextWaecDate())} icon={CalendarDays} color="var(--role-accent)" soft="var(--role-soft)" sub="Stay steady" />
          <StatCard label="Mock papers taken" value={Object.keys(state.quizScores).length} icon={FileText} color="#6c3fc5" soft="#f0eefb" sub="All attempts saved" />
          <StatCard label="Best score" value={state.quizScores['maths-paper'] ? `${state.quizScores['maths-paper']}%` : '—'} icon={Trophy} color="#f59e0b" soft="#fffbeb" sub="Maths paper" />
          <StatCard label="Study plan" value={`${plan.length} goals`} icon={Target} color="#10b981" soft="#ecfdf5" sub="This week" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {upcomingExams.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold" style={{ background: e.soft, color: e.color }} aria-hidden>
                  {e.days}d
                </span>
                <Badge tone={e.days < 18 ? 'warn' : 'neutral'}>{e.days < 18 ? 'Prepare now' : 'Upcoming'}</Badge>
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">{e.subject}</p>
              <p className="text-[11px] text-muted-foreground">{e.detail}</p>
              <ProgressBar value={Math.max(10, 100 - e.days * 3)} color={e.color} className="mt-3" label={`${e.subject} preparation`} />
              <p className="mt-1 text-[10px] text-muted-foreground">Preparation: {Math.max(10, 100 - e.days * 3)}%</p>
            </Card>
          ))}
        </div>

        <SectionCard title="Practice papers" subtitle="Auto-marked WAEC-style questions" icon={FileText} action={<Badge tone="role">Premium included</Badge>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {papers.map((p) => {
              const best = state.quizScores[p.id]
              return (
                <div key={p.id} className="rounded-xl border border-border/70 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: p.soft }} aria-hidden>
                    {p.emoji}
                  </span>
                  <p className="mt-2 text-sm font-bold text-foreground">{p.subject}</p>
                  <p className="text-[11px] text-muted-foreground">{p.detail}</p>
                  {best !== undefined ? (
                    <p className="mt-2 text-[11px] font-bold text-emerald-600">Best: {best}%</p>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted-foreground">Not attempted yet</p>
                  )}
                  <Button size="sm" variant="role" className="mt-3 w-full" onClick={() => setPaper(p)}>
                    Start practice
                  </Button>
                </div>
              )
            })}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <SectionCard title="My study plan" subtitle="Tick off each win" icon={CheckCircle2}>
            <div className="space-y-2">
              {plan.map((item) => (
                <button type="button" key={item} onClick={() => togglePlan(item)} className="flex w-full items-center gap-2.5 rounded-lg border border-border/70 p-2.5 text-left transition hover:bg-muted/60" aria-pressed={!plan.includes(item)}>
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-md border', plan.includes(item) ? 'border-role bg-role text-white' : 'border-border bg-card')}>
                    {plan.includes(item) ? <CheckCircle2 size={13} /> : null}
                  </span>
                  <span className="flex-1 text-xs text-foreground">{item}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a study goal" aria-label="Add a study goal" />
              <Button size="md" variant="role" onClick={addPlan}>Add</Button>
            </div>
          </SectionCard>

          <SectionCard title="Revision downloads" subtitle="Exam-focused materials" icon={Download}>
            <div className="space-y-2">
              {state.contentLibrary.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-role-soft text-role-ink" aria-hidden>
                    <FileText size={14} />
                  </span>
                  <p className="flex-1 truncate text-[11px] font-semibold text-foreground">{r.title}</p>
                  <button
                    type="button"
                    className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline"
                    onClick={() => {
                      downloadText(`${r.title}.txt`, `${r.title}\n${r.subject} · ${r.addedBy}\n\nThis is demo study material for the NeuroBloom prototype.`)
                      toast('Download ready', `${r.title} saved.`)
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

      <QuizModal
        open={Boolean(paper)}
        onClose={() => setPaper(null)}
        title={paper ? `${paper.subject} practice paper` : 'Practice paper'}
        subtitle="Auto-marked · best score saved"
        questions={paper ? examQuestions[paper.id] : []}
        totalPoints={100}
        timeLimitSec={45 * 60}
        accent="var(--role-accent)"
        onFinish={(score) => {
          if (paper) dispatch({ type: 'SAVE_QUIZ_SCORE', quizId: paper.id, score })
          toast('Practice saved', `You scored ${score}%. Your best score has been updated.`)
        }}
      />
    </RoleLayout>
  )
}

export function SeniorTutoring() {
  const { state } = useApp()
  const [booking, setBooking] = useState(false)
  const [tutorId, setTutorId] = useState<string | undefined>(undefined)
  const bookings = state.bookings.filter((b) => b.audience === 'senior')

  return (
    <RoleLayout role="senior">
      <PageHeader
        title="Private tutoring"
        subtitle="One-on-one sessions with verified specialist tutors"
        badge={<Badge tone="sky">Premium plan</Badge>}
        actions={<HeaderActions role="senior" />}
      />
      <div className="mx-auto max-w-[1250px] space-y-5 p-4 sm:p-6">
        <Card className="flex flex-col gap-3 border-0 bg-[image:var(--hero-gradient)] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-white/85"><Sparkles size={13} /> Premium tutoring include</p>
            <p className="mt-1 text-lg font-extrabold">Book any tutor. Cancel up to 4 hours before.</p>
            <p className="text-xs text-white/70">Sessions are recorded for revision and shared with your parent.</p>
          </div>
          <Button className="!bg-white !text-[#0369a1] hover:!bg-white/90" onClick={() => { setTutorId(undefined); setBooking(true) }}>
            <GraduationCap size={15} /> Book a session
          </Button>
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-foreground">Verified tutors</h2>
              <Badge tone="neutral">{seniorTutors.length} available</Badge>
            </div>
            {seniorTutors.map((t) => (
              <TutorSummaryRow key={t.id} tutor={t} onBook={() => { setTutorId(t.id); setBooking(true) }} />
            ))}
          </div>

          <div className="space-y-4">
            <SectionCard title="My sessions" subtitle={`${bookings.length} booked`} icon={CalendarDays}>
              {bookings.length ? (
                <div className="space-y-2.5">
                  {bookings.map((b) => (
                    <div key={b.id} className="rounded-xl border border-border/70 p-3">
                      <div className="flex items-center gap-2">
                        <span aria-hidden>{b.tutorEmoji}</span>
                        <p className="flex-1 truncate text-xs font-bold text-foreground">{b.tutorName}</p>
                        <Badge tone="success">{b.status}</Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{b.subject} · {b.when}</p>
                      <p className="text-[10px] text-muted-foreground">{naira(b.rate)} per session</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  No sessions booked yet. Pick a tutor to get started.
                </p>
              )}
            </SectionCard>

            <SectionCard title="How tutoring works" icon={GraduationCap}>
              <ol className="space-y-2.5">
                {['Browse verified tutors and subjects', 'Choose a time that fits your week', 'Join the video session from Messages', 'Receive notes and a personal study plan'].map((step, i) => (
                  <li key={step} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-role-soft text-[10px] font-bold text-role-ink">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </SectionCard>
          </div>
        </div>
      </div>

      <TutorBookingModal open={booking} onClose={() => setBooking(false)} tutors={seniorTutors} initialTutorId={tutorId} audience="senior" />
    </RoleLayout>
  )
}

export function SeniorResources() {
  const { state } = useApp()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [saved, setSaved] = useState<string[]>([])

  const categories = ['All', ...Array.from(new Set(state.contentLibrary.map((r) => r.category)))]
  const visible = state.contentLibrary.filter(
    (r) =>
      (category === 'All' || r.category === category) &&
      (r.title.toLowerCase().includes(query.toLowerCase()) || r.subject.toLowerCase().includes(query.toLowerCase())),
  )

  return (
    <RoleLayout role="senior">
      <PageHeader
        title="Study resources"
        subtitle="Past questions, revision notes and video lessons"
        badge={<Badge tone="role">Premium library</Badge>}
        actions={<HeaderActions role="senior" />}
      />
      <div className="mx-auto max-w-[1250px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Resources" value={state.contentLibrary.length} icon={FileText} color="var(--role-accent)" soft="var(--role-soft)" sub="Curated for SSS3" />
          <StatCard label="Past questions" value="1,240" icon={BookOpen} color="#6c3fc5" soft="#f0eefb" sub="Downloads" />
          <StatCard label="Saved items" value={saved.length} icon={Star} color="#f59e0b" soft="#fffbeb" sub="Your bookmarks" />
          <StatCard label="Video lessons" value={state.contentLibrary.filter((r) => r.type === 'VIDEO').length} icon={Play} color="#10b981" soft="#ecfdf5" sub="Watch anytime" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={categories.map((c) => ({ id: c, label: c }))}
            value={category}
            onChange={setCategory}
          />
          <SearchField value={query} onChange={setQuery} placeholder="Search resources" className="w-full sm:w-60" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <Card key={r.id} hover className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-role-soft text-role-ink" aria-hidden>
                  <FileText size={17} />
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge tone="neutral">{r.type}</Badge>
                  <button
                    type="button"
                    onClick={() => setSaved((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))}
                    aria-label={saved.includes(r.id) ? `Remove ${r.title} from saved` : `Save ${r.title}`}
                    className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border transition', saved.includes(r.id) ? 'bg-role-soft text-role-ink' : 'text-muted-foreground hover:bg-muted')}
                  >
                    <Star size={15} className={saved.includes(r.id) ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 flex-1 text-sm font-bold text-foreground">{r.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{r.subject} · {r.size} · {r.downloads.toLocaleString()} downloads</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="role"
                  className="flex-1"
                  onClick={() => {
                    downloadText(`${r.title}.txt`, `${r.title}\n${r.subject} · ${r.category}\nPrepared by ${r.addedBy}\n\nDemo study resource for NeuroBloom LearningSphere.`)
                    toast('Download ready', `${r.title} saved to your device.`)
                  }}
                >
                  <Download size={13} /> Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast('Saved to study list', 'Find it under your bookmarks.')}>
                  Add to plan
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            No resources match your search.
          </p>
        ) : null}
      </div>
    </RoleLayout>
  )
}

export function SeniorMessages() {
  return (
    <RoleLayout role="senior">
      <PageHeader
        title="Messages"
        subtitle="Talk to your teachers, tutors and study group"
        badge={<Badge tone="role">Verified contacts</Badge>}
        actions={<HeaderActions role="senior" />}
      />
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <Card className="p-3 sm:p-4">
          <Messenger audience="senior" author="Amaka Achebe" />
        </Card>
      </div>
    </RoleLayout>
  )
}
