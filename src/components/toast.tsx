import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastTone = 'success' | 'info' | 'warn'

interface ToastItem {
  id: number
  message: string
  description?: string
  tone: ToastTone
}

type ToastOptions = { description?: string; tone?: ToastTone }

type ToastFn = (message: string, options?: ToastOptions | string) => void

const ToastContext = createContext<ToastFn | null>(null)

const icons = {
  success: CheckCircle2,
  info: Info,
  warn: AlertTriangle,
}

const tones = {
  success: 'text-emerald-600 bg-emerald-50',
  info: 'text-sky-600 bg-sky-50',
  warn: 'text-amber-600 bg-amber-50',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ToastFn>(
    (message, options) => {
      const normalized: ToastOptions = typeof options === 'string' ? { description: options } : (options ?? {})
      counter.current += 1
      const item: ToastItem = {
        id: counter.current,
        message,
        description: normalized.description,
        tone: normalized.tone ?? 'success',
      }
      setToasts((prev) => [...prev.slice(-2), item])
      const timer = setTimeout(() => dismiss(item.id), 4200)
      timers.current.push(timer)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end">
          {toasts.map((t) => {
            const Icon = icons[t.tone]
            return (
              <div
                key={t.id}
                role="status"
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[0_18px_40px_-18px_rgba(26,21,53,0.35)] animate-slide-in"
              >
                <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', tones[t.tone])}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.message}</p>
                  {t.description ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Dismiss notification"
                >
                  <X size={15} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

export function Confetti({ count = 18 }: { count?: number }) {
  const bits = Array.from({ length: count })
  const colors = ['#6c3fc5', '#f97316', '#0ea5e9', '#10b981', '#ec4899', '#f59e0b']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((_, i) => (
        <span
          key={i}
          className="confetti-bit absolute top-1/2 h-2 w-1.5 rounded-sm"
          style={{
            left: `${8 + (i * 84) / count}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.06}s`,
          }}
        />
      ))}
    </div>
  )
}
