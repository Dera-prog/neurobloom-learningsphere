import { isSupabaseConfigured, supabase } from './supabase'

export type EmailKind = 'plan' | 'booking' | 'support'

export interface EmailResult {
  ok: boolean
  sent: boolean
  message: string
}

export function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export async function sendConfirmationEmail(
  kind: EmailKind,
  recipient: string,
  data: Record<string, string | number>,
): Promise<EmailResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, sent: false, message: 'Demo mode: confirmation emails are not connected yet.' }
  }
  if (!looksLikeEmail(recipient)) {
    return { ok: false, sent: false, message: 'Enter a valid email address for the confirmation.' }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) {
    return { ok: false, sent: false, message: 'Sign in again to send confirmation emails.' }
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kind, recipient: recipient.trim(), data }),
    })
    const body = (await response.json().catch(() => ({}))) as {
      message?: string
      skipped?: boolean
    }

    if (!response.ok) {
      return { ok: false, sent: false, message: body.message ?? 'The confirmation email could not be sent.' }
    }
    if (body.skipped) {
      return { ok: true, sent: false, message: body.message ?? 'Saved — email delivery is not connected yet.' }
    }
    return { ok: true, sent: true, message: body.message ?? `Confirmation sent to ${recipient.trim()}.` }
  } catch {
    return { ok: false, sent: false, message: 'Network error — the confirmation email was not sent.' }
  }
}
