import { createContext, useContext, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

// Role colour tokens live on the layout wrapper, but modals portal to <body>,
// so the active role is carried through context instead.
export const RoleThemeContext = createContext<string | null>(null)
// Junior has a switchable theme mode; dialogs need the same attribute to inherit it.
export const ThemeModeContext = createContext<string | null>(null)

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(26,21,53,0.03)]',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(26,21,53,0.3)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionCard({
  title,
  subtitle,
  action,
  icon: Icon,
  children,
  className,
  bodyClassName,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: LucideIcon
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={17} className="text-role" aria-hidden /> : null}
          <div>
            <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </Card>
  )
}

/* --------------------------------- Button --------------------------------- */

type Variant = 'primary' | 'role' | 'soft' | 'outline' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export function buttonStyles(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  const variants: Record<Variant, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
    role: 'bg-role text-white hover:opacity-90 shadow-sm',
    soft: 'bg-role-soft text-role-ink hover:bg-role/10',
    outline: 'border border-border bg-card text-foreground hover:bg-muted',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    danger: 'bg-destructive/10 text-destructive hover:bg-destructive/15',
    dark: 'bg-[#1a1535] text-white hover:bg-[#2a2350]',
  }
  const sizes: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-10 px-4 text-sm gap-2 rounded-xl',
    lg: 'h-12 px-6 text-sm gap-2 rounded-xl',
    icon: 'h-9 w-9 rounded-xl',
  }
  return cn(
    'inline-flex select-none items-center justify-center font-semibold transition-all disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button type={type} className={buttonStyles(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

/* --------------------------------- Badges --------------------------------- */

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'primary' | 'role' | 'success' | 'warn' | 'danger' | 'sky' | 'purple' | 'pink'
  className?: string
}) {
  const tones = {
    neutral: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    role: 'bg-role-soft text-role-ink',
    success: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
    purple: 'bg-violet-50 text-violet-700',
    pink: 'bg-pink-50 text-pink-700',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* -------------------------------- Progress -------------------------------- */

export function ProgressBar({
  value,
  color = 'var(--role-accent)',
  className,
  height = 'h-1.5',
  label,
}: {
  value: number
  color?: string
  className?: string
  height?: string
  label?: string
}) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-muted', height, className)}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out')}
        style={{ width: `${safe}%`, background: color }}
      />
    </div>
  )
}

export function Ring({
  value,
  size = 112,
  stroke = 10,
  color = 'var(--role-accent)',
  track = '#efeaf9',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

/* --------------------------------- Avatar ---------------------------------- */

export function Avatar({
  emoji,
  initials,
  color = 'var(--role-accent)',
  soft,
  size = 'md',
  ring = false,
}: {
  emoji?: string
  initials?: string
  color?: string
  soft?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
}) {
  const sizes = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-xl',
    xl: 'h-16 w-16 text-3xl',
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        sizes[size],
        ring && 'ring-2 ring-white',
      )}
      style={{ background: soft ?? 'color-mix(in srgb, var(--role-accent) 12%, white)', color }}
      aria-hidden
    >
      {emoji ?? initials}
    </div>
  )
}

/* ---------------------------------- Stat ---------------------------------- */

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'var(--role-accent)',
  soft = 'var(--role-soft)',
  trend,
  onClick,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon: LucideIcon
  color?: string
  soft?: string
  trend?: { value: string; up?: boolean }
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 text-left shadow-[0_1px_2px_rgba(26,21,53,0.03)]',
        onClick && 'transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(26,21,53,0.3)]',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: soft, color }}>
          <Icon size={17} aria-hidden />
        </span>
      </div>
      <p className="text-[26px] font-extrabold leading-none tracking-tight text-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        {trend ? (
          <span className={cn('font-semibold', trend.up === false ? 'text-rose-600' : 'text-emerald-600')}>
            {trend.up === false ? '↓' : '↑'} {trend.value}
          </span>
        ) : null}
        {sub ? <span className="text-muted-foreground">{sub}</span> : null}
      </div>
    </Tag>
  )
}

/* ---------------------------------- Tabs ---------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (index === -1) return
    event.preventDefault()
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length
    if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = buttons.length - 1
    buttons[next]?.focus()
    const nextTab = tabs[next]
    if (nextTab) onChange(nextTab.id)
  }

  return (
    <div
      ref={listRef}
      onKeyDown={onKeyDown}
      className={cn('inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl bg-muted p-1', className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all',
              active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px]',
                  active ? 'bg-role-soft text-role-ink' : 'bg-black/5 text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/* --------------------------------- Inputs --------------------------------- */

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="h-9 w-full rounded-lg border border-border bg-input/60 pl-9 pr-3 text-xs text-foreground outline-none transition focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
      />
    </div>
  )
}

export function Input({
  label,
  hint,
  className,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block text-left">
      {label ? <span className="mb-1.5 block text-xs font-semibold text-foreground">{label}</span> : null}
      <input
        id={id}
        className={cn(
          'h-10 w-full rounded-xl border border-border bg-input/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10',
          className,
        )}
        {...props}
      />
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export function TextArea({
  label,
  hint,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <label className="block text-left">
      {label ? <span className="mb-1.5 block text-xs font-semibold text-foreground">{label}</span> : null}
      <textarea
        className={cn(
          'w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10',
          className,
        )}
        {...props}
      />
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export function Select({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block text-left">
      {label ? <span className="mb-1.5 block text-xs font-semibold text-foreground">{label}</span> : null}
      <span className="relative block">
        <select
          className={cn(
            'h-10 w-full appearance-none rounded-xl border border-border bg-input/60 pl-3 pr-9 text-sm text-foreground outline-none transition focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </span>
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: () => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={cn(
          // The visible track stays compact; the pseudo-element widens the hit
          // area to a 44px tall target without shifting the layout.
          'relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors before:absolute before:-inset-x-1 before:-inset-y-2 before:content-[""]',
          checked ? 'bg-role' : 'bg-[#d9d5e8]',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}

/* --------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  tone = 'default',
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'default' | 'calm'
}) {
  const role = useContext(RoleThemeContext)
  const theme = useContext(ThemeModeContext)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    panel?.focus()
    // The dialog portals to <body>, so the app root can be made inert without
    // trapping the dialog itself.
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const focusable = [...panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((el) => el.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      root?.removeAttribute('inert')
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [open])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return createPortal(
    <div
      data-role={role ?? undefined}
      data-theme={theme ?? undefined}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
    >
      <div className="absolute inset-0 bg-[#1a1535]/45 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl outline-none animate-pop sm:rounded-3xl',
          sizes[size],
          tone === 'calm' && 'bg-[linear-gradient(180deg,#ffffff,#f7fbff)]',
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-border bg-card px-5 py-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

/* --------------------------------- Header --------------------------------- */

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  children,
  sticky = true,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  sticky?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-b border-[color:var(--shell-border)] bg-[var(--shell-surface)] px-4 py-4 backdrop-blur-md sm:px-6',
        sticky && 'sticky top-0 z-20',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="min-w-0 text-xl font-extrabold tracking-tight text-[color:var(--shell-fg)] sm:text-[22px]">{title}</h1>
            {badge}
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-[color:var(--shell-muted)]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="hidden flex-wrap items-center gap-2 lg:flex">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}

export function EmptyState({
  emoji = '🌱',
  title,
  description,
  action,
}: {
  emoji?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span className="mb-3 text-3xl" aria-hidden>
        {emoji}
      </span>
      <p className="text-sm font-bold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-border', className)} />
}
