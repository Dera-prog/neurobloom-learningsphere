import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  PREMIUM_PLAN_IDS,
  childrenData,
  parentAccessAddon,
  plans,
  type ChildId,
  type PlanId,
} from '../data/content'
import { useAuth } from '../lib/auth'
import { looksLikeEmail } from '../lib/email'
import { paymentsConfigured, saveParentAccessIntent, startCheckout } from '../lib/payments'
import { Button, Input } from '../components/ui'
import { cn, naira } from '../lib/utils'

const premiumPlans = plans.filter((plan) => PREMIUM_PLAN_IDS.includes(plan.id))
const learners: ChildId[] = ['tunde', 'chidi']

function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] font-medium text-destructive">
      {children}
    </p>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg" aria-hidden>
            🌱
          </span>
          <span>
            <span className="block text-base font-extrabold tracking-tight text-primary">NeuroBloom</span>
            <span className="block text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">LEARNINGSPHERE</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="hidden text-[11px] font-semibold text-muted-foreground hover:text-foreground sm:inline">
            Back to home
          </Link>
          <Link
            to={`/login?next=${encodeURIComponent('/parent/billing')}&role=parent`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[11px] font-bold text-foreground transition hover:bg-muted"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}

function SummaryPanel({ plan }: { plan: PlanId }) {
  const chosen = premiumPlans.find((item) => item.id === plan) ?? premiumPlans[0]
  const total = chosen.price + parentAccessAddon.price

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70">
        <div className="flex items-start gap-3 border-b border-amber-200/70 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-900 shadow-sm">
            <UserCheck size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-extrabold text-foreground">{parentAccessAddon.name}</h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
                Premium only
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              A second guardian gets their own login to the same child dashboard — progress, attendance, teacher chat
              and term reports.
            </p>
          </div>
        </div>

        <ul className="space-y-2 px-5 py-4">
          {parentAccessAddon.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-[11px] leading-relaxed text-foreground/80">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="border-t border-amber-200/70 bg-white/60 px-5 py-4">
          <dl className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{chosen.name}</dt>
              <dd className="font-semibold text-foreground">{naira(chosen.price)}/mo</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Parent Access add-on</dt>
              <dd className="font-semibold text-foreground">{naira(parentAccessAddon.price)}/mo</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-amber-200 pt-2 text-xs">
              <dt className="font-bold text-foreground">Monthly total</dt>
              <dd className="font-extrabold text-foreground">{naira(total)}/mo</dd>
            </div>
          </dl>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Paid as two secure Paystack checkouts, one after the other. Both renew monthly and can be cancelled at any
            time.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Sparkles size={14} className="text-primary" /> What happens next
        </p>
        <ol className="mt-3 space-y-3">
          {[
            { title: 'Create your guardian account', text: 'One login for this parent, separate from your child’s account.' },
            { title: 'Activate the child’s premium plan', text: 'First Paystack checkout — the plan starts immediately.' },
            { title: 'Add Parent Access', text: `Second checkout of ${naira(parentAccessAddon.price)}/month completes the setup.` },
          ].map((step, index) => (
            <li key={step.title} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {index + 1}
              </span>
              <span>
                <span className="block text-[11px] font-bold text-foreground">{step.title}</span>
                <span className="block text-[10px] leading-relaxed text-muted-foreground">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-border bg-card p-4">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Card, bank transfer and USSD details are entered on Paystack’s secure checkout and never stored on
          NeuroBloom. This add-on is optional and never affects your child’s learning.
        </p>
      </div>
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1180px] px-4 py-8 outline-none sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
            <UserCheck size={11} /> Parent Access · Optional add-on
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            Register a second guardian
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Create your own login to keep up with your child’s learning. Parent Access sits on top of a premium plan,
            so you’ll choose the child’s plan and add the guardian add-on in one short signup.
          </p>
        </div>
        {children}
      </main>
    </div>
  )
}

export function ParentAccessRegisterPage() {
  const { configured, loading, session, profile, signUp, signOut } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [child, setChild] = useState<ChildId | null>(null)
  const [plan, setPlan] = useState<PlanId>('premium')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [checkoutError, setCheckoutError] = useState('')

  const chosen = premiumPlans.find((item) => item.id === plan) ?? premiumPlans[0]

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (fullName.trim().length < 2) {
      setError('Add your full name so teachers know who you are.')
      return
    }
    if (!looksLikeEmail(email)) {
      setError('Enter a valid email address for confirmations and receipts.')
      return
    }
    if (phone.replace(/\D/g, '').length < 7) {
      setError('Add your parent number so the school can reach you.')
      return
    }
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    if (!child) {
      setError('Choose the learner this subscription is for.')
      return
    }

    setBusy(true)
    const result = await signUp({ email, password, fullName, role: 'parent', phone })
    if (result.error) {
      setBusy(false)
      setError(result.error)
      return
    }

    // The chosen plan and learner follow the new account through the payment
    // callback so the Parent Access step can pick up where this left off.
    saveParentAccessIntent(child, plan)

    if (result.needsConfirmation) {
      setBusy(false)
      setSentTo(email.trim())
      return
    }

    if (!paymentsConfigured) {
      setBusy(false)
      navigate('/parent/subscriptions')
      return
    }

    const checkout = await startCheckout(child, plan)
    if (!checkout.ok) {
      setBusy(false)
      setCheckoutError(checkout.message)
    }
  }

  if (!configured) {
    return (
      <Shell>
        <div className="mt-8 max-w-xl rounded-2xl border border-border bg-card p-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
            Demo mode
          </span>
          <h2 className="mt-3 text-xl font-extrabold tracking-tight text-foreground">Accounts aren’t connected yet</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            This build runs without a database, so registration is switched off. You can still open the parent
            dashboard and review the add-on with sample data.
          </p>
          <Link
            to="/parent/access"
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Open Parent Access <ArrowRight size={15} />
          </Link>
        </div>
      </Shell>
    )
  }

  if (loading) {
    return (
      <Shell>
        <div role="status" className="mt-8 max-w-xl rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold text-foreground">Checking your account…</p>
          <p className="mt-1 text-[11px] text-muted-foreground">This usually takes a second.</p>
        </div>
      </Shell>
    )
  }

  if (sentTo) {
    return (
      <Shell>
        <div className="mt-8 max-w-xl rounded-2xl border border-border bg-card p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Mail size={22} />
          </span>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">Check your inbox</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            We sent a confirmation link to <span className="font-bold text-foreground">{sentTo}</span>. Open it, then
            sign in to finish your subscription. Your plan choice is saved.
          </p>
          <Link
            to={`/login?next=${encodeURIComponent('/parent/subscriptions')}&role=parent`}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Sign in to continue <ArrowRight size={15} />
          </Link>
        </div>
      </Shell>
    )
  }

  if (checkoutError) {
    return (
      <Shell>
        <div className="mt-8 max-w-xl rounded-2xl border border-border bg-card p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BadgeCheck size={22} />
          </span>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">Your account is ready</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {checkoutError} Your guardian login works — continue from your dashboard to activate{' '}
            {child ? childrenData[child].name : 'your child'}’s {chosen.name} and add Parent Access.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/parent/subscriptions"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Go to subscriptions <ArrowRight size={15} />
            </Link>
            <Link
              to="/parent/access"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Open Parent Access
            </Link>
          </div>
        </div>
      </Shell>
    )
  }

  if (session && profile && !busy) {
    return (
      <Shell>
        <div className="mt-8 max-w-xl rounded-2xl border border-border bg-card p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BadgeCheck size={22} />
          </span>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">You’re already signed in</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            This browser is signed in as <span className="font-bold text-foreground">{profile.email}</span>. Open Parent
            Access to add the optional add-on, or sign out first if you’re registering a different guardian.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="md" onClick={() => navigate('/parent/access')}>
              Continue to Parent Access <ArrowRight size={15} />
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => {
                void signOut()
              }}
            >
              Use a different account
            </Button>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 sm:p-6" noValidate>
          <ol className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground">
            {['Your details', 'The learner', 'Plan & review'].map((label, index) => (
              <li key={label} className="flex items-center gap-1.5">
                {index > 0 ? <ChevronRight size={11} className="text-muted-foreground/60" /> : null}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                  {index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>

          <section className="mt-5" aria-labelledby="guardian-heading">
            <h2 id="guardian-heading" className="text-sm font-extrabold text-foreground">
              Your guardian details
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground">This is the login the second guardian will use.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                label="Full name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ngozi Bakare"
              />
              <Input
                label="Parent number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="080 1234 5678"
                hint="Necessary — Parent Number"
              />
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
          </section>

          <div className="my-5 border-t border-border/70" />

          <section aria-labelledby="learner-heading">
            <h2 id="learner-heading" className="text-sm font-extrabold text-foreground">
              Who is this subscription for?
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground">Parent Access covers one learner at a time.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {learners.map((id) => {
                const learner = childrenData[id]
                const active = child === id
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setChild(id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                      active
                        ? 'border-primary/40 bg-primary/[0.05] ring-1 ring-primary/15'
                        : 'border-border bg-background hover:bg-muted/60',
                    )}
                  >
                    <span className="text-lg" aria-hidden>
                      {learner.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-foreground">{learner.name}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {learner.level} learner profile
                      </span>
                    </span>
                    {active ? <CheckCircle2 size={16} className="shrink-0 text-primary" /> : null}
                  </button>
                )
              })}
            </div>
          </section>

          <div className="my-5 border-t border-border/70" />

          <section aria-labelledby="plan-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="plan-heading" className="text-sm font-extrabold text-foreground">
                Choose the premium plan
              </h2>
              <span className="text-[10px] font-semibold text-amber-800">Required for Parent Access</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Parent Access is only available alongside Premium, Premium Plus or Special Needs Premium.
            </p>
            <div className="mt-3 space-y-2">
              {premiumPlans.map((option) => {
                const active = plan === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPlan(option.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                      active ? 'bg-primary/[0.04]' : 'border-border bg-background hover:bg-muted/60',
                    )}
                    style={{ borderColor: active ? option.accent : undefined }}
                  >
                    <span
                      className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2"
                      style={{ borderColor: active ? option.accent : 'var(--color-border)' }}
                      aria-hidden
                    >
                      {active ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: option.accent }} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{option.name}</span>
                        {option.popular ? (
                          <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-700">
                            Popular
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">
                        {option.tagline}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs font-extrabold text-foreground">{naira(option.price)}</span>
                      <span className="block text-[9px] text-muted-foreground">/month</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="mt-5 rounded-xl border border-border bg-muted/40 p-3.5">
            <p className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">
                {chosen.name} + Parent Access
              </span>
              <span className="font-extrabold text-foreground">
                {naira(chosen.price + parentAccessAddon.price)}
                <span className="font-semibold text-muted-foreground">/mo</span>
              </span>
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              You’ll pay {naira(chosen.price)} for the plan first, then {naira(parentAccessAddon.price)} for Parent
              Access in a second secure step.
            </p>
          </div>

          {error ? (
            <div className="mt-3">
              <FormError>{error}</FormError>
            </div>
          ) : null}

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={busy}>
            {busy ? 'Creating your account…' : `Create account & pay ${naira(chosen.price)}`}
            {busy ? null : <ArrowRight size={15} />}
          </Button>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
            <Lock size={10} /> Secure checkout by Paystack · no card details stored here
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-[11px]">
            <span className="text-muted-foreground">
              Already on a premium plan?{' '}
              <Link
                to={`/login?next=${encodeURIComponent('/parent/billing')}&role=parent`}
                className="font-bold text-primary hover:underline"
              >
                Sign in to add
              </Link>
            </span>
            <Link to="/" className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft size={12} /> Back to home
            </Link>
          </div>
        </form>

        <div className="lg:sticky lg:top-24">
          <SummaryPanel plan={plan} />
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-4">
            <Users size={16} className="shrink-0 text-primary" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Each guardian needs their own login. The add-on is billed per child and can be turned off at any time
              without changing the child’s plan.
            </p>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <CreditCard size={11} /> Prices are demo values in Naira.
          </p>
        </div>
      </div>
    </Shell>
  )
}
