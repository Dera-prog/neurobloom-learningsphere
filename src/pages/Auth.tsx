import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Mail,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import type { Audience } from '../data/content'
import { landingRoles, roleConfigs } from '../config/roles'
import { ACCOUNT_ROLES, asAccountRole, asRole, useAuth } from '../lib/auth'
import { looksLikeEmail } from '../lib/email'
import { CLASS_LEVELS, CHILD_SLOTS, saveSignupChildren, uploadEvaluationReport, type ChildRecord } from '../lib/parent-children'
import { Button, buttonStyles } from '../components/ui'
import { cn } from '../lib/utils'
import { useToast } from '../components/toast'
import { useApp } from '../store/store'

const TEACHER_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Basic Science',
  'Basic Technology',
  'Social Studies',
  'Computer Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Further Mathematics',
  'Economics',
  'Government',
  'Literature in English',
  'Special Needs Support',
]
const QUALIFICATIONS = ['B.Ed', 'B.Sc / B.A', 'PGDE', 'M.Ed', 'Ph.D', 'Other']
const EXPERIENCE_LEVELS = ['Less than 1 year', '1–3 years', '4–6 years', '7–10 years', 'Over 10 years']
const TEACHING_LEVELS = ['Junior Secondary', 'Senior Secondary', 'Special Needs']
const MAX_REPORT_BYTES = 10 * 1024 * 1024

interface ChildDraft {
  name: string
  className: string
  specialNeeds: boolean
}

const newChild = (): ChildDraft => ({ name: '', className: 'JSS1', specialNeeds: false })

const fieldClass =
  'h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10'

const opsFieldClass =
  'h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-[#475569]/40 focus:bg-card focus:ring-2 focus:ring-[#475569]/10'

const DEMO_ADMIN_EMAIL = 'admin.demo@example.com'
const DEMO_ADMIN_PASSWORD = 'NeuroBloomDemo2026!'

const LAST_LEARNER_KEY = 'neurobloom.last-learner'

interface RememberedLearner {
  name: string
  role: Audience
  email: string
}

function readRememberedLearner(): RememberedLearner | null {
  try {
    const raw = localStorage.getItem(LAST_LEARNER_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<RememberedLearner>
    if (!value.role || !ACCOUNT_ROLES.includes(value.role)) return null
    if (typeof value.email !== 'string' || typeof value.name !== 'string') return null
    if (!value.email.trim()) return null
    return { name: value.name.trim() || value.email, role: value.role, email: value.email }
  } catch {
    return null
  }
}

function saveRememberedLearner(learner: RememberedLearner) {
  try {
    localStorage.setItem(LAST_LEARNER_KEY, JSON.stringify(learner))
  } catch {
    // Private browsing can refuse storage; the name line just stays hidden.
  }
}

function clearRememberedLearner() {
  try {
    localStorage.removeItem(LAST_LEARNER_KEY)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#8b5cf6]/40 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl" aria-hidden>
            🌱
          </span>
          <span>
            <span className="block text-lg font-extrabold tracking-tight">NeuroBloom</span>
            <span className="block text-[9px] font-semibold tracking-[0.18em] text-white/60">LEARNINGSPHERE</span>
          </span>
        </Link>

        <div className="relative my-auto max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold">
            <Sparkles size={11} /> Inclusive by design
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight">
            One account.
            <br />
            Every learner’s progress, safely kept.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Sign in to pick up exactly where you left off. Assignments, messages, plans and progress save to your own
            secure space.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              { icon: ShieldCheck, text: 'Private by default — only you see your dashboard' },
              { icon: CheckCircle2, text: 'Progress saved automatically as you learn' },
              { icon: Mail, text: 'Confirmations sent to the email you choose' },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-2.5 text-[12px] text-white/80">
                <item.icon size={15} className="mt-0.5 shrink-0 text-white/60" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-wrap gap-2">
          {landingRoles.map((role) => (
            <span key={role} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/75">
              {roleConfigs[role].emoji} {roleConfigs[role].marketing.title}
            </span>
          ))}
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex min-h-dvh flex-col bg-background px-4 py-6 outline-none sm:px-8 sm:py-10">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <Link to="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg" aria-hidden>
              🌱
            </span>
            <span>
              <span className="block text-base font-extrabold tracking-tight text-primary">NeuroBloom</span>
              <span className="block text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">LEARNINGSPHERE</span>
            </span>
          </Link>
          {children}
        </div>
        <p className="mx-auto mt-8 w-full max-w-md text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} NeuroBloom LearningSphere · Need help?{' '}
          <a href="mailto:support@neurobloom.ng" className="inline-block px-1 py-2 font-semibold text-primary hover:underline">
            Contact support
          </a>
        </p>
      </main>
    </div>
  )
}

function DemoPanel({ role }: { role?: Audience | null }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
        Demo mode
      </span>
      <h2 className="mt-3 text-xl font-extrabold tracking-tight text-foreground">Accounts aren’t connected yet</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        This build runs without a database, so sign-in is switched off. Every dashboard still works and saves to this
        browser. Connect Supabase to turn on real accounts, then confirmation emails with Mailgun.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {landingRoles.map((item) => {
          const config = roleConfigs[item]
          return (
            <Link
              key={item}
              to={config.home}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition hover:bg-muted',
                item === role && 'border-primary/40 ring-1 ring-primary/15',
              )}
            >
              <span className="text-lg" aria-hidden>
                {config.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-foreground">{config.marketing.title}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{config.marketing.level}</span>
              </span>
              <ArrowRight size={13} className="text-muted-foreground" />
            </Link>
          )
        })}
        <Link
          to="/admin"
          className="mt-1 flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-background px-3 py-2.5 text-left transition hover:bg-muted"
        >
          <span className="text-lg" aria-hidden>
            🛡️
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-foreground">Admin / Super Admin</span>
            <span className="block truncate text-[10px] text-muted-foreground">Approvals, moderation, finance & analytics</span>
          </span>
          <ArrowRight size={13} className="text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] font-medium text-destructive">
      {children}
    </p>
  )
}

