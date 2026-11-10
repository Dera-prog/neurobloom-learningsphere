import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import type { Audience } from '../data/content'
import { landingRoles, roleConfigs } from '../config/roles'
import { ACCOUNT_ROLES, asAccountRole, asRole, useAuth } from '../lib/auth'
import { looksLikeEmail } from '../lib/email'
import { Button, buttonStyles } from '../components/ui'
import { cn } from '../lib/utils'
import { useToast } from '../components/toast'

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
          <Link to="/parent/support" className="font-semibold text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </main>
    </div>
  )
}

function SignedInNote({
  name,
  continueTo,
  onUseAnother,
}: {
  name: string
  continueTo: string
  onUseAnother: () => void
}) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-muted/60 p-3">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        This browser is signed in as <span className="font-bold text-foreground">{name}</span>.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link to={continueTo} className={buttonStyles('primary', 'sm')}>
          Continue to dashboard
        </Link>
        <button type="button" onClick={onUseAnother} className={buttonStyles('ghost', 'sm')}>
          Use a different account
        </button>
      </div>
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
  const { configured, loading, session, profile, profileLoading, signIn, signOut } = useAuth()
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
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Only carry a visitor forward when this page signed them in. A leftover
  // session must not skip the sign-in screen and drop them into an old dashboard.
  const [signedIn, setSignedIn] = useState(false)

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

  const waiting = busy || (Boolean(session) && profileLoading)

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
        {session && !signedIn ? (
          <SignedInNote
            name={profile?.full_name?.trim() || profile?.email || session.user.email || 'this account'}
            continueTo={next ?? (profile ? roleConfigs[profile.role].home : '/')}
            onUseAnother={() => void signOut()}
          />
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {roleHint
            ? `Sign in to open the ${roleConfigs[roleHint].marketing.title} dashboard.`
            : 'Sign in to continue to your dashboard.'}
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
          <div className="text-left">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                Password
              </label>
              <Link to="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
              required
            />
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

          <Button type="submit" size="lg" className="w-full" disabled={waiting || loading}>
            {waiting ? 'Signing you in…' : 'Sign in'} {waiting ? null : <ArrowRight size={15} />}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          New to NeuroBloom?{' '}
          <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-primary hover:underline">
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
        <p className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Back to home
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

export function SignupPage() {
  const { configured, session, profile, signUp, signOut } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const requestedNext = params.get('next')
  const next = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : null
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Audience>(asAccountRole(params.get('role')) ?? 'junior')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')

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
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    setBusy(true)
    const result = await signUp({ email, password, fullName, role, phone })
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
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
        {session ? (
          <SignedInNote
            name={profile?.full_name?.trim() || profile?.email || session.user.email || 'this account'}
            continueTo={next ?? (profile ? roleConfigs[profile.role].home : '/')}
            onUseAnother={() => void signOut()}
          />
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1 text-xs text-muted-foreground">One account for learning, tutoring or keeping track of your child.</p>

        <form onSubmit={submit} className="mt-6 space-y-3.5" noValidate>
          <label className="block text-left">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Amaka Achebe"
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-foreground">I am a…</span>
            <div className="grid grid-cols-2 gap-1.5">
              {ACCOUNT_ROLES.map((item) => {
                const config = roleConfigs[item]
                const active = role === item
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition',
                      active
                        ? 'border-primary/40 bg-primary/[0.06] text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <span aria-hidden>{config.emoji}</span>
                    <span className="truncate">{config.marketing.title.replace(' / Tutor', '').replace(' / Guardian', '')}</span>
                  </button>
                )
              })}
            </div>
          </div>

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
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block text-left">
            <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold text-foreground">
              Phone number
              <span className="text-[10px] font-medium text-muted-foreground">Optional — for class reminders</span>
            </span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="080 1234 5678"
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
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
              className="h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
            />
          </label>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Creating your account…' : 'Create account'} {busy ? null : <ArrowRight size={15} />}
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
