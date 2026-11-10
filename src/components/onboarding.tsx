import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FolderOpen,
  GraduationCap,
  LifeBuoy,
  ListChecks,
  MessageCircle,
  Palette,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { HeaderActions, RoleLayout } from './layout'
import { Badge, buttonStyles, Card, PageHeader, SectionCard } from './ui'
import { roleConfigs } from '../config/roles'
import type { Audience } from '../data/content'
import { useAuth } from '../lib/auth'
import { clearOnboardingPending } from '../lib/onboarding'
import { orderedChildren } from '../lib/parent-children'
import { useApp } from '../store/store'
import { cn, longDate } from '../lib/utils'
import { DailyProgressCard } from './parent-daily-progress'

export type AccountRole = Exclude<Audience, 'admin'>

interface SetupStep {
  id: string
  title: string
  description: string
  to: string
  cta: string
  icon: LucideIcon
}

interface OnboardingContent {
  promise: string
  steps: SetupStep[]
  habits: string[]
  help: { body: string; to: string; cta: string }
}

const content: Record<AccountRole, OnboardingContent> = {
  junior: {
    promise:
      'Your lessons, practice sets and badges are ready. A few quick steps and you will be learning with your class.',
    steps: [
      {
        id: 'subjects',
        title: 'Pick your subjects',
        description: 'Choose what you study so lessons and practice sets match your class.',
        to: '/junior/subjects',
        cta: 'Choose subjects',
        icon: BookOpen,
      },
      {
        id: 'classes',
        title: 'Join your first live class',
        description: 'Meet your teacher and classmates in the live classroom.',
        to: '/junior/classes',
        cta: 'See timetable',
        icon: Video,
      },
      {
        id: 'assignments',
        title: 'Try a practice set',
        description: 'Answer a few questions to earn your first points and badges.',
        to: '/junior/assignments',
        cta: 'Start practice',
        icon: ClipboardList,
      },
      {
        id: 'leaderboard',
        title: 'Meet your class leaderboard',
        description: 'See how points work and who is leading your class this week.',
        to: '/junior/leaderboard',
        cta: 'View leaderboard',
        icon: Trophy,
      },
    ],
    habits: ['Sign in on school days', 'Finish one practice set a day', 'Ask your teacher when a topic feels hard'],
    help: {
      body: 'Your teacher and the NeuroBloom team can help with lessons, logins and anything that feels confusing.',
      to: '/junior/messages',
      cta: 'Message your teacher',
    },
  },
  senior: {
    promise:
      'Exam prep, tutoring and study resources are ready. A few quick steps and your WAEC plan is on track.',
    steps: [
      {
        id: 'exams',
        title: 'Set your WAEC target',
        description: 'Choose the subjects and papers you are preparing for this year.',
        to: '/senior/exams',
        cta: 'Plan exam prep',
        icon: Target,
      },
      {
        id: 'classes',
        title: 'Open your class timetable',
        description: 'See your live classes, teachers and weekly lesson times.',
        to: '/senior/classes',
        cta: 'View classes',
        icon: Video,
      },
      {
        id: 'tutoring',
        title: 'Book a private tutor',
        description: 'One-to-one help for the subjects that need it most.',
        to: '/senior/tutoring',
        cta: 'Find a tutor',
        icon: GraduationCap,
      },
      {
        id: 'resources',
        title: 'Save your study resources',
        description: 'Notes, past questions and revision packs in one place.',
        to: '/senior/resources',
        cta: 'Browse resources',
        icon: FolderOpen,
      },
    ],
    habits: [
      'Block 45 minutes for exam prep',
      'Book a tutor before a topic piles up',
      'Download resources for offline revision',
    ],
    help: {
      body: 'Your teachers can help with subjects, study plans and anything blocking your revision.',
      to: '/senior/messages',
      cta: 'Talk to your teacher',
    },
  },
  special: {
    promise:
      'Your calm learning space is ready. Go slowly, take breaks whenever you need, and start with one small step.',
    steps: [
      {
        id: 'activities',
        title: 'Try a calming activity',
        description: 'Short, sensory-friendly activities you can stop at any time.',
        to: '/special/activities',
        cta: 'Open activities',
        icon: Palette,
      },
      {
        id: 'lessons',
        title: 'Watch your first lesson',
        description: 'Lessons are short and gentle, with a specialist close by.',
        to: '/special/lessons',
        cta: 'See lessons',
        icon: GraduationCap,
      },
      {
        id: 'progress',
        title: 'See your progress',
        description: 'Every small step counts. Watch your garden grow.',
        to: '/special/progress',
        cta: 'View progress',
        icon: TrendingUp,
      },
      {
        id: 'talk',
        title: 'Say hello to your teacher',
        description: 'A friendly message is always welcome.',
        to: '/special/talk',
        cta: 'Say hello',
        icon: MessageCircle,
      },
    ],
    habits: ['Start with one short activity', 'Take a break whenever you need', 'Tell your teacher how you feel'],
    help: {
      body: 'Your specialist and teacher are here for you. You can ask for help at any time.',
      to: '/special/talk',
      cta: 'Talk to your teacher',
    },
  },
  teacher: {
    promise:
      'Your teaching space is ready. Finish verification, set your availability and publish your first class material.',
    steps: [
      {
        id: 'verification',
        title: 'Finish your verification',
        description: 'Upload your ID, qualifications and safeguarding certificate.',
        to: '/teacher/settings',
        cta: 'Open verification',
        icon: UserCheck,
      },
      {
        id: 'availability',
        title: 'Set your availability',
        description: 'Open the days you can teach so students can book sessions.',
        to: '/teacher/classes',
        cta: 'Set availability',
        icon: CalendarDays,
      },
      {
        id: 'assignment',
        title: 'Create your first assignment',
        description: 'Students see it immediately and you grade in one place.',
        to: '/teacher/assignments',
        cta: 'Create assignment',
        icon: ClipboardList,
      },
      {
        id: 'content',
        title: 'Upload a resource',
        description: 'Share notes, slides or a recorded lesson with your classes.',
        to: '/teacher/content',
        cta: 'Upload resource',
        icon: FolderOpen,
      },
    ],
    habits: [
      'Reply to tutoring requests within 24 hours',
      'Post assignments before the week starts',
      'Keep your availability up to date',
    ],
    help: {
      body: 'Use the complaint box in the sidebar for anything the admin team needs to fix. It goes straight to Help & support.',
      to: '/teacher/messages',
      cta: 'Open messages',
    },
  },
  parent: {
    promise:
      'Your parent portal is ready. Choose a plan, review progress and connect with the teachers supporting your child.',
    steps: [
      {
        id: 'plan',
        title: 'Choose a plan for your child',
        description: 'General is free. Premium unlocks live classes and Parent Access.',
        to: '/parent/subscriptions',
        cta: 'View plans',
        icon: CreditCard,
      },
      {
        id: 'progress',
        title: 'Review academic progress',
        description: 'See averages, attendance and where your child needs support.',
        to: '/parent/progress',
        cta: 'Open progress',
        icon: TrendingUp,
      },
      {
        id: 'guardian',
        title: 'Add a second guardian',
        description: 'Parent Access gives another guardian their own login.',
        to: '/parent/access',
        cta: 'Parent Access',
        icon: UserCheck,
      },
      {
        id: 'teachers',
        title: 'Message your child’s teacher',
        description: 'Check in with the people teaching your child.',
        to: '/parent/teachers',
        cta: 'See teachers',
        icon: Users,
      },
    ],
    habits: ['Check progress once a week', 'Keep billing details up to date', 'Message teachers early when something changes'],
    help: {
      body: 'Our support team can help with plans, billing and specialist requests.',
      to: '/parent/support',
      cta: 'Open special support',
    },
  },
}

