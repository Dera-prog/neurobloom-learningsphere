import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9][0-9\s()-]{6,19}$/
const CODE_TTL_MS = 10 * 60 * 1000
const RATE_WINDOW_MS = 10 * 60 * 1000
const MAX_SENDS = 3
const MAX_ATTEMPTS = 8

const sends = new Map()
const attempts = new Map()

function clean(value, max = 300) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function escapeHtml(value) {
  return clean(value, 200)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeContact(raw) {
  const value = clean(raw, 200)
  if (EMAIL_RE.test(value)) return { kind: 'email', value: value.toLowerCase() }
  if (PHONE_RE.test(value)) return { kind: 'phone', value: value.replace(/[^0-9]/g, '') }
  return null
}

function otpSecret() {
  return process.env.GUARDIAN_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function sign(value) {
  return createHmac('sha256', otpSecret()).update(value).digest('hex')
}

function sameSignature(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  return left.length === right.length && timingSafeEqual(left, right)
}

function makeToken(contact, expires, code) {
  const payload = Buffer.from(JSON.stringify({ c: contact, x: expires })).toString('base64url')
  return `${payload}.${sign(`${contact}:${expires}:${code}`)}`
}

function readToken(token) {
  const [payload, signature] = String(token ?? '').split('.')
  if (!payload || !signature) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data.c !== 'string' || typeof data.x !== 'number') return null
    return { contact: data.c, expires: data.x, signature }
  } catch {
    return null
  }
}

function overRateLimit(key, store, max) {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    store.set(key, { start: now, count: 1 })
    return false
  }
  entry.count += 1
  return entry.count > max
}

function prune(store) {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.start > RATE_WINDOW_MS) store.delete(key)
  }
}

function codeEmail(learnerName, code) {
  const learner = escapeHtml(learnerName) || 'Your child'
  return {
    subject: `NeuroBloom guardian code: ${code}`,
    text: [
      `${learner} is creating a NeuroBloom LearningSphere account and named you as their parent or guardian.`,
      '',
      `Verification code: ${code}`,
      '',
      'Share this code with them to finish sign-up. It expires in 10 minutes.',
      'If you did not expect this, ignore this email — no account is created without the code.',
    ].join('\n'),
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f8f7ff;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;padding:28px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ece9f8;border-radius:16px;overflow:hidden">
          <tr><td style="background:#6c3fc5;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:800">🌱 NeuroBloom LearningSphere</td></tr>
          <tr><td style="padding:26px 24px 10px">
            <h1 style="margin:0 0 8px;color:#1a1535;font-size:20px;line-height:1.3">Parent/guardian verification</h1>
            <p style="margin:0 0 18px;color:#6b6880;font-size:13px;line-height:1.6">${learner} is creating a NeuroBloom account and named you as their parent or guardian. Share this code with them to finish sign-up.</p>
            <p style="margin:0 0 6px;color:#6b6880;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700">Verification code</p>
            <p style="margin:0 0 18px;color:#1a1535;font-size:34px;letter-spacing:0.28em;font-weight:800">${code}</p>
            <p style="margin:0;color:#6b6880;font-size:12px;line-height:1.6">The code expires in 10 minutes. If you did not expect this, ignore this email — no account is created without the code.</p>
          </td></tr>
        </table>
        <p style="margin:14px 0 0;color:#9a97ad;font-size:10px">© ${new Date().getFullYear()} NeuroBloom LearningSphere</p>
      </td></tr>
    </table>
  </body>
</html>`,
  }
}

async function sendEmail({ recipient, learnerName, code }) {
  const mailgunKey = process.env.MAILGUN_API_KEY || ''
  const mailgunDomain = process.env.MAILGUN_DOMAIN || ''
  if (!mailgunKey || !mailgunDomain) return { delivered: false }

  const message = codeEmail(learnerName, code)
  const form = new URLSearchParams()
  form.set('from', process.env.MAILGUN_FROM || `NeuroBloom <noreply@${mailgunDomain}>`)
  form.set('to', recipient)
  form.set('subject', message.subject)
  form.set('text', message.text)
  form.set('html', message.html)
  if (process.env.MAILGUN_REPLY_TO) form.set('h:Reply-To', process.env.MAILGUN_REPLY_TO)

  const base = process.env.MAILGUN_BASE_URL || `https://api.mailgun.net/v3/${mailgunDomain}/messages`
  try {
    const response = await fetch(base, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${mailgunKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
    return { delivered: response.ok }
  } catch {
    return { delivered: false }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed', message: 'Use POST for this endpoint.' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'invalid_json', message: 'Send a JSON body.' })
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'invalid_body', message: 'Send a JSON body.' })
  }

  if (!otpSecret()) {
    return res.status(500).json({
      error: 'server_not_configured',
      message: 'The OTP service is missing its signing key.',
    })
  }

  prune(sends)
  prune(attempts)

  const action = clean(body.action, 10)

  if (action === 'send') {
    const contact = normalizeContact(body.contact)
    if (!contact) {
      return res.status(400).json({
        error: 'invalid_contact',
        message: 'Enter a valid phone number or email address for the parent or guardian.',
      })
    }
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    if (overRateLimit(`${forwarded}:${contact.value}`, sends, MAX_SENDS)) {
      return res.status(429).json({
        error: 'rate_limited',
        message: 'A code was just sent to that contact. Wait a few minutes before requesting another.',
      })
    }

    const code = String(randomInt(0, 1000000)).padStart(6, '0')
    const expires = Date.now() + CODE_TTL_MS
    const token = makeToken(contact.value, expires, code)

    const mailgunConfigured = Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN)
    const delivery =
      contact.kind === 'email'
        ? await sendEmail({ recipient: contact.value, learnerName: body.learnerName, code })
        : { delivered: false }

    // Once a real sender is connected, a failed send must never fall back to
    // showing the code in the response.
    if (contact.kind === 'email' && mailgunConfigured && !delivery.delivered) {
      return res.status(502).json({
        error: 'send_failed',
        message: 'We could not send the code. Try again in a moment.',
      })
    }

    // With no sender configured, the demonstration carries on with the code in
    // the response so the flow can be reviewed.
    const review = !delivery.delivered
    return res.status(200).json({
      ok: true,
      sent: delivery.delivered,
      review,
      token,
      expiresAt: new Date(expires).toISOString(),
      ...(review ? { code } : {}),
      message: delivery.delivered
        ? `Code sent to ${contact.value}.`
        : 'No email or SMS provider is connected yet, so nothing was sent.',
    })
  }

  if (action === 'verify') {
    const token = readToken(body.token)
    if (!token) {
      return res.status(400).json({ error: 'invalid_token', message: 'Request a new code and try again.' })
    }
    if (Date.now() > token.expires) {
      return res.status(410).json({ error: 'expired', message: 'That code expired. Send a new one.' })
    }
    if (overRateLimit(token.signature.slice(0, 32), attempts, MAX_ATTEMPTS)) {
      return res.status(429).json({ error: 'rate_limited', message: 'Too many tries. Request a new code.' })
    }

    const code = clean(body.code, 6)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'invalid_code', message: 'Enter the 6-digit code.' })
    }
    const expected = sign(`${token.contact}:${token.expires}:${code}`)
    if (!sameSignature(expected, token.signature)) {
      return res.status(400).json({ error: 'invalid_code', message: 'That code is not right. Check it and try again.' })
    }

    return res.status(200).json({ ok: true, verified: true, contact: token.contact })
  }

  return res.status(400).json({ error: 'invalid_action', message: 'Unknown OTP action.' })
}
