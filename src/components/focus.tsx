import { useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BellOff, Moon, Pause, Play, RotateCcw, Sparkles, Timer, Volume2, VolumeX, X } from 'lucide-react'
import { useApp } from '../store/store'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/auth'
import { Button, RoleThemeContext, ThemeModeContext } from './ui'
import { useToast } from './toast'

const durations = [5, 10, 15, 20]

export function SpecialTools({ solid = false }: { solid?: boolean }) {
  const { state, dispatch } = useApp()
  const scale = state.preferences.fontScale
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className={cn('rounded-2xl border p-3', solid ? 'border-white/15 bg-white/10' : 'border-border bg-white')}>
        <div className="mb-2 flex items-center justify-between">
          <span className={cn('text-[11px] font-semibold', solid ? 'text-white/70' : 'text-muted-foreground')}>Text size</span>
          <span className={cn('text-[10px] font-medium', solid ? 'text-white/60' : 'text-muted-foreground')}>{Math.round(scale * 100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PREF', key: 'fontScale', value: Math.max(1, Number((scale - 0.1).toFixed(2))) })}
            className={cn(
              'h-8 flex-1 rounded-lg border text-xs font-bold transition disabled:opacity-40',
              solid ? 'border-white/20 text-white/80 hover:bg-white/10' : 'border-border text-muted-foreground hover:bg-muted',
            )}
            disabled={scale <= 1}
            aria-label="Decrease text size"
          >
            A−
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PREF', key: 'fontScale', value: 1 })}
            className={cn(
              'h-8 flex-1 rounded-lg border text-xs font-bold transition',
              solid ? 'border-white/20 text-white/80 hover:bg-white/10' : 'border-border text-muted-foreground hover:bg-muted',
            )}
            aria-label="Reset text size"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PREF', key: 'fontScale', value: Math.min(1.3, Number((scale + 0.1).toFixed(2))) })}
            className={cn(
              'h-8 flex-1 rounded-lg border text-xs font-bold transition disabled:opacity-40',
              solid ? 'border-white/20 text-white/80 hover:bg-white/10' : 'border-border text-muted-foreground hover:bg-muted',
            )}
            disabled={scale >= 1.3}
            aria-label="Increase text size"
          >
            A+
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition',
          solid ? 'bg-white text-role-ink hover:bg-[#fdf3e6]' : 'bg-role text-white hover:brightness-95',
        )}
      >
        <Moon size={16} /> Focus Mode
      </button>
      <FocusOverlay open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function FocusOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { profile } = useAuth()
  const toast = useToast()
  const role = useContext(RoleThemeContext)
  const theme = useContext(ThemeModeContext)
  const panelRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(10)
  const [left, setLeft] = useState(duration * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [sound, setSound] = useState(false)
  const [started, setStarted] = useState(false)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open) {
      setRunning(false)
      setLeft(duration * 60)
      setFinished(false)
      setStarted(false)
    }
  }, [open, duration])

  useEffect(() => {
    if (!running) return
    interval.current = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          if (interval.current) clearInterval(interval.current)
          setRunning(false)
          setFinished(true)
          dispatch({ type: 'ADD_FOCUS', minutes: duration })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (interval.current) clearInterval(interval.current)
    }
  }, [running, duration, dispatch])

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
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
  }, [open, onClose])

  if (!open) return null

  const firstName = profile?.full_name?.replace(/^(Dr|Mr|Mrs|Ms|Miss|Prof)\.?\s+/i, '').split(' ')[0] || 'Chidi'

  const total = duration * 60
  const progress = ((total - left) / total) * 100
  const mins = Math.floor(left / 60)
  const secs = left % 60
  const r = 96
  const circumference = 2 * Math.PI * r

  const reset = () => {
    setRunning(false)
    setFinished(false)
    setStarted(false)
    setLeft(duration * 60)
  }

  return createPortal(
    <div
      ref={panelRef}
      tabIndex={-1}
      data-role={role ?? undefined}
      data-theme={theme ?? undefined}
      className="fixed inset-0 z-[150] flex flex-col overflow-y-auto bg-[radial-gradient(circle_at_20%_20%,#eef8ff_0%,#f8f2ff_45%,#fdf2f8_100%)] outline-none"
      role="dialog"
      aria-modal="true"
      aria-label="Focus mode"
    >
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2 text-role-ink">
          <Sparkles size={18} />
          <span className="text-sm font-bold">Focus Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSound((s) => !s)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border transition',
              sound
                ? 'border-role bg-white/70 text-role-ink hover:bg-white'
                : 'border-[#f3c9c9] bg-[#fdecec] text-[#c03434] hover:bg-[#fbe0e0]',
            )}
            aria-label={sound ? 'Turn sound off' : 'Turn sound on'}
            aria-pressed={sound}
            title={sound ? 'Turn sound off' : 'Turn sound on'}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 items-center gap-2 rounded-xl border border-role bg-white/70 px-4 text-xs font-semibold text-role-ink transition hover:bg-white"
          >
            <X size={15} /> Leave focus
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-10 text-center">
        {finished ? (
          <div className="animate-pop max-w-md">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white text-5xl shadow-[0_20px_60px_-24px_rgba(168,85,247,0.5)]">
              🌿
            </div>
            <h1 className="text-2xl font-extrabold text-[#3b2a54]">Beautiful focus, {firstName}!</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6b6382]">
              You focused for {duration} minutes. Your body and brain did something wonderful.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                variant="role"
                size="lg"
                onClick={() => {
                  toast('Stretch break started', { description: 'Stand up, breathe, and have some water. 🌿', tone: 'info' })
                  onClose()
                }}
              >
                Take a stretch break
              </Button>
              <Button variant="outline" size="lg" onClick={reset}>
                Another session
              </Button>
            </div>
            <p className="mt-5 text-[11px] text-muted-foreground">You have focused {state.focusMinutes} minutes this week.</p>
          </div>
        ) : (
          <>
            <div className="relative mb-6 flex items-center justify-center">
              <div className={cn('absolute h-64 w-64 rounded-full bg-role-soft blur-2xl', !state.preferences.reduceMotion && 'animate-breathe')} />
              <svg width="240" height="240" className="-rotate-90">
                <circle cx="120" cy="120" r={r} fill="rgba(255,255,255,0.55)" stroke="var(--role-soft)" strokeWidth="12" />
                <circle
                  cx="120"
                  cy="120"
                  r={r}
                  fill="none"
                  stroke="var(--role-accent)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  className="transition-[stroke-dashoffset] duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight text-[#3b2a54]">
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#8b7fa8]">
                  {running ? 'Breathe slowly' : started ? 'Paused' : 'Ready when you are'}
                </span>
              </div>
            </div>

            {!started ? (
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold text-[#6b6382]">How long would you like to focus?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {durations.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => {
                        setDuration(d)
                        setLeft(d * 60)
                      }}
                      className={cn(
                        'rounded-2xl border px-5 py-3 text-sm font-bold transition',
                        duration === d
                          ? 'border-role bg-white text-role-ink shadow-sm'
                          : 'border-[#e6ddf2] bg-white/60 text-[#8b7fa8] hover:bg-white',
                      )}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="role"
                size="lg"
                onClick={() => {
                  setStarted(true)
                  setRunning((r) => !r)
                }}
                className="min-w-40"
              >
                {running ? <Pause size={17} /> : <Play size={17} />}
                {running ? 'Pause' : started ? 'Resume' : 'Start focusing'}
              </Button>
              {started ? (
                <Button variant="outline" size="lg" onClick={reset}>
                  <RotateCcw size={16} /> Reset
                </Button>
              ) : null}
            </div>

            <div className="mt-8 flex max-w-sm items-center gap-2 rounded-2xl border border-[#e6ddf2] bg-white/60 px-4 py-3 text-left text-[11px] leading-relaxed text-[#6b6382]">
              <BellOff size={15} className="shrink-0 text-role" />
              Notifications are paused. If you need a break before the timer ends, you can leave any time — that is okay.
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[#8b7fa8]">
              <Timer size={13} /> {state.focusMinutes} focus minutes this week
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
