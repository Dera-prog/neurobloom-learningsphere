import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Leaf,
  Lock,
  MessageCircle,
  Palette,
  Play,
  Smile,
  Sparkles,
  Star,
  Sun,
  Timer,
  TrendingUp,
  Wind,
} from 'lucide-react'
import { HeaderActions, RoleBadge, RoleLayout } from '../components/layout'
import { Messenger, ComposeMessageModal } from '../components/chat'
import { ActivityModal, LessonPlayerModal, LiveRoomModal } from '../components/lesson'
import { FocusOverlay } from '../components/focus'
import { GroupedBars, TrendArea } from '../components/charts'
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
} from '../components/ui'
import { useToast } from '../components/toast'
import { useApp } from '../store/store'
import { useAuth } from '../lib/auth'
import { NewUserDashboard } from '../components/onboarding'
import {
  specialActivities,
  specialAwards,
  specialClasses,
  specialFocusTrend,
  specialGrowth,
  specialLessons,
  specialSkillTrend,
  type Activity,
} from '../data/content'
import { cn, longDate } from '../lib/utils'

const moods = [
  { emoji: '😄', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😟', label: 'Worried' },
  { emoji: '😢', label: 'Sad' },
]

type Lesson = (typeof specialLessons)[number]

function playerLesson(lesson: Lesson | null) {
  if (!lesson) return null
  return {
    title: lesson.title,
    subject: 'Special Learning',
    instructor: lesson.specialist,
    duration: lesson.duration,
    progress: lesson.completed ? 100 : 0,
    color: lesson.color,
    soft: lesson.soft,
  }
}

export function SpecialHome() {
  const { state, dispatch } = useApp()
  const { profile } = useAuth()
  const toast = useToast()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [live, setLive] = useState<(typeof specialClasses)[number] | null>(null)
  const [focusOpen, setFocusOpen] = useState(false)

  if (profile?.role === 'special' && !state.onboarding.complete) {
    return <NewUserDashboard role="special" />
  }

  const completed = specialActivities.filter((a) => state.completedActivities.includes(a.id)).length
  const earned = specialAwards.filter((a) => a.earned).length
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short' })

  return (
    <RoleLayout role="special">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Hello Chidi <span aria-hidden>🌼</span>
          </span>
        }
        subtitle={`${longDate()} · A calm day, at your own pace`}
        badge={<RoleBadge role="special" />}
        actions={<HeaderActions role="special" />}
      />

      <div className="mx-auto max-w-[1300px] space-y-5 p-4 sm:p-6">
        {/* Calm hero */}
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-[image:var(--soft-gradient)] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/60 blur-2xl" aria-hidden />
          <div className="relative grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-role-ink">
                <Leaf size={13} /> Sensory-friendly mode
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-role-ink">You are safe. You are ready.</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#6b6483]">
                Today we will name feelings, make art, and practise taking turns. You can take a break whenever you need.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="role" onClick={() => setFocusOpen(true)}>
                  <Timer size={15} /> Start quiet focus
                </Button>
                <Button variant="outline" onClick={() => setActivity(specialActivities[0])}>
                  <Wind size={15} /> Breathe with me
                </Button>
              </div>
            </div>
            <div className="rounded-3xl bg-card/75 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#8b84a5]">My calm streak</p>
              <div className="mt-2 flex items-center gap-4">
                <Ring value={70} size={94} stroke={8} color="var(--role-accent)" track="var(--role-soft)">
                  <span className="text-lg font-extrabold text-role-ink">12</span>
                  <span className="text-[9px] font-semibold text-[#8b84a5]">days</span>
                </Ring>
                <div className="space-y-1.5 text-[11px] text-[#6b6483]">
                  <p className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> 4 star learner</p>
                  <p className="flex items-center gap-1"><HeartHandshake size={12} className="text-role-ink" /> 2 trusted adults online</p>
                  <p className="flex items-center gap-1"><Sun size={12} className="text-amber-500" /> Quiet room is open</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Mood check-in */}
        <SectionCard
          title="How are you feeling right now?"
          subtitle="There is no wrong answer. Pick the face that feels like you."
          icon={Smile}
        >
          <div className="flex flex-wrap gap-2">
            {moods.map((m) => {
              const active = state.mood?.label === m.label
              return (
                <button
                  type="button"
                  key={m.label}
                  onClick={() => {
                    dispatch({ type: 'SET_MOOD', mood: { ...m, date: today } })
                    toast(`Thank you for telling me, Chidi`, `Feeling ${m.label.toLowerCase()} is okay.`)
                  }}
                  className={cn(
                    'flex min-w-20 flex-1 flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition',
                    active ? 'border-role bg-role-soft' : 'border-border bg-card hover:bg-muted/60',
                  )}
                  aria-pressed={active}
                >
                  <span className="text-2xl" aria-hidden>{m.emoji}</span>
                  <span className="text-[11px] font-semibold text-[#4b4366]">{m.label}</span>
                </button>
              )
            })}
          </div>
          {state.mood ? (
            <p className="mt-3 rounded-xl bg-role-soft px-3 py-2 text-xs text-role-ink">
              Ms. Sarah can see you chose <span className="font-bold">{state.mood.label.toLowerCase()}</span> today. She is proud of you for sharing.
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">This week</span>
            <div className="flex gap-1.5">
              {state.moodHistory.slice(0, 7).map((m, i) => (
                <span key={`${m.date}-${i}`} className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm" title={`${m.date}: ${m.label}`}>
                  {m.emoji}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            {/* Visual schedule */}
            <SectionCard title="My day" subtitle="A picture schedule for today" icon={CalendarDays}>
              <div className="space-y-2.5">
                {specialClasses.map((c, i) => (
                  <div key={c.id} className={cn('flex items-center gap-3 rounded-2xl border p-3', i === 0 ? 'border-role bg-role-soft/60' : 'border-border/70')}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: c.soft }} aria-hidden>{c.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-role-ink">{c.title}</p>
                        <Badge tone={i === 0 ? 'role' : 'neutral'}>{i === 0 ? 'Now' : i === 1 ? 'Next' : 'Later'}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.time} · {c.duration} · {c.specialist}</p>
                    </div>
                    <Button size="sm" variant={i === 0 ? 'role' : 'outline'} onClick={() => setLive(c)}>
                      {i === 0 ? 'Join' : 'See'}
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Activities */}
            <SectionCard
              title="Choose an activity"
              subtitle={`${completed} of ${specialActivities.length} finished`}
              icon={Palette}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {specialActivities.slice(0, 4).map((a) => {
                  const done = state.completedActivities.includes(a.id)
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => setActivity(a)}
                      className="flex items-start gap-3 rounded-2xl border border-border/70 p-3 text-left transition hover:border-role hover:bg-role-soft/40"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: a.soft }} aria-hidden>{a.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-role-ink">{a.title}</p>
                          {done ? <CheckCircle2 size={13} className="shrink-0 text-role" /> : null}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{a.tag} · {a.minutes} min</p>
                        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold" style={{ color: a.color }}>
                          +{a.reward} points
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-3">
                <Link to="/special/activities" className="inline-flex items-center py-2 text-[11px] font-bold text-role-ink hover:underline">
                  See all activities →
                </Link>
              </div>
            </SectionCard>

            {/* Lessons */}
            <SectionCard title="My lessons" subtitle="Short, gentle learning" icon={BookOpen}>
              <div className="space-y-2.5">
                {specialLessons.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: l.soft }} aria-hidden>{l.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-role-ink">{l.title}</p>
                      <p className="text-[10px] text-muted-foreground">{l.duration} · {l.specialist}</p>
                    </div>
                    {l.completed ? <Badge tone="success">Done</Badge> : null}
                    <Button size="sm" variant="soft" onClick={() => setLesson(l)}>Play</Button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5">
            {/* Focus */}
            <Card className="rounded-3xl bg-[image:var(--soft-gradient)] p-5 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-role-ink shadow-sm" aria-hidden>
                <Timer size={22} />
              </span>
              <p className="mt-3 text-sm font-extrabold text-role-ink">Quiet focus time</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#7a7294]">
                A soft timer with no surprises. Choose 5, 10, 15 or 20 minutes.
              </p>
              <p className="mt-3 text-2xl font-extrabold text-role-ink">{state.focusMinutes} min</p>
              <p className="text-[10px] text-muted-foreground">focused so far</p>
              <Button className="mt-3 w-full" variant="role" onClick={() => setFocusOpen(true)}>
                Start focus time
              </Button>
            </Card>

            {/* Growth */}
            <SectionCard title="How I am growing" subtitle="Gentle wins this month" icon={TrendingUp}>
              <div className="space-y-3">
                {specialGrowth.map((g) => (
                  <div key={g.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-role-ink">{g.label}</span>
                      <span className="font-bold" style={{ color: g.color }}>{g.delta}</span>
                    </div>
                    <ProgressBar value={g.value} color={g.color} label={`${g.label} growth`} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-role-soft p-2.5 text-[11px] text-role-ink">
                <span>{earned} awards earned</span>
                <Link to="/special/awards" className="inline-flex items-center py-2 font-bold hover:underline">My awards →</Link>
              </div>
            </SectionCard>

            {/* Note from Sarah */}
            <Card className="rounded-3xl border-role bg-role-soft/60 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg" aria-hidden>👩🏾‍🏫</span>
                <div>
                  <p className="text-xs font-bold text-role-ink">Ms. Sarah</p>
                  <p className="text-[10px] text-muted-foreground">Speech Therapist</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#5b5375]">
                “Chidi, you did beautifully naming your feelings yesterday. Tomorrow we will practise asking for a break
                using your card. I am proud of you.”
              </p>
              <Link to="/special/talk" className={buttonStyles('outline', 'sm', 'mt-3 w-full')}>
                <MessageCircle size={13} /> Talk to Ms. Sarah
              </Link>
            </Card>
          </div>
        </div>
      </div>

      <ActivityModal open={Boolean(activity)} onClose={() => setActivity(null)} activity={activity} />
      <LessonPlayerModal open={Boolean(lesson)} onClose={() => setLesson(null)} lesson={playerLesson(lesson)} />
      <LiveRoomModal
        open={Boolean(live)}
        onClose={() => setLive(null)}
        title={live ? `${live.title} – Special Class` : 'Special class'}
        teacher={live?.specialist ?? 'Ms. Sarah'}
        teacherRole={live?.role ?? 'Speech Therapist'}
        participants={5}
        accent="var(--role-accent)"
        soft="var(--role-soft)"
      />
      <FocusOverlay open={focusOpen} onClose={() => setFocusOpen(false)} />
    </RoleLayout>
  )
}

export function SpecialActivities() {
  const { state } = useApp()
  const [tag, setTag] = useState('All')
  const [activity, setActivity] = useState<Activity | null>(null)

  const tags = ['All', ...Array.from(new Set(specialActivities.map((a) => a.tag)))]
  const visible = specialActivities.filter((a) => tag === 'All' || a.tag === tag)
  const completed = specialActivities.filter((a) => state.completedActivities.includes(a.id)).length

  return (
    <RoleLayout role="special">
      <PageHeader
        title="My activities"
        subtitle="Calm, creative and confidence-building activities"
        badge={<Badge tone="role">{completed}/{specialActivities.length} done</Badge>}
        actions={<HeaderActions role="special" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Activities done" value={completed} icon={CheckCircle2} color="var(--role-accent)" soft="var(--role-soft)" sub="At your own pace" />
          <StatCard label="Calm minutes" value={state.totalActivityMinutes} icon={Timer} color="#0ea5e9" soft="#e8f4fd" sub="This month" />
          <StatCard label="Points earned" value={state.points.toLocaleString()} icon={Star} color="#f59e0b" soft="#fffbeb" sub="Keep collecting" />
          <StatCard label="Awards" value={specialAwards.filter((a) => a.earned).length} icon={Award} color="#ec4899" soft="#fdf2f8" sub="Unlocked so far" />
        </div>

        <Tabs tabs={tags.map((t) => ({ id: t, label: t }))} value={tag} onChange={setTag} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((a) => {
            const done = state.completedActivities.includes(a.id)
            return (
              <Card key={a.id} hover className="flex flex-col rounded-3xl p-4">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: a.soft }} aria-hidden>{a.emoji}</span>
                  {done ? <Badge tone="success"><CheckCircle2 size={11} /> Finished</Badge> : <Badge tone="neutral">{a.minutes} min</Badge>}
                </div>
                <p className="mt-3 text-sm font-bold text-role-ink">{a.title}</p>
                <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">{a.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: a.soft, color: a.color }}>{a.tag}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">+{a.reward} points</span>
                </div>
                <Button className="mt-3" size="sm" variant={done ? 'outline' : 'role'} onClick={() => setActivity(a)}>
                  {done ? 'Do it again' : 'Start activity'}
                </Button>
              </Card>
            )
          })}
        </div>

        <Card className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-role bg-role-soft/60 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-role-ink">
            <Leaf size={16} /> You can stop at any time. A break is always okay.
          </div>
          <Link to="/special" className={buttonStyles('outline', 'sm')}>
            <ArrowLeft size={13} /> Back to My Day
          </Link>
        </Card>
      </div>

      <ActivityModal open={Boolean(activity)} onClose={() => setActivity(null)} activity={activity} />
    </RoleLayout>
  )
}

export function SpecialLessons() {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [live, setLive] = useState<(typeof specialClasses)[number] | null>(null)

  return (
    <RoleLayout role="special">
      <PageHeader
        title="My lessons"
        subtitle="Short lessons with your specialists"
        badge={<Badge tone="role">At your pace</Badge>}
        actions={<HeaderActions role="special" />}
      />
      <div className="mx-auto max-w-[1100px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {specialLessons.map((l) => (
            <Card key={l.id} className="rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: l.soft }} aria-hidden>{l.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-role-ink">{l.title}</p>
                  <p className="text-[11px] text-muted-foreground">{l.specialist} · {l.role}</p>
                </div>
                {l.completed ? <Badge tone="success">Done</Badge> : null}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Timer size={12} /> {l.duration}</span>
                <span className="flex items-center gap-1"><CalendarDays size={12} /> {l.next}</span>
              </div>
              <Button className="mt-3 w-full" variant={l.completed ? 'outline' : 'role'} onClick={() => setLesson(l)}>
                <Play size={14} /> {l.completed ? 'Watch again' : 'Start lesson'}
              </Button>
            </Card>
          ))}
        </div>

        <SectionCard title="Live specialist classes" subtitle="A familiar face will be there with you" icon={CalendarDays}>
          <div className="space-y-2.5">
            {specialClasses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: c.soft }} aria-hidden>{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-role-ink">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">{c.time} · {c.specialist} · {c.role}</p>
                </div>
                <Button size="sm" variant="role" onClick={() => setLive(c)}>Join</Button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <LessonPlayerModal open={Boolean(lesson)} onClose={() => setLesson(null)} lesson={playerLesson(lesson)} />
      <LiveRoomModal
        open={Boolean(live)}
        onClose={() => setLive(null)}
        title={live ? `${live.title} – Special Class` : 'Special class'}
        teacher={live?.specialist ?? 'Ms. Sarah'}
        teacherRole={live?.role ?? 'Speech Therapist'}
        participants={5}
        accent="var(--role-accent)"
        soft="var(--role-soft)"
      />
    </RoleLayout>
  )
}

export function SpecialProgress() {
  const { state } = useApp()
  const completed = state.completedActivities.length
  const earned = specialAwards.filter((a) => a.earned)

  return (
    <RoleLayout role="special">
      <PageHeader
        title="My progress"
        subtitle="Every small step counts"
        badge={<Badge tone="role">Growing every week</Badge>}
        actions={<HeaderActions role="special" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Focus minutes" value={state.focusMinutes} icon={Timer} color="var(--role-accent)" soft="var(--role-soft)" trend={{ value: '12 this week' }} />
          <StatCard label="Activities done" value={completed} icon={CheckCircle2} color="#0ea5e9" soft="#e8f4fd" sub="Calm wins" />
          <StatCard label="Awards" value={earned.length} icon={Award} color="#f59e0b" soft="#fffbeb" sub="Keep going" />
          <StatCard label="Calm streak" value="12 days" icon={Leaf} color="#10b981" soft="#ecfdf5" sub="Amazing!" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SectionCard title="My skills growing" subtitle="Communication, confidence and social play" icon={TrendingUp}>
            <TrendArea
              data={specialSkillTrend}
              series={[
                { key: 'communication', label: 'Communication', color: '#0ea5e9' },
                { key: 'confidence', label: 'Confidence', color: '#a855f7' },
                { key: 'social', label: 'Social', color: '#10b981' },
              ]}
              yDomain={[20, 100]}
              height={230}
            />
          </SectionCard>

          <SectionCard title="Focus time" subtitle="Minutes of calm focus each day" icon={Timer}>
            <GroupedBars
              data={specialFocusTrend}
              series={[{ key: 'minutes', label: 'Minutes', color: '#a855f7' }]}
              unit="m"
              yDomain={[0, 40]}
              height={200}
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              You focused for {state.focusMinutes} minutes in total. That is wonderful.
            </p>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <SectionCard title="My growing skills" subtitle="A gentle look at this month" icon={Sparkles}>
            <div className="space-y-3.5">
              {specialGrowth.map((g) => (
                <div key={g.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-role-ink">{g.label}</span>
                    <span className="font-bold" style={{ color: g.color }}>{g.value}% · {g.delta}</span>
                  </div>
                  <ProgressBar value={g.value} color={g.color} label={`${g.label} progress`} height="h-2" />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="My feelings this week" subtitle="Thank you for sharing" icon={Smile}>
            <div className="flex flex-wrap gap-2">
              {state.moodHistory.map((m, i) => (
                <div key={`${m.date}-${i}`} className="flex flex-col items-center rounded-2xl bg-muted/60 px-3 py-2">
                  <span className="text-xl" aria-hidden>{m.emoji}</span>
                  <span className="text-[9px] font-semibold text-muted-foreground">{m.date}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-role-soft px-3 py-2 text-[11px] text-role-ink">
              Naming feelings helps your body feel calmer. Ms. Sarah can see your check-ins.
            </p>
          </SectionCard>
        </div>

        <Card className="rounded-3xl border-role bg-role-soft/60 p-4">
          <p className="text-xs font-bold text-role-ink">A note from your team</p>
          <p className="mt-1 text-[11px] leading-relaxed text-role-ink">
            “Chidi is asking for breaks more independently and joined group play twice this week. We are celebrating these
            wins with him.” — Ms. Sarah, Mr. Emeka and Mrs. Adaeze
          </p>
        </Card>
      </div>
    </RoleLayout>
  )
}

export function SpecialAwards() {
  const earned = specialAwards.filter((a) => a.earned)
  const locked = specialAwards.filter((a) => !a.earned)

  return (
    <RoleLayout role="special">
      <PageHeader
        title="My awards"
        subtitle="Celebrating every brave step"
        badge={<Badge tone="role">{earned.length} earned</Badge>}
        actions={<HeaderActions role="special" />}
      />
      <div className="mx-auto max-w-[1100px] space-y-5 p-4 sm:p-6">
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-[image:var(--soft-gradient)] p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm" aria-hidden>🏅</div>
          <p className="mt-3 text-xl font-extrabold text-role-ink">You are a star, Chidi</p>
          <p className="mt-1 text-xs text-muted-foreground">You have earned {earned.length} awards. {locked.length} more are waiting for you.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {earned.map((a) => (
              <span key={a.id} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-role-ink">
                {a.emoji} {a.title}
              </span>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specialAwards.map((a) => (
            <Card key={a.id} className={cn('rounded-3xl p-4 text-center', !a.earned && 'border-dashed opacity-80')}>
              <span className={cn('mx-auto flex h-14 w-14 items-center justify-center rounded-full text-3xl', !a.earned && 'grayscale')} style={{ background: `${a.color}18` }} aria-hidden>
                {a.earned ? a.emoji : <Lock size={20} className="text-muted-foreground" />}
              </span>
              <p className="mt-3 text-sm font-bold text-role-ink">{a.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{a.description}</p>
              <p className={cn('mt-2 text-[10px] font-bold', a.earned ? 'text-role-ink' : 'text-muted-foreground')}>
                {a.earned ?? 'Keep practising'}
              </p>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-role bg-role-soft p-4">
          <p className="text-xs font-semibold text-role-ink">Try one more activity today to move closer to your next award.</p>
          <Link to="/special/activities" className={buttonStyles('role', 'sm')}>
            Choose activity <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </RoleLayout>
  )
}

export function SpecialTalk() {
  const [to, setTo] = useState<{ name: string; role: string } | null>(null)
  const contacts = [
    { name: 'Ms. Sarah', role: 'Speech Therapist', emoji: '👩🏾‍🏫', color: '#0ea5e9', soft: '#e8f4fd' },
    { name: 'Mr. Emeka', role: 'ASD Specialist', emoji: '👨🏿‍🎨', color: '#ec4899', soft: '#fdf2f8' },
    { name: 'Mrs. Adaeze', role: 'Behavioral Coach', emoji: '👩🏽‍🏫', color: '#10b981', soft: '#ecfdf5' },
  ]

  return (
    <RoleLayout role="special">
      <PageHeader
        title="Talk to my teachers"
        subtitle="A safe place to share how you feel"
        badge={<Badge tone="role">Always here</Badge>}
        actions={<HeaderActions role="special" />}
      />
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
        <Card className="rounded-3xl border-role bg-role-soft/60 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-role-ink"><MessageCircle size={16} /> You can send a message any time.</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Use words, emojis or a voice note. A trusted adult will read your message and reply when they can.
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {contacts.map((c) => (
            <Card key={c.name} className="rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ background: c.soft }} aria-hidden>{c.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-role-ink">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.role}</p>
                </div>
              </div>
              <Button className="mt-3 w-full" size="sm" variant="soft" onClick={() => setTo({ name: c.name, role: c.role })}>
                Send a message
              </Button>
            </Card>
          ))}
        </div>

        <Card className="p-3 sm:p-4">
          <Messenger audience="special" author="Chidi Eze" />
        </Card>
      </div>

      <ComposeMessageModal
        open={Boolean(to)}
        onClose={() => setTo(null)}
        to={to?.name ?? ''}
        subtitle={to?.role ?? ''}
        audience="special"
        author="Chidi Eze"
        emoji="🦋"
      />
    </RoleLayout>
  )
}