function firstName(name: string) {
  return name.replace(/^(Dr|Mr|Mrs|Ms|Miss|Prof)\.?\s+/i, '').split(' ')[0]
}

export function NewUserDashboard({ role }: { role: AccountRole }) {
  const { state, dispatch } = useApp()
  const { profile, user } = useAuth()
  const config = roleConfigs[role]
  const setup = content[role]
  const name = profile?.full_name?.trim() || config.user.name
  const first = firstName(name)
  const total = setup.steps.length
  const done = setup.steps.filter((step) => state.onboarding.steps.includes(step.id)).length
  const progress = Math.round((done / total) * 100)
  const nextStep = setup.steps.find((step) => !state.onboarding.steps.includes(step.id)) ?? setup.steps[0]
  // Once setup is finished this stays the new account's home: there is no
  // history to show yet, so the dashboard stays empty instead of borrowing
  // the sample content an established account sees.
  const setupDone = state.onboarding.complete
  const kids = role === 'parent' ? orderedChildren(state.children) : []

  function completeStep(id: string) {
    if (!state.onboarding.steps.includes(id)) dispatch({ type: 'MARK_ONBOARDING_STEP', step: id })
  }

  function finish() {
    clearOnboardingPending(user?.id)
    dispatch({ type: 'FINISH_ONBOARDING' })
  }

  return (
    <RoleLayout role={role}>
      <PageHeader
        title={`Welcome, ${first}`}
        subtitle={`${longDate()} · ${setupDone ? 'Your dashboard is ready' : `Let’s set up your ${config.portal.toLowerCase()}`}`}
        badge={<Badge tone="role">New account</Badge>}
        actions={<HeaderActions role={role} />}
      />

      <div className="mx-auto max-w-[1250px] space-y-5 p-4 sm:p-6">
        <Card className="relative overflow-hidden border-0 bg-[image:var(--hero-gradient)] p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                <Sparkles size={13} /> Your account is ready
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-[28px]">
                Welcome to NeuroBloom, {first}.
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                {setupDone
                  ? 'Your dashboard starts empty because you have not done anything yet. Anything you do will show up here.'
                  : setup.promise}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={nextStep.to}
                  onClick={() => completeStep(nextStep.id)}
                  className={buttonStyles('primary', 'md', '!bg-white !text-role-ink hover:!bg-white/90')}
                >
                  {setupDone ? 'Start learning' : done === 0 ? 'Start the first step' : nextStep.cta} <ArrowRight size={15} />
                </Link>
                {setupDone ? null : (
                  <button
                    type="button"
                    onClick={finish}
                    className={buttonStyles('ghost', 'md', 'text-white hover:bg-white/15 hover:text-white')}
                  >
                    Skip to my dashboard
                  </button>
                )}
              </div>
            </div>
            <div className="w-full max-w-xs rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>{setupDone ? 'Activity so far' : 'Setup progress'}</span>
                <span>{setupDone ? 'None yet' : `${done} / ${total}`}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-500"
                  style={{ width: `${setupDone ? 0 : progress}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/70">
                {setupDone
                  ? 'No lessons, practice, messages or progress have been recorded on this account yet.'
                  : done === total
                    ? 'All done — your dashboard is ready.'
                    : `${total - done} ${total - done === 1 ? 'step' : 'steps'} left. Take them at your pace.`}
              </p>
            </div>
          </div>
        </Card>

        {role === 'parent' ? <DailyProgressCard childrenList={kids} /> : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {setupDone ? (
            <SectionCard
              title="Recent activity"
              subtitle="Your own learning history will appear here"
              icon={ListChecks}
              action={<Badge tone="role">No activity yet</Badge>}
            >
              <div className="flex flex-col items-center justify-center gap-2 px-3 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-role-soft text-role-ink" aria-hidden>
                  <Sparkles size={20} />
                </span>
                <p className="text-sm font-bold text-foreground">Nothing here yet</p>
                <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                  This dashboard is empty because you have not done anything on this account. Lessons, practice,
                  messages and progress will appear here as soon as you start.
                </p>
                <Link to={nextStep.to} className={buttonStyles('role', 'sm', 'mt-1')}>
                  {nextStep.cta} <ArrowRight size={12} />
                </Link>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
            title="Your setup checklist"
            subtitle="Tick each step as you go — it saves automatically"
            icon={ListChecks}
            action={<Badge tone="role">{done} of {total} done</Badge>}
          >
            <ol className="space-y-2.5">
              {setup.steps.map((step, index) => {
                const isDone = state.onboarding.steps.includes(step.id)
                const Icon = step.icon
                return (
                  <li
                    key={step.id}
                    className={cn(
                      'flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center',
                      isDone ? 'border-role bg-role-soft' : 'border-border/70',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'MARK_ONBOARDING_STEP', step: step.id })}
                      aria-pressed={isDone}
                      aria-label={isDone ? `Mark “${step.title}” as not done` : `Mark “${step.title}” as done`}
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
                        isDone
                          ? 'bg-role text-white'
                          : 'border border-border bg-card text-muted-foreground hover:border-role hover:text-role',
                      )}
                    >
                      {isDone ? <CheckCircle2 size={18} aria-hidden /> : <Icon size={17} aria-hidden />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-xs font-bold', isDone ? 'text-muted-foreground' : 'text-foreground')}>
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{step.description}</p>
                    </div>
                    <Link
                      to={step.to}
                      onClick={() => completeStep(step.id)}
                      className={buttonStyles(isDone ? 'ghost' : 'outline', 'sm', 'shrink-0')}
                    >
                      {isDone ? 'Open again' : step.cta} <ArrowRight size={12} />
                    </Link>
                  </li>
                )
              })}
            </ol>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
              <p className="text-[11px] text-muted-foreground">
                You can finish setup now and come back to these steps any time.
              </p>
              <button type="button" onClick={finish} className={buttonStyles('role', 'sm')}>
                Open my dashboard <ArrowRight size={13} />
              </button>
            </div>
          </SectionCard>
          )}

          <div className="space-y-5">
            <SectionCard title="Your first week" subtitle="Small habits that make a difference" icon={CalendarDays}>
              <ol className="space-y-2.5">
                {setup.habits.map((habit, index) => (
                  <li key={habit} className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-role-soft text-[10px] font-extrabold text-role-ink">
                      {index + 1}
                    </span>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{habit}</p>
                  </li>
                ))}
              </ol>
            </SectionCard>

            <Card className="flex items-start gap-3 bg-role-soft p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-role-ink">
                <LifeBuoy size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-role-ink">Need a hand?</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{setup.help.body}</p>
                <Link
                  to={setup.help.to}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-role-ink hover:underline"
                >
                  {setup.help.cta} <ArrowRight size={11} />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RoleLayout>
  )
}
