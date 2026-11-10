import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { buttonStyles } from '../components/ui'
import { verifyPayment, clearParentAccessIntent, readParentAccessIntent } from '../lib/payments'

export function PaymentCallbackPage() {
  const [params] = useSearchParams()
  const reference = params.get('reference') ?? params.get('trxref') ?? ''
  const [status, setStatus] = useState<'checking' | 'failed'>('checking')
  const [message, setMessage] = useState('Confirming your payment with Paystack…')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (!reference) {
      setStatus('failed')
      setMessage('Paystack did not send a payment reference. If money left your account, contact support with your receipt.')
      return
    }

    void verifyPayment(reference).then((result) => {
      if (result.ok && result.planId) {
        // Full reload so the app hydrates the plan the server just wrote.
        const child = result.childId ? `&child=${encodeURIComponent(result.childId)}` : ''
        const intent = readParentAccessIntent()
        if (result.planId === 'parent_access') {
          clearParentAccessIntent()
          window.location.replace(`/parent/access?paid=parent_access${child}`)
          return
        }
        // A Parent Access signup pays for the plan first; come straight back to
        // the add-on step instead of dropping the guardian on the plan list.
        if (intent && intent.planId === result.planId && intent.childId === result.childId) {
          window.location.replace(`/parent/access?register=access${child}`)
          return
        }
        const destination = `/parent/subscriptions?paid=${encodeURIComponent(result.planId)}${child}`
        window.location.replace(destination)
        return
      }
      setStatus('failed')
      setMessage(result.message)
    })
  }, [reference])

  if (status === 'failed') {
    return (
      <main id="main-content" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle size={22} />
        </span>
        <h1 className="text-lg font-extrabold text-foreground">Payment not confirmed</h1>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{message}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/parent/subscriptions" className={buttonStyles('primary', 'md')}>
            <ArrowLeft size={15} /> Back to subscriptions
          </Link>
          <Link to="/parent/support" className={buttonStyles('outline', 'md')}>
            Contact support
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary text-xl text-white">
        <CheckCircle2 size={22} />
      </span>
      <p className="text-sm font-semibold text-foreground">Confirming your payment…</p>
      <p className="max-w-xs text-[11px] text-muted-foreground">{message}</p>
    </div>
  )
}
