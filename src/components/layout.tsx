import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Bell,
  Check,
  ChevronRight,
  Flame,
  HeartHandshake,
  LifeBuoy,
  LogOut,
  Menu,
  Paintbrush,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { roleConfigs, type RoleConfig } from '../config/roles'
import type { Audience } from '../data/content'
import { notificationsByRole, earningsMonths } from '../data/content'
import { useApp } from '../store/store'
import { cn, daysUntil, initials, nextWaecDate, naira } from '../lib/utils'
import { useAuth } from '../lib/auth'
import { addComplaint, COMPLAINT_CATEGORIES } from '../lib/complaints'
import { useToast } from './toast'
import { SpecialTools } from './focus'
import { Avatar, Badge, RoleThemeContext, ThemeModeContext } from './ui'

/* -------------------------------- Sidebar --------------------------------- */

const thisMonthEarnings = earningsMonths[earningsMonths.length - 1]
const lastMonthEarnings = earningsMonths[earningsMonths.length - 2]
const monthGrowth = lastMonthEarnings?.value
  ? Math.round(((thisMonthEarnings.value - lastMonthEarnings.value) / lastMonthEarnings.value) * 100)
  : 0

function SidebarFooter({ config }: { config: RoleConfig }) {
  const { state } = useApp()
  const waecDays = daysUntil(nextWaecDate())
  const solid = config.sidebar === 'solid' || state.preferences.themeMode !== 'classic'

  if (config.footer === 'streak') {
    return (
      <div className="rounded-xl bg-white/10 p-3 text-center">
        <div className="mb-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white">
          <Flame size={15} className="text-orange-300" /> {state.points > 0 ? '7 Day Streak!' : 'Start a streak'}
        </div>
        <p className="text-[11px] text-white/60">Keep it up! 🎉</p>
      </div>
    )
  }

  if (config.footer === 'special') {
    return <SpecialTools solid={solid} />
  }

  if (config.footer === 'waec') {
    return (
      <div className="rounded-2xl border border-border bg-role-soft p-3.5">
        <div className="flex items-center gap-1.5 text-role-ink">
          <Trophy size={14} />
          <span className="text-[11px] font-bold">WAEC countdown</span>
        </div>
        <p className="mt-1 text-lg font-extrabold text-foreground">{waecDays} days</p>
        <p className="text-[10px] text-muted-foreground">Small steps every day.</p>
      </div>
    )
  }

  if (config.footer === 'earnings') {
    return (
      <div className="rounded-2xl border border-border bg-role-soft p-3.5">
        <div className="flex items-center gap-1.5 text-role-ink">
          <Wallet size={14} />
          <span className="text-[11px] font-bold">This month</span>
        </div>
        <p className="mt-1 text-lg font-extrabold text-foreground">{naira(thisMonthEarnings.value * 1000)}</p>
        <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
          <TrendingUp size={11} /> +{monthGrowth}% vs last month
        </p>
      </div>
    )
  }

  if (config.footer === 'ops') {
    return (
      <div className="rounded-xl bg-white/10 p-3">
        <div className="flex items-center gap-1.5 text-white">
          <ShieldCheck size={14} className="text-emerald-300" />
          <span className="text-[11px] font-bold">All systems normal</span>
        </div>
        <p className="mt-1 text-lg font-extrabold text-white">99.98%</p>
        <p className="text-[10px] text-white/60">Uptime · last 30 days</p>
      </div>
    )
  }

  return (
    <Link to="/parent/support" className="block rounded-2xl border border-border bg-role-soft p-3.5 transition hover:shadow-sm">
      <div className="flex items-center gap-1.5 text-role-ink">
        <HeartHandshake size={14} />
        <span className="text-[11px] font-bold">Chidi’s ASD plan is active</span>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
        Special Needs Premium · view goals and specialist notes.
      </p>
    </Link>
  )
}

type ThemeMode = 'classic' | 'teal'

// Saved preferences from older builds may still say "burnt" or "forest";
// anything that is not light mode falls back to the dark-teal shell.
export function resolveThemeMode(mode: string): ThemeMode {
  return mode === 'classic' ? 'classic' : 'teal'
}

type ThemeOption = { value: ThemeMode; label: string; swatch: string; aria: string }