export function LoginPage() {
  const { configured, loading, session, profile, signIn, signOut } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const requestedNext = params.get('next')
  const next = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : null
  const roleHint = asRole(params.get('role'))
  const linkFailed = params.get('error') === 'callback'
  const justReset = params.get('reset') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Only carry a visitor forward when this page signed them in. A leftover
  // session must not skip the sign-in screen and drop them into an old dashboard.
  const [signedIn, setSignedIn] = useState(false)
  const [remembered, setRemembered] = useState<RememberedLearner | null>(readRememberedLearner)

  // Remember the learner so a returning visitor is greeted by name even after
  // signing out. Administrators never land in this memory.
  useEffect(() => {
    if (!profile || profile.role === 'admin') return
    const learner = {
      name: profile.full_name?.trim() || profile.email,
      role: profile.role,
      email: profile.email,
    }
    saveRememberedLearner(learner)
    setRemembered(learner)
  }, [profile])

  useEffect(() => {
    if (!remembered) return
    setEmail((value) => value || remembered.email)
  }, [remembered])

  // Browsers can restore the saved demo administrator login here. That account
  // belongs on /ops-admin, so drop it from the public form if it turns up.
  useEffect(() => {
    const drop = () => {
      setEmail((value) => (value === DEMO_ADMIN_EMAIL ? '' : value))
      setPassword((value) => (value === DEMO_ADMIN_PASSWORD ? '' : value))
    }
    drop()
    const timers = [setTimeout(drop, 250), setTimeout(drop, 900)]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!configured || loading || !signedIn || !session || !profile) return
    navigate(next ?? roleConfigs[profile.role].home, { replace: true })
  }, [configured, loading, signedIn, session, profile, next, navigate])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!looksLikeEmail(email)) {
      setError('Enter the email address you signed up with.')
      return
    }
    if (!password) {
      setError('Enter your password, or reset it if you have forgotten it.')
      return
    }
    setBusy(true)
    const result = await signIn(email, password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    toast('Signed in', { description: 'Loading your dashboard…', tone: 'success' })
    setSignedIn(true)
  }

  async function forgetMe() {
    clearRememberedLearner()
    setRemembered(null)
    setEmail('')
    setPassword('')
    if (session) await signOut()
  }

  const waiting = busy
  const knownLearner: RememberedLearner | null =
    profile && profile.role !== 'admin'
      ? { name: profile.full_name?.trim() || profile.email, role: profile.role, email: profile.email }
      : remembered
  const signupQuery = new URLSearchParams()
  if (roleHint) signupQuery.set('role', roleHint)
  if (next) signupQuery.set('next', next)
  const signupSearch = signupQuery.toString()
  const signupHref = `/signup${signupSearch ? `?${signupSearch}` : ''}`

  if (!configured) {
    return (
      <AuthShell>
        <DemoPanel role={roleHint} />
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
        {knownLearner ? (
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-sm font-bold text-foreground">{knownLearner.name}</p>
            <button
              type="button"
              onClick={forgetMe}
              aria-label="Use another account"
              className="inline-flex min-h-9 items-center text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              Not you?
            </button>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            {roleHint
              ? `Sign in to open the ${roleConfigs[roleHint].marketing.title} dashboard.`
              : 'Sign in to continue to your dashboard.'}
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3.5" noValidate>
          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
              required
            />
          </label>
          <div className="text-left">
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className={cn(fieldClass, 'pr-11')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {justReset ? (
            <p role="status" className="flex items-start gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> Password updated. Sign in with your new password.
            </p>
          ) : null}
          {linkFailed ? (
            <ErrorNote>That sign-in link didn’t work. It may have expired — sign in, or request a new reset link.</ErrorNote>
          ) : null}
          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <p className="text-right">
            <Link
              to="/forgot-password"
              className="inline-flex min-h-11 items-center px-1 text-[11px] font-semibold text-red-600 hover:underline"
            >
              Forgot password?
            </Link>
          </p>
          <Button type="submit" size="lg" className="w-full" disabled={waiting || loading}>
            {waiting ? 'Signing you in…' : 'Sign in'} {waiting ? null : <ArrowRight size={15} />}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          New to NeuroBloom LearningSphere?{' '}
          <Link
            to={signupHref}
            className="px-1 py-2 font-bold text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
        {roleHint === 'parent' ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            New subscriber for Parent Access?{' '}
            <Link to="/parent-access/register" className="font-bold text-primary hover:underline">
              Register a second guardian
            </Link>
          </p>
        ) : null}
        <p className="mt-2 text-center">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={12} /> Back to home
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

function OpsAdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#0f172a] text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#475569]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#1e293b] blur-3xl" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/ops-admin" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white" aria-hidden>
              <ShieldCheck size={18} />
            </span>
            <span>
              <span className="block text-base font-extrabold tracking-tight">NeuroBloom</span>
              <span className="block text-[9px] font-semibold tracking-[0.18em] text-white/50">OPS ADMIN</span>
            </span>
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center px-2 text-[11px] font-semibold text-white/60 transition hover:text-white"
          >
            Learner sign-in
          </Link>
        </header>
        {children}
        <p className="text-center text-[10px] text-white/40">
          © {new Date().getFullYear()} NeuroBloom LearningSphere · Admin Manager access
        </p>
      </div>
    </div>
  )
}

const OPS_DUTIES = [
  {
    title: 'Approvals & moderation',
    copy: 'Teacher applications, learner accounts and flagged reviews that need a decision.',
  },
  {
    title: 'Finance & payouts',
    copy: 'Sales, invoices, teacher payroll and settlement checks in one place.',
  },
  {
    title: 'Platform health',
    copy: 'Live signals, reports, feedback and support requests from every portal.',
  },
]

export function OpsAdminLandingPage() {
  return (
    <OpsAdminShell>
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center py-10 outline-none">
        <div className="w-full">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">
            <ShieldCheck size={12} /> Admin
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            The Admin Manager console.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
            One operational home for the people, money and content behind NeuroBloom LearningSphere. Access is limited to
            the operations team.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              to="/ops-admin/sign-in"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-bold text-[#0f172a] transition hover:bg-white/90"
            >
              Sign in to Admin Manager <ArrowRight size={15} />
            </Link>
            <Link
              to="/ops-admin/sign-up"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Create an admin account
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {OPS_DUTIES.map((duty) => (
              <div key={duty.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-bold text-white">{duty.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{duty.copy}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-xl text-[11px] leading-relaxed text-white/45">
            Administrator accounts are issued by the NeuroBloom operations team. If you were invited, sign in with the
            email on your invitation.
          </p>
        </div>
      </main>
    </OpsAdminShell>
  )
}

const SUPER_DUTIES = [
  {
    title: 'Platform ownership',
    copy: 'Full control of every portal, role and account across NeuroBloom LearningSphere.',
  },
  {
    title: 'Roles & access',
    copy: 'Grant or revoke admin access, manage the operations team and approve sensitive exports.',
  },
  {
    title: 'Security & integrity',
    copy: 'Audit trails, final decisions on flagged content and disputes between users.',
  },
]

function SuperAdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#171238] text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#4338ca]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#1d4ed8]/25 blur-3xl" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/super-admin" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white" aria-hidden>
              <Crown size={18} />
            </span>
            <span>
              <span className="block text-base font-extrabold tracking-tight">NeuroBloom</span>
              <span className="block text-[9px] font-semibold tracking-[0.18em] text-white/50">SUPER ADMIN</span>
            </span>
          </Link>
          <Link
            to="/ops-admin"
            className="inline-flex min-h-11 items-center px-2 text-[11px] font-semibold text-white/60 transition hover:text-white"
          >
            CEO
          </Link>
        </header>
        {children}
        <p className="text-center text-[10px] text-white/40">
          © {new Date().getFullYear()} NeuroBloom LearningSphere · Super Admin access
        </p>
      </div>
    </div>
  )
}

export function SuperAdminLandingPage() {
  return (
    <SuperAdminShell>
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center py-10 outline-none">
        <div className="w-full">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">
            <Crown size={12} /> Super Admin
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            The Super Admin console.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
            The top-level seat for NeuroBloom LearningSphere: every dashboard, every admin account and every sensitive
            decision sits here. Access is issued to owners only.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              to="/ops-admin/sign-in"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-bold text-[#171238] transition hover:bg-white/90"
            >
              Sign in to Super Admin <ArrowRight size={15} />
            </Link>
            <Link
              to="/ops-admin/sign-up"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Request Super Admin access
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {SUPER_DUTIES.map((duty) => (
              <div key={duty.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-bold text-white">{duty.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{duty.copy}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-xl text-[11px] leading-relaxed text-white/45">
            Super Admin accounts are issued personally by NeuroBloom ownership and carry full platform access, including
            control over the operations team itself. If you were invited, sign in with the email on your invitation.
          </p>
        </div>
      </main>
    </SuperAdminShell>
  )
}

export function OpsAdminSignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [level, setLevel] = useState<'admin' | 'super'>('super')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (fullName.trim().length < 2) {
      setError('Add the full name of the person who needs access.')
      return
    }
    if (!looksLikeEmail(email)) {
      setError('Enter a valid work email address.')
      return
    }
    if (phone.replace(/\D/g, '').length < 7) {
      setError('Add a phone number the operations team can reach you on.')
      return
    }
    setReference(`OPS-${Date.now().toString(36).toUpperCase().slice(-6)}`)
  }

  if (reference) {
    return (
      <OpsAdminShell>
        <main id="main-content" tabIndex={-1} className="flex flex-1 items-center justify-center py-10 outline-none">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-foreground shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </span>
            <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">Request received</h1>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              The operations team reviews admin requests before any console access is issued. We’ll reply to{' '}
              <span className="font-bold text-foreground">{email}</span> once the account is approved.
            </p>
            <p className="mt-3 rounded-xl border border-[#1e3a8a]/20 bg-[#1e3a8a]/5 px-3 py-2 text-[11px] font-medium text-[#1e3a8a]">
              Reference {reference} · Super Admin access
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link to="/ops-admin/sign-in" className={buttonStyles('primary', 'lg', 'w-full')}>
                Go to the admin sign-in
              </Link>
              <Link
                to="/ops-admin"
                className="inline-flex min-h-11 items-center justify-center text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Back to Ops Admin
              </Link>
            </div>
          </div>
        </main>
      </OpsAdminShell>
    )
  }

  return (
    <OpsAdminShell>
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center justify-center py-10 outline-none">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-foreground shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1e3a8a]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1e3a8a]">
            <ShieldCheck size={12} /> Super Admin
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">Create an admin account</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Tell us who needs console access and what they will manage. The operations team approves every request before
            an account is created.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
            <label className="block text-left">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Full name</span>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                className={opsFieldClass}
              />
            </label>
            <label className="block text-left">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Work email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@neurobloom.ng"
                className={opsFieldClass}
              />
            </label>
            <label className="block text-left">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Work phone</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="080 1234 5678"
                className={opsFieldClass}
              />
            </label>
            <div className="text-left">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Access level</span>
              <div className="grid grid-cols-1 gap-1.5">
                {([
                  ['super', 'Super Admin'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLevel(value)}
                    aria-pressed={level === value}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] font-semibold transition',
                      level === value
                        ? 'border-[#1e3a8a]/40 bg-[#1e3a8a]/10 text-[#1e3a8a]'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {label}
                    {level === value ? <CheckCircle2 size={13} /> : null}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-left">
              <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold text-foreground">
                What will you manage?
                <span className="text-[10px] font-medium text-muted-foreground">Optional</span>
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Approvals, payouts, moderation for the Lagos region."
                className={cn(opsFieldClass, 'h-auto resize-none py-2')}
              />
            </label>

            {error ? <ErrorNote>{error}</ErrorNote> : null}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[#171238] text-sm font-bold text-white transition hover:bg-[#251d52]"
            >
              Request admin access <ArrowRight size={15} />
            </button>
            <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
              This sends a request only. An administrator account is created after the operations team approves it.
            </p>
          </form>

          <p className="mt-4 text-center">
            <Link
              to="/ops-admin"
              className="inline-flex min-h-11 items-center gap-1 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={12} /> Back to Ops Admin
            </Link>
          </p>
        </div>
      </main>
    </OpsAdminShell>
  )
}

export function OpsAdminLoginPage() {
  const { configured, loading, session, profile, signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState(DEMO_ADMIN_EMAIL)
  const [password, setPassword] = useState(DEMO_ADMIN_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!configured || !signedIn || !session || !profile) return
    navigate(profile.role === 'admin' ? '/admin' : roleConfigs[profile.role].home, { replace: true })
  }, [configured, signedIn, session, profile, navigate])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!looksLikeEmail(email)) {
      setError('Enter the administrator email address.')
      return
    }
    if (!password) {
      setError('Enter the administrator password.')
      return
    }
    setBusy(true)
    const result = await signIn(email, password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    toast('Signed in', { description: 'Opening the Admin Manager console…', tone: 'success' })
    setSignedIn(true)
  }

  if (!configured) {
    return (
      <AuthShell>
        <DemoPanel role="admin" />
      </AuthShell>
    )
  }

  return (
    <OpsAdminShell>
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center justify-center py-10 outline-none">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-foreground shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#475569]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#334155]">
              <ShieldCheck size={12} /> Restricted access
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-foreground">Zainab Yusuf</p>
              <span className="rounded-full bg-[#475569]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#334155]">
                Admin manager
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">admin.demo@example.com · Lagos support desk · WAT</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Sign in to the Admin Manager console for approvals, moderation, payouts and platform health.
            </p>
            <p className="mt-3 rounded-xl border border-[#475569]/20 bg-[#475569]/5 px-3 py-2 text-[11px] font-medium text-[#334155]">
              Review account: the demo administrator email and password are already filled in.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
              <label className="block text-left">
                <span className="mb-1.5 block text-xs font-semibold text-foreground">Administrator email</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={opsFieldClass}
                  required
                />
              </label>
              <div className="text-left">
                <label htmlFor="admin-password" className="mb-1.5 block text-xs font-semibold text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={cn(opsFieldClass, 'pr-11')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#475569]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error ? <ErrorNote>{error}</ErrorNote> : null}

              <button
                type="submit"
                disabled={busy || loading}
                className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[#334155] text-sm font-bold text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Signing you in…' : 'Sign in to Admin Manager'} {busy ? null : <ArrowRight size={15} />}
              </button>
              <p className="-mt-1 text-right">
                <Link
                  to="/forgot-password"
                  className="inline-flex min-h-11 items-center px-1 text-[11px] font-semibold text-red-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </p>
            </form>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Not an administrator?{' '}
              <Link to="/login" className="px-1 py-2 font-bold text-primary hover:underline">
                Learner sign-in
              </Link>
            </p>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Need console access?{' '}
              <Link to="/ops-admin/sign-up" className="px-1 py-2 font-bold text-primary hover:underline">
                Create an admin account
              </Link>
            </p>
            <p className="mt-2 text-center">
              <Link
                to="/ops-admin"
                className="inline-flex min-h-11 items-center gap-1 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={12} /> Back to Ops Admin
              </Link>
            </p>
        </div>
      </main>
    </OpsAdminShell>
  )
}

export function SignupPage() {
  const { configured, signUp } = useAuth()
  const { dispatch, ready } = useApp()
  const toast = useToast()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const requestedNext = params.get('next')
  const next = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : null
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Audience>(asAccountRole(params.get('role')) ?? 'junior')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [children, setChildren] = useState<ChildDraft[]>([newChild()])
  const [subjects, setSubjects] = useState<string[]>([])
  const [qualification, setQualification] = useState('')
  const [experience, setExperience] = useState('')
  const [teachingLevel, setTeachingLevel] = useState('')
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [reportError, setReportError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [otpSentTo, setOtpSentTo] = useState('')
  const [otpNotice, setOtpNotice] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  // Signup hands the children over through localStorage, but the store can
  // hydrate before the report finishes uploading. Track readiness so the upload
  // result lands in the live state instead of a marker nobody reads.
  const readyRef = useRef(ready)
  useEffect(() => {
    readyRef.current = ready
  }, [ready])

  const isParent = role === 'parent'
  const isTeacher = role === 'teacher'
  const isLearner = role === 'junior' || role === 'senior' || role === 'special'
  const wantsReport = isParent && children.some((child) => child.specialNeeds)
  const phoneNeeded = isParent || isTeacher
  const guardianContact = phone.trim()
  const guardianValid = looksLikeEmail(guardianContact) || guardianContact.replace(/\D/g, '').length >= 7

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  async function requestOtp() {
    setOtpError('')
    setOtpNotice('')
    if (!guardianValid) {
      setOtpError('Enter the parent or guardian’s phone number or email above first.')
      return
    }
    setOtpBusy(true)
    try {
      const response = await fetch('/api/guardian-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', contact: guardianContact, learnerName: fullName.trim() }),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        token?: string
        code?: string
        review?: boolean
        message?: string
      }
      if (!response.ok || !payload.token) {
        setOtpError(payload.message || 'Could not send the code. Try again.')
        return
      }
      setOtpToken(payload.token)
      setOtpSentTo(guardianContact)
      setOtpVerified(false)
      setOtpCode('')
      setResendIn(30)
      setOtpNotice(
        payload.review && payload.code
          ? `Demo mode — no email or SMS provider is connected yet, so no message was sent. Use code ${payload.code}.`
          : `Code sent to ${guardianContact}. Ask your parent or guardian to share it, then enter it below.`,
      )
    } catch {
      setOtpError('Could not reach the OTP service. Check your connection and try again.')
    } finally {
      setOtpBusy(false)
    }
  }

  async function confirmOtp() {
    setOtpError('')
    if (!otpToken) {
      setOtpError('Send a code to your parent or guardian first.')
      return
    }
    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError('Enter the 6-digit code.')
      return
    }
    setOtpBusy(true)
    try {
      const response = await fetch('/api/guardian-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: otpCode, token: otpToken }),
      })
      const payload = (await response.json().catch(() => ({}))) as { message?: string; verified?: boolean }
      if (!response.ok || !payload.verified) {
        setOtpError(payload.message || 'That code is not right. Check it and try again.')
        return
      }
      setOtpVerified(true)
      setOtpNotice('')
      setOtpCode('')
      setError('')
    } catch {
      setOtpError('Could not reach the OTP service. Try again.')
    } finally {
      setOtpBusy(false)
    }
  }

  function updateChild(index: number, patch: Partial<ChildDraft>) {
    setChildren((current) => current.map((child, i) => (i === index ? { ...child, ...patch } : child)))
  }

  function toggleSubject(subject: string) {
    setSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject],
    )
  }

  function pickReport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_REPORT_BYTES) {
      setReportFile(null)
      setReportError('That file is larger than 10 MB. Choose a smaller file.')
      return
    }
    setReportError('')
    setReportFile(file)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (fullName.trim().length < 2) {
      setError('Add your full name so teachers know who you are.')
      return
    }
    if (!looksLikeEmail(email)) {
      setError('Enter a valid email address for confirmations.')
      return
    }
    if (isLearner) {
      if (!guardianValid) {
        setError('Add the phone number or email of your parent or guardian.')
        return
      }
      if (!otpVerified) {
        setError('Verify the OTP sent to your parent or guardian before creating your account.')
        return
      }
    }
    if (phoneNeeded && phone.replace(/\D/g, '').length < 7) {
      setError(isParent ? 'Add the parent number we can reach you on.' : 'Add a phone number students can reach you on.')
      return
    }
    if (isParent) {
      if (children.some((child) => child.name.trim().length < 2)) {
        setError('Add the name of each child you are registering.')
        return
      }
      const names = children.map((child) => child.name.trim().toLowerCase())
      if (new Set(names).size !== names.length) {
        setError('Use a different name for each child.')
        return
      }
    }
    if (isTeacher) {
      if (!subjects.length) {
        setError('Choose at least one subject you teach.')
        return
      }
      if (!qualification) {
        setError('Select your highest qualification.')
        return
      }
      if (!experience) {
        setError('Select how long you have been teaching.')
        return
      }
      if (!teachingLevel) {
        setError('Choose the level you teach.')
        return
      }
    }
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }

    const records: ChildRecord[] = children.map((child) => ({
      name: child.name.trim(),
      className: child.className,
      specialNeeds: child.specialNeeds,
    }))

    setBusy(true)
    const result = await signUp({
      email,
      password,
      fullName,
      role,
      phone,
      children: isParent ? records : undefined,
      teacher: isTeacher ? { subjects, qualification, experience, level: teachingLevel } : undefined,
    })
    if (result.error) {
      setBusy(false)
      setError(result.error)
      return
    }

    if (isParent) {
      saveSignupChildren(email, records)
      // The report uploads into the new guardian's own storage folder, so it
      // needs the session Supabase returns right after an auto-confirmed signup.
      if (reportFile && result.userId && !result.needsConfirmation) {
        const upload = await uploadEvaluationReport(reportFile, result.userId)
        if (upload.path) {
          const report = {
            name: reportFile.name,
            size: reportFile.size,
            type: reportFile.type,
            path: upload.path,
            uploadedAt: new Date().toISOString(),
          }
          // Wait for the first hydration so the update is not overwritten by it.
          for (let i = 0; i < 30 && !readyRef.current; i += 1) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
          if (readyRef.current) {
            records.forEach((record, index) => {
              if (record.specialNeeds && CHILD_SLOTS[index]) {
                dispatch({ type: 'SET_CHILD_REPORT', child: CHILD_SLOTS[index], report })
              }
            })
          } else {
            saveSignupChildren(
              email,
              records.map((record) => (record.specialNeeds ? { ...record, report } : record)),
            )
          }
        } else {
          toast('Evaluation report not uploaded', {
            description: 'Your account is ready. Sign in, then attach the report from your parent dashboard.',
            tone: 'warn',
          })
        }
      }
    }

    setBusy(false)
    if (result.needsConfirmation) {
      setSentTo(email.trim())
      return
    }
    navigate(next ?? roleConfigs[role].home, { replace: true })
  }

  if (!configured) {
    return (
      <AuthShell>
        <DemoPanel role={role} />
      </AuthShell>
    )
  }

  if (sentTo) {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Mail size={26} />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">Check your inbox</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            We sent a confirmation link to <span className="font-bold text-foreground">{sentTo}</span>. Open it to
            activate your account, then come back and sign in.
          </p>
          {isParent ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {children.length === 1 ? 'Your child is' : 'Your children are'} saved. The parent dashboard will show
              their names and daily progress as soon as you sign in.
            </p>
          ) : null}
          {isTeacher ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Your subjects, qualification and teaching level are saved to your account.
            </p>
          ) : null}
          {isParent && reportFile && !reportError ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
              Keep <span className="font-bold">{reportFile.name}</span> handy — once your account is confirmed you can
              attach it from the parent dashboard.
            </p>
          ) : null}
          <Link to="/login" className={buttonStyles('primary', 'lg', 'mt-5 w-full')}>
            Back to sign in
          </Link>
          <button
            type="button"
            onClick={() => setSentTo('')}
            className="mt-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
          <span aria-hidden>{roleConfigs[role].emoji}</span>
          {roleConfigs[role].marketing.title}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{roleConfigs[role].marketing.description}</p>

        <form onSubmit={submit} className="mt-6 space-y-3.5" noValidate>
          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={isParent ? 'Ngozi Bakare' : 'Amaka Achebe'}
              className={fieldClass}
            />
          </label>

          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">
              Email address
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={fieldClass}
            />
          </label>

          <label className="block text-left">
            <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold text-foreground">
              {isParent ? 'Parent number' : isTeacher ? 'Phone number' : 'Parent/guardian contact'}
              <span className="text-[10px] font-medium text-muted-foreground">
                {isParent
                  ? 'Necessary — Parent Number'
                  : isTeacher
                    ? 'Necessary — for class scheduling'
                    : 'Required — Parent/Guardian phone number'}
              </span>
            </span>
            <input
              type={isLearner ? 'text' : 'tel'}
              inputMode={isLearner ? 'text' : 'tel'}
              autoComplete={isLearner ? 'off' : 'tel'}
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
                if (isLearner && (otpToken || otpVerified)) {
                  setOtpToken('')
                  setOtpVerified(false)
                  setOtpSentTo('')
                  setOtpNotice('')
                  setOtpError('')
                  setOtpCode('')
                  setResendIn(0)
                }
              }}
              placeholder="080 1234 5678"
              className={fieldClass}
            />
          </label>

          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className={fieldClass}
            />
          </label>

          {isLearner ? (
            <section
              className="rounded-xl border border-border bg-card p-3"
              aria-labelledby="guardian-otp-heading"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2
                    id="guardian-otp-heading"
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                  >
                    <ShieldCheck size={13} className="text-primary" /> Parent/Guardian OTP
                  </h2>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    A parent or guardian confirms this account. We’ll send a 6-digit code to the contact above for
                    them to share with you.
                  </p>
                </div>
                {otpVerified ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                ) : null}
              </div>

              {otpVerified ? (
                <p
                  role="status"
                  className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[10px] font-medium text-emerald-800"
                >
                  {otpSentTo} is verified as your parent/guardian contact.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={otpBusy || resendIn > 0}
                    className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/[0.06] text-[11px] font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={13} />
                    {otpBusy
                      ? 'Sending…'
                      : otpSentTo
                        ? resendIn > 0
                          ? `Resend OTP in ${resendIn}s`
                          : 'Resend OTP'
                        : 'Send OTP to parent/guardian'}
                  </button>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      aria-label="Parent or guardian OTP"
                      maxLength={6}
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit code"
                      className={cn(fieldClass, 'flex-1')}
                    />
                    <button
                      type="button"
                      onClick={confirmOtp}
                      disabled={otpBusy}
                      className="h-10 shrink-0 rounded-xl bg-primary px-4 text-[11px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Verify
                    </button>
                  </div>
                  {otpNotice ? (
                    <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-2 text-[10px] font-medium leading-relaxed text-foreground">
                      {otpNotice}
                    </p>
                  ) : null}
                  {otpError ? (
                    <p role="alert" className="mt-1.5 text-[10px] font-medium text-destructive">
                      {otpError}
                    </p>
                  ) : null}
                </>
              )}
            </section>
          ) : null}

          {isParent ? (
            <section className="space-y-2.5" aria-labelledby="children-heading">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="children-heading" className="text-xs font-semibold text-foreground">
                  Your children
                </h2>
                <span className="text-[10px] font-medium text-muted-foreground">{children.length} of 2</span>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Add the learner(s) you want to monitor. These names appear on your dashboard.
              </p>

              {children.map((child, index) => (
                <div key={index} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-foreground">Child {index + 1}</span>
                    {children.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setChildren((current) => current.filter((_, i) => i !== index))}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground transition hover:text-destructive"
                      >
                        <X size={11} /> Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">Child’s full name</span>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(event) => updateChild(index, { name: event.target.value })}
                        placeholder="Tunde Bakare"
                        className={fieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">Class</span>
                      <select
                        value={child.className}
                        onChange={(event) => updateChild(index, { className: event.target.value })}
                        className={fieldClass}
                      >
                        {CLASS_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-start gap-2 rounded-lg bg-muted/60 px-2.5 py-2">
                      <input
                        type="checkbox"
                        checked={child.specialNeeds}
                        onChange={(event) => updateChild(index, { specialNeeds: event.target.checked })}
                        className="mt-0.5 h-3.5 w-3.5 accent-primary"
                      />
                      <span className="text-[10px] leading-relaxed text-foreground">
                        Registering this child for <span className="font-bold">special needs support</span>
                        <span className="block text-muted-foreground">Autism, ADHD or other developmental support.</span>
                      </span>
                    </label>
                  </div>
                </div>
              ))}

              {children.length < 2 ? (
                <button
                  type="button"
                  onClick={() => setChildren((current) => [...current, newChild()])}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  <Plus size={13} /> Add another child
                </button>
              ) : null}

              {wantsReport ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                    <FileText size={13} className="text-amber-700" /> Evaluation report
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    Upload the child’s evaluation report. PDF preferred — we’ll take any format. Upload 1 supported
                    file, max 10 MB. You’ll need to be signed into your NeuroBloom account to upload; this happens
                    automatically when your account is created.
                  </p>
                  {reportFile ? (
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2">
                      <FileText size={14} className="shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-foreground">
                        {reportFile.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {(reportFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => setReportFile(null)}
                        aria-label="Remove the evaluation report"
                        className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-card px-3 py-2.5 text-[11px] font-semibold text-foreground transition hover:bg-amber-50">
                      <UploadCloud size={14} /> Choose a file
                      <input type="file" className="sr-only" onChange={pickReport} />
                    </label>
                  )}
                  {reportError ? (
                    <p role="alert" className="mt-1.5 text-[10px] font-medium text-destructive">
                      {reportError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {isTeacher ? (
            <section className="space-y-3" aria-labelledby="teacher-heading">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 id="teacher-heading" className="text-xs font-semibold text-foreground">
                    Subjects you teach
                  </h2>
                  <span className="text-[10px] font-medium text-muted-foreground">{subjects.length} selected</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {TEACHER_SUBJECTS.map((subject) => {
                    const active = subjects.includes(subject)
                    return (
                      <button
                        key={subject}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleSubject(subject)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[10px] font-semibold transition',
                          active
                            ? 'border-primary/40 bg-primary/[0.08] text-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {subject}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">Highest qualification</span>
                  <select
                    value={qualification}
                    onChange={(event) => setQualification(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Select…</option>
                    {QUALIFICATIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">Teaching experience</span>
                  <select
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Select…</option>
                    {EXPERIENCE_LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">Level you teach</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {TEACHING_LEVELS.map((level) => {
                    const active = teachingLevel === level
                    return (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setTeachingLevel(level)}
                        className={cn(
                          'rounded-xl border px-2 py-2 text-[10px] font-semibold transition',
                          active
                            ? 'border-primary/40 bg-primary/[0.06] text-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy
              ? 'Creating your account…'
              : isTeacher
                ? 'Create teacher account'
                : isParent
                  ? 'Create parent account'
                  : 'Create account'}{' '}
            {busy ? null : <ArrowRight size={15} />}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Already have an account?{' '}
          <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
          We’ll email a confirmation link to the address above. Your dashboard stays private to your account.
        </p>
      </div>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const { configured, requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!looksLikeEmail(email)) {
      setError('Enter the email address you signed up with.')
      return
    }
    setBusy(true)
    const result = await requestPasswordReset(email)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSentTo(email.trim())
  }

  if (!configured) {
    return (
      <AuthShell>
        <DemoPanel />
      </AuthShell>
    )
  }

  if (sentTo) {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound size={26} />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">Check your inbox</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            If <span className="font-bold text-foreground">{sentTo}</span> is registered, a reset link is on its way. Open
            it to choose a new password — the link expires after a while, so use it soon.
          </p>
          <Link to="/login" className={buttonStyles('primary', 'lg', 'mt-5 w-full')}>
            Back to sign in
          </Link>
          <button
            type="button"
            onClick={() => {
              setSentTo('')
              setEmail(sentTo)
            }}
            className="mt-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound size={20} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">Forgot your password?</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Enter the email on your account and we’ll send a link to set a new password. Your work and progress stay
          exactly as they are.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3.5" noValidate>
          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
              required
            />
          </label>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Sending the link…' : 'Send reset link'} {busy ? null : <ArrowRight size={15} />}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Back to home
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const { configured, loading, session, profile, recovering, updatePassword } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // The recovery session arrives a moment after the page paints, so hold the
  // "expired link" verdict briefly instead of flashing it at a valid visitor.
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!configured || loading) return
    const timer = setTimeout(() => setChecked(true), 1200)
    return () => clearTimeout(timer)
  }, [configured, loading])

  const canReset = Boolean(session) || recovering

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords don’t match.')
      return
    }
    setBusy(true)
    const result = await updatePassword(password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    toast('Password updated', { description: 'You’re signed in with your new password.', tone: 'success' })
    navigate(roleConfigs[profile?.role ?? 'junior'].home, { replace: true })
  }

  if (!configured) {
    return (
      <AuthShell>
        <DemoPanel />
      </AuthShell>
    )
  }

  if (!canReset && (loading || !checked)) {
    return (
      <AuthShell>
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary text-lg text-white">🌱</span>
          <p className="text-sm font-semibold text-foreground">Checking your reset link…</p>
        </div>
      </AuthShell>
    )
  }

  if (!canReset) {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <KeyRound size={26} />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">This link has expired</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Reset links only last a short while. Request a fresh one and it will work straight away.
          </p>
          <Link to="/forgot-password" className={buttonStyles('primary', 'lg', 'mt-5 w-full')}>
            Request a new link
          </Link>
          <Link to="/login" className={buttonStyles('outline', 'md', 'mt-2 w-full')}>
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound size={20} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">Choose a new password</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {profile?.email ? (
            <>
              Setting a new password for <span className="font-bold text-foreground">{profile.email}</span>.
            </>
          ) : (
            'Pick something you’ll remember — at least 8 characters.'
          )}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3.5" noValidate>
          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
              required
            />
          </label>
          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Type it again"
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
              required
            />
          </label>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Saving your password…' : 'Save new password'} {busy ? null : <ArrowRight size={15} />}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Back to home
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

export function AuthCallbackPage() {
  const { configured, loading, session, profile, recovering } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const recoveryLink = params.get('type') === 'recovery'

  useEffect(() => {
    if (!configured) {
      navigate('/', { replace: true })
      return
    }
    if (loading) return
    if (recoveryLink || recovering) {
      navigate('/reset-password', { replace: true })
      return
    }
    if (session && profile) {
      navigate(roleConfigs[profile.role].home, { replace: true })
      return
    }
    if (!session) {
      const timer = setTimeout(() => navigate('/login?error=callback', { replace: true }), 4000)
      return () => clearTimeout(timer)
    }
  }, [configured, loading, session, profile, recovering, recoveryLink, navigate])

  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary text-xl text-white">🌱</span>
      <p className="text-sm font-semibold text-foreground">Signing you in…</p>
      <p className="text-[11px] text-muted-foreground">This only takes a moment.</p>
    </div>
  )
}
