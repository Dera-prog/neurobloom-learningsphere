import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Heart,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { landingRoles, roleConfigs } from '../config/roles'
import { parentAccessAddon, plans } from '../data/content'
import { buttonStyles } from '../components/ui'
import { cn, naira } from '../lib/utils'
import { STORAGE_KEY } from '../store/store'
import { useAuth } from '../lib/auth'

export default function Landing() {
  const { configured, session, profile, signOut } = useAuth()
  const signedIn = configured && Boolean(session && profile)

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-xl shadow-sm">🌱</div>
            <div className="leading-tight">
              <span className="block text-[1.05rem] font-extrabold tracking-tight text-primary">NeuroBloom</span>
              <span className="block text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">LEARNINGSPHERE</span>
            </div>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#mission" className="inline-flex items-center py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
              About
            </a>
            <a href="#dashboards" className="inline-flex items-center py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
              Dashboards
            </a>
            <a href="#plans" className="inline-flex items-center py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
              Plans
            </a>
          </div>
          <div className="flex items-center gap-2">
            {!signedIn ? (
              <Link to="/login" className="hidden items-center py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground sm:block">
                Sign in
              </Link>
            ) : null}
            <Link to="/signup" className={buttonStyles('primary', 'md', 'px-5')}>
              Register
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main id="main-content" tabIndex={-1} className="outline-none">
      <section className="relative overflow-hidden px-4 pb-10 pt-12 text-center sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rounded-full bg-[#ede6ff] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#e0f2fe] blur-3xl" />
        <div className="pointer-events-none absolute left-[8%] top-40 hidden animate-float lg:block" aria-hidden>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white text-2xl shadow-sm">🦋</div>
        </div>
        <div className="pointer-events-none absolute right-[9%] top-24 hidden animate-float text-2xl lg:block" style={{ animationDelay: '1.4s' }} aria-hidden>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">🎓</div>
        </div>
        <div className="pointer-events-none absolute right-[16%] top-64 hidden animate-float text-xl lg:block" style={{ animationDelay: '0.8s' }} aria-hidden>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">⭐</div>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-5 inline-flex animate-fade-up items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-4 py-1.5 text-[11px] font-semibold text-primary">
            <Sparkles size={13} /> Inclusive Education for Every Learner
          </div>
          <h1 className="animate-fade-up text-[2.45rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl" style={{ animationDelay: '60ms' }}>
            Where Every Child
            <br />
            <span className="bg-gradient-to-r from-primary via-[#8b5cf6] to-[#0ea5e9] bg-clip-text text-transparent">Blooms</span>{' '}
            and Grows
          </h1>
          <p className="mx-auto mt-5 max-w-2xl animate-fade-up text-sm leading-relaxed text-muted-foreground sm:text-base" style={{ animationDelay: '120ms' }}>
            A complete digital learning ecosystem for junior &amp; senior secondary students, with specialist support for ASD and
            ADHD learners — live classes, tutoring, assignments and real progress, in one calm place.
          </p>

          <div className="mx-auto mt-8 flex max-w-3xl animate-fade-up flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-2xl border border-border bg-white/70 px-6 py-4 backdrop-blur" style={{ animationDelay: '180ms' }}>
            {[
              { value: '12,000+', label: 'Students' },
              { value: '850+', label: 'Certified Teachers' },
              { value: '98%', label: 'Parent Satisfaction' },
              { value: 'ASD · ADHD', label: 'Specialist Support' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">{stat.value}</p>
                <p className="text-[10px] font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard picker */}
      <section id="dashboards" className="scroll-mt-20 px-4 pb-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Choose Your Dashboard</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">Five distinct experiences, each built for a different learner.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {landingRoles.map((role, index) => {
              const config = roleConfigs[role]
              const target = `/login?next=${encodeURIComponent(config.home)}&role=${role}`
              return (
                <Link
                  key={role}
                  to={target}
                  className="group flex animate-fade-up flex-col rounded-3xl border border-border bg-card p-5 text-left shadow-[0_1px_2px_rgba(26,21,53,0.03)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-30px_rgba(26,21,53,0.35)]"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <span
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: config.soft }}
                    aria-hidden
                  >
                    {config.emoji}
                  </span>
                  <p className="text-sm font-extrabold text-foreground">{config.marketing.title}</p>
                  <p className="mt-0.5 text-[11px] font-semibold" style={{ color: config.accent }}>
                    {config.marketing.level}
                  </p>
                  <p className="mt-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">{config.marketing.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {config.marketing.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                        style={{ background: config.soft, color: config.ink }}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div
                    className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold transition-all group-hover:text-white"
                    style={{ background: config.soft, color: config.ink }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = config.accent
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = config.soft
                    }}
                  >
                    Sign in <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <span>New here?</span>
            <Link
              to="/signup?role=parent"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              Create a parent account <ArrowRight size={12} />
            </Link>
            <Link
              to="/signup?role=teacher"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              Apply to teach <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="scroll-mt-20 px-4 pb-16 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#f3eeff_0%,#eaf6ff_55%,#fff4e8_100%)] p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/50 blur-2xl" />
          <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold text-primary">
                <Heart size={11} /> Our Mission
              </div>
              <h2 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                Inclusive education for all — not as an add-on, but as the foundation.
              </h2>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                NeuroBloom LearningSphere combines general classroom education, premium private tutoring, and specialised
                developmental learning for autistic and ADHD students. Every screen is designed to be calm, clear and
                accessible, so every learner can take part with confidence.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { icon: ShieldCheck, label: 'Verified teachers & safe messaging' },
                  { icon: Users, label: 'Parent–teacher–specialist collaboration' },
                  { icon: Star, label: 'Rewards that build confidence' },
                ].map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-semibold text-foreground">
                    <item.icon size={12} className="text-primary" /> {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '🧩', label: 'Specialist support', tone: '#eef2ff' },
                { emoji: '💡', label: 'Personalised paths', tone: '#fffbeb' },
                { emoji: '❤️', label: 'Emotional growth', tone: '#fdf2f8' },
                { emoji: '🌍', label: 'Learn from anywhere', tone: '#ecfdf5' },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl bg-white/75 p-4 text-center shadow-sm backdrop-blur">
                  <span className="text-2xl" aria-hidden>
                    {card.emoji}
                  </span>
                  <p className="mt-1.5 text-[10px] font-bold text-foreground">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="scroll-mt-20 px-4 pb-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Simple, flexible plans</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">Start with everyday learning, upgrade when your child is ready for more.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-3xl border bg-card p-6',
                  plan.popular ? 'border-primary/30 shadow-[0_24px_60px_-36px_rgba(108,63,197,0.5)]' : 'border-border',
                )}
              >
                {plan.popular ? (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-primary px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                ) : null}
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: plan.accent }} />
                  <p className="text-sm font-extrabold text-foreground">{plan.name}</p>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{plan.tagline}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-2xl font-extrabold tracking-tight text-foreground">{naira(plan.price)}</span>
                  <span className="pb-1 text-[10px] text-muted-foreground">/ month</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                      <Check size={12} className="mt-0.5 shrink-0" style={{ color: plan.accent }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/parent/subscriptions"
                  className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white transition hover:opacity-90"
                  style={{ background: plan.accent }}
                >
                  <PlayCircle size={13} /> Explore this plan
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm" aria-hidden>
                👨‍👩‍👧
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold text-foreground">{parentAccessAddon.name}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
                    Premium only
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
                  {parentAccessAddon.tagline} A second guardian gets the full parent dashboard, weekly progress digests,
                  teacher chat and downloadable term reports.
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-amber-900">
                  Only available to parents on the Premium, Premium Plus or Special Needs Premium plan.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <p className="text-xl font-extrabold text-foreground">
                {naira(parentAccessAddon.price)}
                <span className="text-[10px] font-semibold text-muted-foreground"> /month</span>
              </p>
              <Link
                to={`/login?next=${encodeURIComponent('/parent/billing')}&role=parent`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-amber-800"
              >
                Sign in to add <ArrowRight size={13} />
              </Link>
              <Link
                to="/parent-access/register"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 hover:underline"
              >
                New subscriber? Register for Parent Access <ArrowRight size={11} />
              </Link>
            </div>
          </div>
          <p className="mt-5 text-center text-[10px] text-muted-foreground">
            Prices are demo values in Naira. School partnerships and scholarships are available.
          </p>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm">🌱</div>
            <div>
              <p className="text-xs font-extrabold text-primary">NeuroBloom LearningSphere</p>
              <p className="text-[9px] text-muted-foreground">Inclusive by design · Safe by default</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-medium text-muted-foreground">
            <a href="#dashboards" className="inline-flex items-center py-2 hover:text-foreground">Dashboards</a>
            <a href="#plans" className="inline-flex items-center py-2 hover:text-foreground">Plans</a>
            <a href="#mission" className="inline-flex items-center py-2 hover:text-foreground">About</a>
            {configured ? (
              signedIn ? (
                <button type="button" onClick={() => void signOut()} className="inline-flex items-center py-2 hover:text-foreground">
                  Sign out
                </button>
              ) : (
                <Link to="/login" className="inline-flex items-center py-2 hover:text-foreground">Sign in</Link>
              )
            ) : (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY)
                  window.location.reload()
                }}
                className="inline-flex items-center py-2 hover:text-foreground"
              >
                Reset demo data
              </button>
            )}
            <span>© {new Date().getFullYear()} NeuroBloom</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