// The senior portal's dark mode is navy, not the teal used everywhere else, so
// its second swatch and label follow the role.
function themeOptionsFor(role?: Audience): ThemeOption[] {
  const dark =
    role === 'senior'
      ? { label: 'Navy', swatch: '#052d44', aria: 'Dark navy theme' }
      : role === 'admin'
        ? { label: 'Grey', swatch: '#1f2937', aria: 'Dark grey theme' }
        : role === 'junior'
          ? { label: 'Burnt', swatch: '#8a4403', aria: 'Burnt orange theme' }
          : role === 'teacher'
            ? { label: 'Green', swatch: '#045c3f', aria: 'Dark green theme' }
            : { label: 'Teal', swatch: '#053e2f', aria: 'Dark teal theme' }
  return [
    { value: 'classic', label: 'Light', swatch: '#e5e7eb', aria: 'Light theme' },
    { value: 'teal', ...dark },
  ]
}

function ThemeToggle({ solid, role }: { solid: boolean; role: Audience }) {
  const { state, dispatch } = useApp()
  const theme = resolveThemeMode(state.preferences.themeMode)
  const options = themeOptionsFor(role)

  return (
    <div className={cn('rounded-xl p-2', solid ? 'bg-white/10' : 'border border-border bg-muted/60')}>
      <div
        className={cn(
          'mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.08em]',
          solid ? 'text-white/60' : 'text-muted-foreground',
        )}
      >
        <Paintbrush size={11} aria-hidden /> Theme
      </div>
      <div
        role="group"
        aria-label="Dashboard theme"
        className={cn('grid grid-cols-2 gap-1 rounded-lg p-1', solid ? 'bg-black/15' : 'bg-card')}
      >
        {options.map((option) => {
          const active = theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              aria-label={option.aria}
              onClick={() => dispatch({ type: 'SET_PREF', key: 'themeMode', value: option.value })}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition',
                active
                  ? solid
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-primary text-primary-foreground shadow-sm'
                  : solid
                    ? 'text-white/70 hover:bg-white/10 hover:text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: option.swatch, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.14)' }}
                aria-hidden
              />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TeacherComplaintBox({ solid }: { solid: boolean }) {
  const toast = useToast()
  const { profile } = useAuth()
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0])
  const [sent, setSent] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = message.trim()
    if (!text) return
    addComplaint({
      message: text,
      category,
      requester: profile?.full_name || 'Dr. Kelechi Azu',
    })
    setMessage('')
    setSent(true)
    toast('Complaint sent', {
      description: 'The Admin Manager team has it in Help & support and will reply within one working day.',
      tone: 'success',
    })
  }

  return (
    <form
      onSubmit={submit}
      className={cn('rounded-xl p-3', solid ? 'bg-white/10' : 'border border-border bg-muted/50')}
      aria-label="Send a complaint to the admin team"
    >
      <div className={cn('flex items-center gap-1.5 text-[11px] font-bold', solid ? 'text-white' : 'text-foreground')}>
        <LifeBuoy size={13} aria-hidden /> Send a complaint
      </div>
      <p className={cn('mt-0.5 text-[10px] leading-relaxed', solid ? 'text-white/60' : 'text-muted-foreground')}>
        Tell the Admin Manager team what isn’t working.
      </p>
      <textarea
        value={message}
        onChange={(event) => {
          setMessage(event.target.value)
          setSent(false)
        }}
        rows={2}
        placeholder="Type your complaint…"
        aria-label="Complaint details"
        className={cn(
          'mt-2 w-full resize-none rounded-lg border px-2 py-1.5 text-[11px] leading-relaxed outline-none transition',
          solid
            ? 'border-white/20 bg-white/10 text-white placeholder:text-white/45 focus:border-white/50'
            : 'border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-role',
        )}
      />
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Complaint category"
        className={cn(
          'mt-1.5 h-7 w-full rounded-lg border px-1.5 text-[10px] font-semibold outline-none transition',
          solid
            ? 'border-white/20 bg-white/10 text-white focus:border-white/50'
            : 'border-border bg-card text-foreground focus:border-role',
        )}
      >
        {COMPLAINT_CATEGORIES.map((option) => (
          <option key={option} value={option} className="text-foreground">
            {option}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!message.trim()}
        className={cn(
          'mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition disabled:pointer-events-none disabled:opacity-50',
          solid ? 'bg-white text-primary hover:bg-white/90' : 'bg-role text-white hover:opacity-90',
        )}
      >
        <Send size={12} aria-hidden /> Send complaint
      </button>
      {sent ? (
        <p className={cn('mt-1.5 text-[10px] font-semibold', solid ? 'text-emerald-200' : 'text-emerald-700')} role="status">
          Sent — thank you. We’ll follow up.
        </p>
      ) : null}
    </form>
  )
}

function SidebarIdentity({
  config,
  name,
  meta,
  solid,
  specialUser,
  chevron,
}: {
  config: RoleConfig
  name: string
  meta: string
  solid: boolean
  specialUser: boolean
  chevron?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl p-3',
        solid ? 'bg-white/10' : 'bg-muted',
        specialUser && 'flex-col bg-[#f0eefb] text-center',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold',
          specialUser ? 'mb-1 h-14 w-14 text-3xl shadow-sm' : 'h-10 w-10 text-lg',
        )}
        style={{ background: config.role === 'junior' ? 'var(--jr-avatar)' : config.user.avatarBg, color: config.user.avatarColor }}
      >
        {config.user.emoji ?? config.user.initials}
      </div>
      <div className={cn('min-w-0 text-center', !specialUser && 'text-left')}>
        <p className={cn('truncate text-sm font-bold', solid ? 'text-white' : 'text-foreground')}>{name}</p>
        <p className={cn('truncate text-[11px]', solid ? 'text-white/60' : 'text-muted-foreground')}>{meta}</p>
        {specialUser ? (
          <div className="mt-1 flex justify-center gap-0.5" aria-label="Four star learner">
            {[0, 1, 2, 3].map((i) => (
              <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
        ) : null}
      </div>
      {chevron ? (
        <ChevronRight size={15} className={cn('ml-auto shrink-0', solid ? 'text-white/50' : 'text-muted-foreground')} aria-hidden />
      ) : null}
    </div>
  )
}

function SidebarContent({ config, onNavigate, onClose }: { config: RoleConfig; onNavigate?: () => void; onClose?: () => void }) {
  const { state, threadsFor } = useApp()
  const { configured, profile } = useAuth()
  const { search } = useLocation()
  const previewSuffix =
    config.role === 'admin' && new URLSearchParams(search).get('preview') === '1' ? '?preview=1' : ''
  const solid = config.sidebar === 'solid' || state.preferences.themeMode !== 'classic'
  const specialUser = config.role === 'special'
  const baseMeta = config.role === 'junior' ? `JSS2 · ${state.points.toLocaleString()} pts` : config.user.meta
  // An administrator can open every portal; those portals keep their own demo
  // identity instead of showing the operator's name on a learner's dashboard.
  const ownProfile = configured && Boolean(profile?.full_name) && profile?.role === config.role
  const name = ownProfile && profile?.full_name ? profile.full_name : config.user.name
  const meta = ownProfile && profile?.email ? profile.email : baseMeta
  const unreadMessages = threadsFor(config.role).reduce((sum, thread) => sum + (thread.unread ?? 0), 0)

  return (
    <>
      <div className={cn('mb-5 flex items-start justify-between px-2', solid ? 'text-white' : '')}>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🌱
            </span>
            <span className={cn('text-[1.05rem] font-extrabold tracking-tight', solid ? 'text-white' : 'text-primary')}>
              NeuroBloom
            </span>
          </div>
          {solid ? (
            <span className="text-[11px] text-white/60">{config.portal}</span>
          ) : (
            <span
              className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: 'var(--role-accent)' }}
            >
              {config.portal}
            </span>
          )}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg lg:hidden',
              solid ? 'text-white/70 hover:bg-white/10' : 'text-muted-foreground hover:bg-muted',
            )}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      {config.role === 'admin' ? (
        <Link
          to={`/admin/profile${previewSuffix}`}
          onClick={onNavigate}          aria-label="Open administrator profile and daily tasks"
          className="mb-4 block rounded-2xl transition hover:ring-1 hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <SidebarIdentity config={config} name={name} meta={meta} solid={solid} specialUser={specialUser} chevron />
        </Link>
      ) : (
        <div className="mb-4">
          <SidebarIdentity config={config} name={name} meta={meta} solid={solid} specialUser={specialUser} />
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto pr-0.5" aria-label={`${config.label} navigation`}>
        {config.nav.map((item) => (
          <NavLink
            key={item.to}
            to={`${item.to}${previewSuffix}`}
            end={item.to === config.home}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'mb-0.5 flex items-center gap-3 rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all lg:py-2',
                solid
                  ? isActive
                    ? 'bg-white font-bold text-primary shadow-sm'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                  : isActive
                    ? 'bg-role-soft font-bold text-role-ink'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={17} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className="truncate">{item.label}</span>
                {item.hint ? (
                  <span
                    className={cn(
                      'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : solid
                          ? 'bg-white/15 text-white/80'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {item.hint}
                  </span>
                ) : null}
                {item.to.endsWith('/messages') && unreadMessages > 0 ? (
                  <span
                    className={cn(
                      'ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                      solid ? 'bg-white text-primary' : 'bg-role text-white',
                    )}
                  >
                    {unreadMessages}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={cn('mt-3 shrink-0 space-y-2 border-t pt-3', solid ? 'border-white/15' : 'border-border/60')}>
        {config.role === 'admin' ? (
          <div className="hidden lg:block">
            <SidebarFooter config={config} />
          </div>
        ) : (
          <SidebarFooter config={config} />
        )}
        {config.role === 'teacher' ? <TeacherComplaintBox solid={solid} /> : null}
        <ThemeToggle solid={solid} role={config.role} />
      </div>
    </>
  )
}

/* ----------------------------- Notifications ------------------------------ */

export function NotificationBell({ role }: { role: Audience }) {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const items = notificationsByRole[role]
  const unread = state.notificationsRead ? 0 : items.length

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="shell-chip relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell size={16} />
        {unread ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white ring-2 ring-background">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-pop">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-foreground">Notifications</p>
            {unread ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'MARK_NOTIFICATIONS_READ' })}
                className="flex items-center gap-1 text-[11px] font-semibold text-role-ink"
              >
                <Check size={12} /> Mark all read
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground">All caught up</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-2.5 border-b border-border/60 px-4 py-3 last:border-0">
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    item.tone === 'warn' ? 'bg-amber-400' : item.tone === 'good' ? 'bg-emerald-400' : 'bg-sky-400',
                  )}
                />
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold text-foreground', !unread && 'opacity-60')}>{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function HeaderActions({ role }: { role: Audience }) {
  const config = roleConfigs[role]
  const { configured, session, profile, signOut } = useAuth()
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const themeOptions = themeOptionsFor(role)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!configured || !session) {
    return (
      <div className="flex items-center gap-2">
        <NotificationBell role={role} />
        <div className="shell-chip hidden h-9 items-center gap-2 rounded-xl border border-border bg-card py-1 pl-1 pr-2.5 sm:flex">
          <Avatar emoji={config.user.emoji} initials={config.user.initials} color={config.user.avatarColor} size="sm" />
          <span className="max-w-28 truncate text-[11px] font-semibold text-inherit">{firstName(config.user.name)}</span>
        </div>
      </div>
    )
  }

  const fullName = profile?.full_name || config.user.name
  const shortName = firstName(fullName)
  const label = initials(fullName) || config.user.initials

  return (
    <div className="flex items-center gap-2">
      <NotificationBell role={role} />
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Account menu for ${fullName}`}
          className="shell-chip flex h-9 items-center gap-2 rounded-xl border border-border bg-card py-1 pl-1 pr-2.5 transition hover:bg-muted"
        >
          <Avatar initials={label} color={config.user.avatarColor} size="sm" />
          <span className="hidden max-w-28 truncate text-[11px] font-semibold text-inherit sm:block">{shortName}</span>
        </button>

        {open ? (
          <div role="menu" className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-pop">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-xs font-bold text-foreground">{fullName}</p>
              <p className="truncate text-[10px] text-muted-foreground">{profile?.email ?? session.user.email}</p>
              <span className="mt-1.5 inline-flex rounded-full bg-role-soft px-2 py-0.5 text-[9px] font-bold text-role-ink">
                {config.label}
              </span>
            </div>
            <div className="border-b border-border px-4 py-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <Paintbrush size={11} aria-hidden /> Theme
              </p>
              <div
                role="group"
                aria-label="Dashboard theme"
                className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
              >
                {themeOptions.map((option) => {
                  const active = option.value === resolveThemeMode(state.preferences.themeMode)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      aria-label={option.aria}
                      onClick={() => dispatch({ type: 'SET_PREF', key: 'themeMode', value: option.value })}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: option.swatch, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.14)' }}
                        aria-hidden
                      />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                void signOut()
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------- RoleLayout ------------------------------- */

export function RoleLayout({ role, children }: { role: Audience; children: ReactNode }) {
  const config = roleConfigs[role]
  const [drawer, setDrawer] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { state } = useApp()

  useEffect(() => {
    setDrawer(false)
  }, [location.pathname])

  useEffect(() => {
    if (!drawer) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    drawerRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawer(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [drawer])

  useEffect(() => {
    const scale = config.role === 'special' ? state.preferences.fontScale : 1
    document.documentElement.style.fontSize = scale === 1 ? '' : `${16 * scale}px`
    return () => {
      document.documentElement.style.fontSize = ''
    }
  }, [config.role, state.preferences.fontScale])

  const sidebarWidth = config.wideSidebar ? 'w-64' : 'w-60'
  const themeMode = resolveThemeMode(state.preferences.themeMode)

  return (
    <ThemeModeContext.Provider value={themeMode}>
    <RoleThemeContext.Provider value={role}>
      <div
        data-role={role}
        data-theme={themeMode ?? undefined}
        className={cn(
          'flex h-dvh overflow-hidden text-foreground',
          state.preferences.reduceMotion && 'reduce-motion',
          state.preferences.highContrast && 'hi-contrast',
        )}
        style={{ background: themeMode !== 'classic' ? 'var(--shell-bg)' : (config.shellBg ?? 'var(--color-background)') }}
      >
      <aside
        className={cn(
          'hidden shrink-0 flex-col py-6 px-4 lg:flex',
          sidebarWidth,
          config.sidebar === 'solid' || themeMode !== 'classic' ? 'bg-primary' : 'border-r border-border bg-card',
        )}
      >
        <SidebarContent config={config} />
      </aside>

      {drawer ? (
        <div id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Dashboard menu" className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-[#1a1535]/45 backdrop-blur-sm animate-fade-in" onClick={() => setDrawer(false)} />
          <div
            ref={drawerRef}
            tabIndex={-1}
            className={cn(
              'absolute left-0 top-0 flex h-full w-[min(18rem,86vw)] flex-col px-4 py-5 shadow-2xl outline-none animate-slide-in',
              config.sidebar === 'solid' || themeMode !== 'classic' ? 'bg-primary' : 'bg-card',
            )}
          >
            <SidebarContent config={config} onNavigate={() => setDrawer(false)} onClose={() => setDrawer(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={cn(
            'flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-md lg:hidden',
            'border-[color:var(--shell-border)] bg-[var(--shell-surface)]',
          )}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="shell-chip flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground"
              aria-label="Open menu"
              aria-expanded={drawer}
              aria-controls="mobile-navigation"
            >
              <Menu size={18} />
            </button>
            <Link to={config.home} className="flex items-center gap-1.5 py-1">
              <span aria-hidden>🌱</span>
              <span className="text-sm font-extrabold text-[color:var(--shell-fg)]">NeuroBloom</span>
            </Link>
          </div>
          <HeaderActions role={role} />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto outline-none" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      </div>
    </RoleThemeContext.Provider>
    </ThemeModeContext.Provider>
  )
}

/* -------------------------------- Helpers -------------------------------- */

function firstName(name: string) {
  return name.replace(/^(Dr|Mr|Mrs|Ms|Miss|Prof)\.?\s+/i, '').split(' ')[0]
}

export function RoleBadge({ role }: { role: Audience }) {
  const config = roleConfigs[role]
  return (
    <Badge tone="role" className="gap-1">
      <span aria-hidden>{config.emoji}</span> {config.label}
    </Badge>
  )
}

export function Price({ value }: { value: number }) {
  return <span className="font-extrabold">{naira(value)}</span>
}

export const IconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  trophy: Trophy,
}
