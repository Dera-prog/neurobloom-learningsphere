import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  Gift,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  Target,
  Trophy,
  Video,
  Zap,
} from 'lucide-react'
import { RoleLayout, HeaderActions, RoleBadge } from '../components/layout'
import { Messenger } from '../components/chat'
import { AssignmentModal } from '../components/assignment'
import { LessonPlayerModal, LiveRoomModal } from '../components/lesson'
import { SubjectExplorerModal } from '../components/curriculum'
import type { SubjectCurriculum } from '../data/curriculum'
import { subjectBySubjectId } from '../data/curriculum'
import {
  Badge,
  Button,
  Card,
  PageHeader,
  ProgressBar,
  Ring,
  SectionCard,
  StatCard,
  Tabs,
  buttonStyles,
  SearchField,
} from '../components/ui'
import { useApp } from '../store/store'
import { useAuth } from '../lib/auth'
import { NewUserDashboard } from '../components/onboarding'
import {
  juniorBadges,
  juniorClasses,
  juniorLeaderboard,
  juniorLessons,
  juniorSubjects,
} from '../data/content'
import { cn, longDate } from '../lib/utils'

type Lesson = (typeof juniorLessons)[number]

export function JuniorHome() {
  const { state } = useApp()
  const { profile } = useAuth()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [live, setLive] = useState<(typeof juniorClasses)[number] | null>(null)
  const [assignmentId, setAssignmentId] = useState<string | null>(null)
  const [subject, setSubject] = useState<SubjectCurriculum | null>(null)

  if (profile?.role === 'junior' && state.newAccount) {
    return <NewUserDashboard role="junior" />
  }

  const assignments = state.assignments.filter((a) => a.stage === 'junior')
  const pending = assignments.filter((a) => a.status === 'pending')
  const pendingLabel =
    Object.entries(
      pending.reduce<Record<string, number>>((acc, a) => {
        acc[a.type] = (acc[a.type] ?? 0) + 1
        return acc
      }, {}),
    )
      .map(([type, count]) => {
        const lower = type.toLowerCase()
        if (count === 1) return `1 ${lower}`
        return `${count} ${lower === 'quiz' ? 'quizzes' : `${lower}s`}`
      })
      .join(' · ') || 'All caught up'
  const nextClass = juniorClasses[0]
  const goal = Math.min(100, Math.round((state.points / 1500) * 100))

  return (
    <RoleLayout role="junior">
      <PageHeader
        title={
          <span className="flex flex-col">
            <span>Welcome back</span>
            <span className="mt-0.5 text-sm font-bold text-[color:var(--shell-fg)]">
              Aderinola Segun for Junior Student
            </span>
          </span>
        }
        subtitle={`${longDate()} · ${assignments.length} tasks this week`}
        badge={<RoleBadge role="junior" />}
        actions={<HeaderActions role="junior" />}
      />

      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
        {/* Hero */}
        <Card className="relative overflow-hidden border-0 bg-primary p-5 text-white sm:p-6">
          <div
            className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-orange-400/25 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 right-24 h-44 w-44 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                <Flame size={13} className="text-orange-300" /> 7 day learning streak
              </span>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-[28px]">
                You’re blooming, Aderinola!
              </h2>
              <p className="mt-1.5 text-sm text-white/75">
                Finish today’s algebra quiz to reach <span className="font-bold text-orange-200">1,200 points</span> and
                unlock the Quiz Whiz badge.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLesson(juniorLessons[0])}
                  className={buttonStyles('primary', 'md', '!bg-white !text-primary hover:!bg-white/90')}
                >
                  <Play size={15} /> Continue learning
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentId(pending[0]?.id ?? null)}
                  className={buttonStyles('ghost', 'md', 'text-white hover:bg-white/15 hover:text-white')}
                >
                  View assignments <ArrowRight size={15} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <Ring value={goal} size={104} stroke={9} color="#fdba74" track="rgba(255,255,255,0.18)">
                <span className="text-xl font-extrabold">{state.points.toLocaleString()}</span>
                <span className="text-[10px] font-semibold text-white/70">points</span>
              </Ring>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-white">Weekly goal</p>
                <p className="text-white/70">{goal}% of 1,500 pts</p>
                <Badge className="!bg-white/15 !text-white">
                  <Star size={11} className="fill-amber-300 text-amber-300" /> Level 6
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Total points" value={state.points.toLocaleString()} icon={Trophy} color="var(--jr-stat-a)" soft="var(--jr-stat-a-soft)" trend={{ value: '120 this week' }} />
          <StatCard label="Day streak" value="7 days" icon={Flame} color="#ef4444" soft="#fef2f2" sub="Best: 12 days" />
          <StatCard label="Assignments due" value={pending.length} icon={ClipboardList} color="var(--jr-stat-b)" soft="var(--jr-stat-b-soft)" sub={pendingLabel} />
          <StatCard label="Next class" value={nextClass.time} icon={Video} color="#0ea5e9" soft="#e8f4fd" sub={`${nextClass.subject} · ${nextClass.duration}`} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            {/* Classes */}
            <SectionCard
              title="Today’s classes"
              subtitle="Join live or catch up later"
              icon={Video}
              action={
                <Link to="/junior/classes" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">
                  All classes
                </Link>
              }
            >
              <div className="space-y-2.5">
                {juniorClasses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{ background: c.soft }}
                      aria-hidden
                    >
                      {c.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{c.subject}</p>
                        {c.live ? <Badge tone="danger">● Live now</Badge> : null}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {c.teacher} · {c.time} · {c.duration}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={c.live ? 'role' : 'outline'}
                      onClick={() => setLive(c)}
                      aria-label={`${c.live ? 'Join' : 'Open'} ${c.subject} class`}
                    >
                      {c.live ? 'Join' : 'Details'}
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Continue learning */}
            <SectionCard
              title="Continue learning"
              subtitle="Pick up where you stopped"
              icon={BookOpen}
              action={
                <Link to="/junior/classes" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">
                  Library
                </Link>
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {juniorLessons.slice(0, 4).map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => setLesson(l)}
                    className="group flex gap-3 rounded-xl border border-border/70 p-3 text-left transition hover:border-role/40 hover:bg-role-soft/40"
                  >
                    <span
                      className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ background: l.soft }}
                      aria-hidden
                    >
                      <Play size={18} style={{ color: l.color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-bold leading-snug text-foreground">{l.title}</p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">
                        {l.subject} · {l.duration}
                      </p>
                      <ProgressBar value={l.progress} color={l.color} className="mt-2" height="h-1" />
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Assignments */}
            <SectionCard
              title="Assignments & quizzes"
              subtitle={`${pending.length} waiting for you`}
              icon={ClipboardList}
              action={
                <Link to="/junior/assignments" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">
                  See all
                </Link>
              }
            >
              <div className="space-y-2.5">
                {pending.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold"
                      style={{ background: `${a.subjectColor}18`, color: a.subjectColor }}
                      aria-hidden
                    >
                      {a.subject.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {a.subject} · {a.points} pts · {a.dueLabel}
                      </p>
                    </div>
                    <Button size="sm" variant="soft" onClick={() => setAssignmentId(a.id)}>
                      {a.type === 'Quiz' ? 'Start quiz' : 'Open'}
                    </Button>
                  </div>
                ))}
                {pending.length === 0 ? (
                  <p className="rounded-xl bg-emerald-50 px-3 py-6 text-center text-xs font-semibold text-emerald-700">
                    All done! Every assignment is submitted. 🎉
                  </p>
                ) : null}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5">
            {/* Badges */}
            <SectionCard title="My badges" subtitle="3 of 6 unlocked" icon={Gift}>
              <div className="grid grid-cols-3 gap-2">
                {juniorBadges.map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center',
                      b.earned ? 'border-role/25 bg-role-soft/60' : 'border-dashed border-border opacity-55',
                    )}
                  >
                    <span className="text-xl" aria-hidden>
                      {b.emoji}
                    </span>
                    <span className="text-[10px] font-semibold leading-tight text-foreground">{b.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Leaderboard */}
            <SectionCard
              title="Class leaderboard"
              subtitle="JSS2 · this week"
              icon={Trophy}
              action={
                <Link to="/junior/leaderboard" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">
                  Full board
                </Link>
              }
            >
              <div className="space-y-1">
                {juniorLeaderboard.week.slice(0, 5).map((row) => (
                  <div
                    key={row.name}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2 py-1.5',
                      row.you && 'bg-role-soft',
                    )}
                  >
                    <span className="w-4 text-center text-[11px] font-bold text-muted-foreground">{row.rank}</span>
                    <span className="text-base" aria-hidden>
                      {row.emoji}
                    </span>
                    <span className={cn('flex-1 truncate text-xs', row.you ? 'font-bold text-role-ink' : 'text-foreground')}>
                      {row.name} {row.you ? '· You' : ''}
                    </span>
                    <span className="text-[11px] font-bold text-foreground">{(row.you ? state.points : row.points).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Subjects */}
            <SectionCard
              title="My subjects"
              subtitle="Real-life topics and practice questions"
              icon={Target}
              action={
                <Link to="/junior/subjects" className="inline-flex items-center py-2 text-[11px] font-bold text-role hover:underline">
                  All subjects
                </Link>
              }
            >
              <div className="space-y-2">
                {juniorSubjects.map((s) => {
                  const curriculum = subjectBySubjectId('junior', s.id)
                  const done = curriculum ? curriculum.topics.filter((t) => state.quizScores[t.id] !== undefined).length : 0
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => curriculum && setSubject(curriculum)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border/70 p-2.5 text-left transition hover:border-role/40 hover:bg-role-soft/40"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                        style={{ background: s.soft }}
                        aria-hidden
                      >
                        {s.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                          <span className="truncate font-semibold text-foreground">{s.name}</span>
                          <span className="shrink-0 font-bold" style={{ color: s.color }}>
                            {s.progress}%
                          </span>
                        </span>
                        <ProgressBar value={s.progress} color={s.color} height="h-1.5" label={`${s.name} progress`} />
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {curriculum ? `${done}/${curriculum.topics.length} topics practised` : 'Topics coming soon'}
                        </span>
                      </span>
                      <ArrowRight size={13} className="shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            <Card className="flex items-center gap-3 bg-[#fffbf5] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600" aria-hidden>
                <Zap size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Weekly challenge</p>
                <p className="text-[11px] text-muted-foreground">Score 80%+ in 2 quizzes to earn 50 bonus points.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <LessonPlayerModal open={Boolean(lesson)} onClose={() => setLesson(null)} lesson={lesson} />
      <LiveRoomModal
        open={Boolean(live)}
        onClose={() => setLive(null)}
        title={live ? `${live.subject} – Live Class` : 'Live class'}
        teacher={live?.teacher ?? 'Mr. Adeyemi'}
        teacherRole="Subject Teacher"
        participants={22}
        accent="var(--jr-stat-a)"
        soft="var(--jr-stat-a-soft)"
      />
      <AssignmentModal assignmentId={assignmentId} open={Boolean(assignmentId)} onClose={() => setAssignmentId(null)} />
      <SubjectExplorerModal subject={subject} open={Boolean(subject)} onClose={() => setSubject(null)} />
    </RoleLayout>
  )
}

export function JuniorClasses() {
  const { state } = useApp()
  const [tab, setTab] = useState<'live' | 'recorded'>('live')
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('All')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [live, setLive] = useState<(typeof juniorClasses)[number] | null>(null)

  const subjects = ['All', ...juniorSubjects.map((s) => s.name)]
  const classes = juniorClasses.filter(
    (c) => (subject === 'All' || c.subject === subject) && c.subject.toLowerCase().includes(query.toLowerCase()),
  )
  const lessons = juniorLessons.filter(
    (l) => (subject === 'All' || l.subject === subject) && l.title.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <RoleLayout role="junior">
      <PageHeader
        title="My classes"
        subtitle="Live lessons, recordings and subject materials"
        badge={<Badge tone="role">JSS2</Badge>}
        actions={<HeaderActions role="junior" />}
      />
      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Live classes today" value={juniorClasses.length} icon={Video} color="var(--jr-stat-a)" soft="var(--jr-stat-a-soft)" sub="Starts 10:00 AM" />
          <StatCard label="Recorded lessons" value={juniorLessons.length} icon={Play} color="var(--jr-stat-b)" soft="var(--jr-stat-b-soft)" sub="Watch anytime" />
          <StatCard label="Lessons completed" value="4" icon={CheckCircle2} color="#10b981" soft="#ecfdf5" sub="This month" />
          <StatCard label="Points from lessons" value={state.points > 0 ? '+90' : '+0'} icon={Star} color="#f59e0b" soft="#fffbeb" sub="Keep earning" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { id: 'live', label: 'Live schedule', count: juniorClasses.length },
              { id: 'recorded', label: 'Recorded', count: juniorLessons.length },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <SearchField value={query} onChange={setQuery} placeholder="Search lessons" className="w-full sm:w-52" />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Filter by subject"
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/10"
            >
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {tab === 'live' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((c) => (
              <Card key={c.id} hover className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-border/70 p-4" style={{ background: c.soft }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 text-xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-foreground">{c.subject}</p>
                    <p className="text-[11px] text-muted-foreground">{c.teacher}</p>
                  </div>
                  {c.live ? <Badge tone="danger">● Live</Badge> : <Badge tone="neutral">Soon</Badge>}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {c.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Video size={13} /> {c.duration}
                    </span>
                  </div>
                  <Button className="w-full" variant={c.live ? 'role' : 'outline'} onClick={() => setLive(c)}>
                    {c.live ? 'Join live class' : 'View class details'}
                  </Button>
                </div>
              </Card>
            ))}
            {classes.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No classes match that search.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lessons.map((l) => (
              <Card key={l.id} hover className="overflow-hidden">
                <div className="relative flex h-32 items-center justify-center" style={{ background: l.soft }}>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-white shadow-sm"
                    style={{ color: l.color }}
                    aria-hidden
                  >
                    <Play size={20} />
                  </span>
                  {l.live ? <Badge tone="danger" className="absolute left-3 top-3">● Live</Badge> : null}
                  <Badge tone="neutral" className="absolute right-3 top-3 bg-white/80">
                    {l.type}
                  </Badge>
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 text-sm font-bold text-foreground">{l.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {l.subject} · {l.instructor} · {l.duration}
                  </p>
                  <ProgressBar value={l.progress} color={l.color} className="mt-3" label={`${l.title} progress`} />
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{l.progress}% complete</span>
                    <button type="button" onClick={() => setLesson(l)} className="font-bold text-role hover:underline">
                      {l.progress > 0 ? 'Resume' : 'Start'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {lessons.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No recorded lessons match that search.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <LessonPlayerModal open={Boolean(lesson)} onClose={() => setLesson(null)} lesson={lesson} />
      <LiveRoomModal
        open={Boolean(live)}
        onClose={() => setLive(null)}
        title={live ? `${live.subject} – Live Class` : 'Live class'}
        teacher={live?.teacher ?? 'Mr. Adeyemi'}
        teacherRole="Subject Teacher"
        participants={22}
        accent="var(--jr-stat-a)"
        soft="var(--jr-stat-a-soft)"
      />
    </RoleLayout>
  )
}

export function JuniorAssignments() {
  const { state } = useApp()
  const [tab, setTab] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [assignmentId, setAssignmentId] = useState<string | null>(null)

  const assignments = state.assignments.filter((a) => a.stage === 'junior')
  const counts = {
    all: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    graded: assignments.filter((a) => a.status === 'graded').length,
  }
  const visible = assignments.filter((a) => tab === 'all' || a.status === tab)
  const earned = assignments.reduce((sum, a) => sum + (a.score ?? 0), 0)

  return (
    <RoleLayout role="junior">
      <PageHeader
        title="Assignments"
        subtitle="Quizzes, essays and projects — one step at a time"
        badge={<Badge tone="role">{counts.pending} pending</Badge>}
        actions={<HeaderActions role="junior" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="To do" value={counts.pending} icon={ClipboardList} color="var(--jr-stat-a)" soft="var(--jr-stat-a-soft)" sub="Due this week" />
          <StatCard label="Submitted" value={counts.submitted} icon={Clock} color="var(--jr-stat-b)" soft="var(--jr-stat-b-soft)" sub="Awaiting feedback" />
          <StatCard label="Graded" value={counts.graded} icon={CheckCircle2} color="#10b981" soft="#ecfdf5" sub="Feedback ready" />
          <StatCard label="Points earned" value={earned} icon={Trophy} color="#f59e0b" soft="#fffbeb" sub="From graded work" />
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
          {visible.map((a) => {
            const tone = a.status === 'graded' ? 'success' : a.status === 'submitted' ? 'primary' : 'warn'
            return (
              <Card key={a.id} hover className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                    style={{ background: `${a.subjectColor}18`, color: a.subjectColor }}
                    aria-hidden
                  >
                    {a.subject.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{a.title}</p>
                      <Badge tone={tone}>{a.status === 'pending' ? 'To do' : a.status}</Badge>
                      <Badge tone="neutral">{a.type}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{a.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {a.dueLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star size={12} /> {a.points} points
                      </span>
                      {a.status === 'graded' && a.score !== undefined ? (
                        <span className="font-bold text-emerald-600">
                          Scored {a.score}/{a.points}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant={a.status === 'pending' ? 'role' : 'outline'}
                    size="sm"
                    onClick={() => setAssignmentId(a.id)}
                  >
                    {a.status === 'pending' ? (a.type === 'Quiz' ? 'Start quiz' : 'Submit work') : 'View'}
                  </Button>
                </div>
                {a.status === 'graded' && a.feedback ? (
                  <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                    <span className="font-bold">Teacher feedback:</span> {a.feedback}
                  </p>
                ) : null}
              </Card>
            )
          })}
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
              Nothing here yet. {tab === 'pending' ? 'You’re all caught up! 🎉' : ''}
            </p>
          ) : null}
        </div>
      </div>

      <AssignmentModal assignmentId={assignmentId} open={Boolean(assignmentId)} onClose={() => setAssignmentId(null)} />
    </RoleLayout>
  )
}

export function JuniorLeaderboard() {
  const { state } = useApp()
  const [tab, setTab] = useState<'week' | 'all' | 'class'>('week')
  const rows = juniorLeaderboard[tab]
    .map((row) =>
      row.you ? { ...row, points: tab === 'all' ? row.points + (state.points - 1180) : state.points } : row,
    )
    .sort((a, b) => b.points - a.points)
    .map((row, index) => ({ ...row, rank: index + 1 }))
  const you = rows.find((row) => row.you)
  const gapToFirst = you ? Math.max(0, rows[0].points - you.points) : 0
  const podium = [...rows].slice(0, 3)
  const order = [podium[1], podium[0], podium[2]].filter(Boolean)

  return (
    <RoleLayout role="junior">
      <PageHeader
        title="Leaderboard"
        subtitle="Every point is a step forward"
        badge={<Badge tone="role">{you ? `Rank #${you.rank}` : 'Unranked'}</Badge>}
        actions={<HeaderActions role="junior" />}
      />
      <div className="mx-auto max-w-[1100px] space-y-5 p-4 sm:p-6">
        <Card className="overflow-hidden border-0 bg-[image:var(--jr-hero-gradient)] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange-200">Your rank</p>
              <p className="mt-1 text-4xl font-extrabold">#{you?.rank ?? '—'}</p>
              <p className="mt-1 text-xs text-white/70">
                {you ? (
                  <>
                    {you.points.toLocaleString()} points · {you.rank === 1 ? 'top of the leaderboard' : `${gapToFirst} to first place`}
                  </>
                ) : (
                  'Earn points to join the ranking'
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className="!bg-white/15 !text-white">
                <Flame size={11} className="text-orange-300" /> 7 day streak
              </Badge>
              <Badge className="!bg-white/15 !text-white">
                <Trophy size={11} className="text-amber-300" /> Level 6
              </Badge>
            </div>
          </div>
        </Card>

        <Tabs
          tabs={[
            { id: 'week', label: 'This week' },
            { id: 'all', label: 'All time' },
            { id: 'class', label: 'My class' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {order.map((row) => {
            if (!row) return null
            const first = row.rank === 1
            return (
              <Card
                key={row.name}
                className={cn('flex flex-col items-center p-4 text-center', first && 'border-amber-300 bg-amber-50/60')}
              >
                <span className={cn('text-2xl', first && 'text-4xl')} aria-hidden>
                  {row.emoji}
                </span>
                <span className="mt-1 text-[11px] font-extrabold text-muted-foreground">#{row.rank}</span>
                <p className="mt-0.5 line-clamp-1 text-xs font-bold text-foreground">{row.name}</p>
                <p className="text-[11px] font-extrabold text-role-ink">{row.points.toLocaleString()} pts</p>
                {row.you ? <Badge tone="role" className="mt-1">You</Badge> : null}
              </Card>
            )
          })}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-xs font-bold text-foreground">Full ranking</div>
          <div className="divide-y divide-border/70">
            {rows.map((row) => (
              <div
                key={row.name}
                className={cn('flex items-center gap-3 px-4 py-2.5', row.you && 'bg-role-soft/50')}
              >
                <span className="w-6 text-center text-xs font-extrabold text-muted-foreground">{row.rank}</span>
                <span className="text-lg" aria-hidden>
                  {row.emoji}
                </span>
                <span className={cn('flex-1 truncate text-xs', row.you ? 'font-bold text-role-ink' : 'text-foreground')}>
                  {row.name} {row.you ? '· You' : ''}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {row.delta > 0 ? `↑${row.delta}` : row.delta < 0 ? `↓${Math.abs(row.delta)}` : '—'}
                </span>
                <span className="w-16 text-right text-xs font-extrabold text-foreground">
                  {row.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <SectionCard title="Badges to unlock" subtitle="Complete activities to earn them" icon={Gift}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {juniorBadges.map((b) => (
              <div
                key={b.id}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-3',
                  b.earned ? 'border-role/25 bg-role-soft/60' : 'border-dashed border-border',
                )}
              >
                <span className="text-xl" aria-hidden>
                  {b.emoji}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">{b.label}</p>
                  <p className="text-[10px] text-muted-foreground">{b.earned ? 'Unlocked' : 'Locked'}</p>
                </div>
                {b.earned ? <CheckCircle2 size={15} className="ml-auto text-emerald-500" /> : null}
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-900">
            <Sparkles size={16} /> Weekly challenge: earn 150 points to move up the board.
          </div>
          <Link to="/junior/assignments" className={buttonStyles('role', 'sm')}>
            Earn points <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </RoleLayout>
  )
}

export function JuniorMessages() {
  return (
    <RoleLayout role="junior">
      <PageHeader
        title="Messages"
        subtitle="Chat with your teachers and classmates"
        badge={<Badge tone="role">Safe messaging</Badge>}
        actions={<HeaderActions role="junior" />}
      />
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <Card className="p-3 sm:p-4">
          <Messenger audience="junior" author="Tunde Bakare" />
        </Card>
        <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          <MessageCircle size={12} /> Messages are monitored by a trusted adult. Report anything that feels unkind.
        </p>
      </div>
    </RoleLayout>
  )
}
