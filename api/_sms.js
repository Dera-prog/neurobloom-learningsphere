export function smsProvider() {
  return process.env.TERMII_API_KEY ? 'termii' : null
}

export function smsConfigured() {
  return smsProvider() !== null
}

// Termii expects international format; guardians type local numbers like 0803….
export function normalizePhone(value) {
  const digits = String(value ?? '').replace(/[^0-9]/g, '')
  if (!digits) return ''
  if (digits.startsWith('234')) return digits
  if (digits.startsWith('0')) return `234${digits.slice(1)}`
  if (digits.length === 10) return `234${digits}`
  return digits
}

export async function sendSms({ to, text }) {
  const provider = smsProvider()
  if (!provider) return { delivered: false, provider: null, error: 'sms_not_configured' }
  const recipient = normalizePhone(to)
  if (!recipient) return { delivered: false, provider, error: 'invalid_recipient' }

  const base = (process.env.TERMII_BASE_URL || 'https://api.ng.termii.com').replace(/\/$/, '')
  try {
    const response = await fetch(`${base}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        to: recipient,
        from: process.env.TERMII_SENDER_ID || 'NeuroBloom',
        sms: String(text ?? '').slice(0, 320),
        type: 'plain',
        channel: process.env.TERMII_CHANNEL || 'generic',
      }),
    })
    const payload = await response.json().catch(() => ({}))
    const ok = response.ok && (payload.code === 'ok' || Boolean(payload.message_id))
    return {
      delivered: ok,
      provider,
      id: payload.message_id ?? null,
      error: ok ? null : String(payload.message || payload.code || response.status).slice(0, 200),
    }
  } catch (error) {
    return { delivered: false, provider, error: String(error?.message || 'network error').slice(0, 200) }
  }
}
