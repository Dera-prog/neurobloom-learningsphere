const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailProvider() {
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) return 'mailgun'
  return null
}

export function emailConfigured() {
  return emailProvider() !== null
}

function senderAddress(provider) {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM
  if (provider === 'resend') return 'NeuroBloom <onboarding@resend.dev>'
  return `NeuroBloom <noreply@${process.env.MAILGUN_DOMAIN}>`
}

function replyTo() {
  return process.env.EMAIL_REPLY_TO || process.env.MAILGUN_REPLY_TO || 'support@neurobloom.ng'
}

export async function sendEmail({ to, subject, text, html }) {
  const provider = emailProvider()
  if (!provider) return { delivered: false, provider: null, error: 'email_not_configured' }
  if (!EMAIL_RE.test(String(to ?? ''))) return { delivered: false, provider, error: 'invalid_recipient' }

  const from = senderAddress(provider)
  const reply = replyTo()

  try {
    if (provider === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], subject, text, html, reply_to: reply }),
      })
      const payload = await response.json().catch(() => ({}))
      return {
        delivered: response.ok,
        provider,
        id: payload.id ?? null,
        error: response.ok ? null : String(payload.message || payload.name || response.status).slice(0, 200),
      }
    }

    const domain = process.env.MAILGUN_DOMAIN
    const form = new URLSearchParams()
    form.set('from', from)
    form.set('to', to)
    form.set('subject', subject)
    form.set('text', text)
    form.set('html', html)
    if (reply) form.set('h:Reply-To', reply)

    const base = process.env.MAILGUN_BASE_URL || `https://api.mailgun.net/v3/${domain}/messages`
    const response = await fetch(base, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
    const payload = await response.json().catch(() => ({}))
    return {
      delivered: response.ok,
      provider,
      id: payload.id ?? null,
      error: response.ok ? null : String(payload.message || response.status).slice(0, 200),
    }
  } catch (error) {
    return { delivered: false, provider, error: String(error?.message || 'network error').slice(0, 200) }
  }
}
