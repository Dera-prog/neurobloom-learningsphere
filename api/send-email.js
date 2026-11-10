const ALLOWED_KINDS = new Set(['plan', 'booking', 'support'])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60_000

function clean(value, max = 300) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function escapeHtml(value) {
  return clean(value, 1000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function row(label, value) {
  if (!value) return ''
  return `<tr>
    <td style="padding:8px 0;color:#6b6880;font-size:13px;width:38%;vertical-align:top">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#1a1535;font-size:13px;font-weight:700">${escapeHtml(value)}</td>
  </tr>`
}

function emailLayout(heading, intro, rows, footer) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f8f7ff;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;padding:28px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ece9f8;border-radius:16px;overflow:hidden">
            <tr>
              <td style="background:#6c3fc5;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:800">
                🌱 NeuroBloom LearningSphere
              </td>
            </tr>
            <tr>
              <td style="padding:26px 24px 8px">
                <h1 style="margin:0 0 8px;color:#1a1535;font-size:20px;line-height:1.3">${escapeHtml(heading)}</h1>
                <p style="margin:0 0 16px;color:#6b6880;font-size:13px;line-height:1.6">${escapeHtml(intro)}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f0eefb;border-bottom:1px solid #f0eefb">
                  ${rows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 24px">
                <p style="margin:0;color:#6b6880;font-size:12px;line-height:1.6">${escapeHtml(footer)}</p>
                <p style="margin:12px 0 0;color:#9a97ad;font-size:11px">
                  Need help? Reply to this email or visit the Parent Portal → Special Support.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;color:#9a97ad;font-size:10px">© ${new Date().getFullYear()} NeuroBloom LearningSphere</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildMessage(kind, data) {
  if (kind === 'plan') {
    const child = clean(data.childName, 80) || 'Your child'
    const plan = clean(data.planName, 80) || 'your new plan'
    const price = clean(data.price, 40)
    const next = clean(data.nextPayment, 40)
    return {
      subject: `Plan confirmed: ${plan}`,
      text: [
        `Hello ${clean(data.parentName, 80) || 'there'},`,
        '',
        `${child} is now on the ${plan} plan.`,
        price ? `Price: ${price} per month` : '',
        next ? `Next payment: ${next}` : '',
        '',
        'You can change or cancel the plan any time from Subscriptions in the Parent Portal.',
      ]
        .filter(Boolean)
        .join('\n'),
      html: emailLayout(
        `Plan confirmed for ${child}`,
        `${child} is now on the ${plan} plan. Billing details are below.`,
        row('Child', child) + row('Plan', plan) + row('Price', price ? `${price} / month` : '') + row('Next payment', next),
        'You can change or cancel this plan any time before renewal from the Parent Portal.',
      ),
    }
  }

  if (kind === 'booking') {
    const tutor = clean(data.tutorName, 80) || 'Your tutor'
    const subject = clean(data.subject, 80)
    const slot = clean(data.slot, 80)
    const rate = clean(data.rate, 40)
    return {
      subject: `Tutor session confirmed with ${tutor}`,
      text: [
        `Hello ${clean(data.studentName, 80) || 'there'},`,
        '',
        `Your session with ${tutor} is confirmed.`,
        subject ? `Subject: ${subject}` : '',
        slot ? `Time: ${slot}` : '',
        rate ? `Rate: ${rate} per hour (charged after the session)` : '',
        '',
        'Join from Messages when it is time. You can cancel up to 4 hours before the session.',
      ]
        .filter(Boolean)
        .join('\n'),
      html: emailLayout(
        'Tutor session confirmed',
        `Your one-on-one session with ${tutor} is booked.`,
        row('Tutor', tutor) + row('Subject', subject) + row('Time', slot) + row('Rate', rate ? `${rate} / hour` : ''),
        'Join from Messages when it is time. You can cancel up to 4 hours before the session.',
      ),
    }
  }

  const topic = clean(data.topic, 100) || 'Special support'
  const child = clean(data.childName, 80) || 'your child'
  const message = clean(data.message, 600)
  const reference = clean(data.reference, 40)
  return {
    subject: `We received your support request (${reference || 'NeuroBloom'})`,
    text: [
      `Hello ${clean(data.parentName, 80) || 'there'},`,
      '',
      `We received your request about ${topic} for ${child}.`,
      message ? `Your message: ${message}` : '',
      reference ? `Reference: ${reference}` : '',
      '',
      'A specialist will reply to this email within one working day.',
    ]
      .filter(Boolean)
      .join('\n'),
    html: emailLayout(
      'Support request received',
      `We received your request about ${topic} for ${child}. A specialist will reply within one working day.`,
      row('Child', child) + row('Topic', topic) + row('Reference', reference) + row('Message', message),
      'Keep this email for your records. A specialist will reply within one working day.',
    ),
  }
}

async function logEmail({ supabaseUrl, serviceKey, userId, recipient, kind, status, detail }) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/email_log`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ user_id: userId, recipient, kind, status, detail }),
    })
  } catch {
    // Logging must never block the send result.
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

  const kind = clean(body.kind, 20)
  const recipient = clean(body.recipient, 200)
  const data = body.data && typeof body.data === 'object' ? body.data : {}

  if (!ALLOWED_KINDS.has(kind)) {
    return res.status(400).json({ error: 'invalid_kind', message: 'Unknown confirmation type.' })
  }
  if (!EMAIL_RE.test(recipient)) {
    return res.status(400).json({ error: 'invalid_recipient', message: 'Enter a valid email address.' })
  }

  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const mailgunKey = process.env.MAILGUN_API_KEY || ''
  const mailgunDomain = process.env.MAILGUN_DOMAIN || ''

  if (!mailgunKey || !mailgunDomain) {
    return res.status(503).json({
      error: 'email_not_configured',
      skipped: true,
      message: 'Saved. Email delivery will start as soon as Mailgun is connected.',
    })
  }
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: 'server_not_configured',
      message: 'The email service is missing its Supabase server keys.',
    })
  }

  const authHeader = String(req.headers.authorization || '')
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Sign in to send a confirmation email.' })
  }

  let user
  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: process.env.SUPABASE_ANON_KEY || serviceKey,
      },
    })
    if (!userResponse.ok) {
      return res.status(401).json({ error: 'unauthorized', message: 'Your session expired. Sign in again.' })
    }
    user = await userResponse.json()
  } catch {
    return res.status(502).json({ error: 'auth_unreachable', message: 'Could not verify your session. Try again.' })
  }

  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  try {
    const recentResponse = await fetch(
      `${supabaseUrl}/rest/v1/email_log?select=id&user_id=eq.${encodeURIComponent(user.id)}&kind=eq.${kind}&created_at=gte.${encodeURIComponent(since)}`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    )
    const recent = await recentResponse.json()
    if (Array.isArray(recent) && recent.length >= RATE_LIMIT) {
      return res.status(429).json({
        error: 'rate_limited',
        message: 'That confirmation was just sent. Wait a minute before trying again.',
      })
    }
  } catch {
    // Rate limiting is best-effort; Mailgun still protects the account.
  }

  const message = buildMessage(kind, data)
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

    if (!response.ok) {
      const detail = clean(await response.text(), 300)
      await logEmail({ supabaseUrl, serviceKey, userId: user.id, recipient, kind, status: 'failed', detail })
      return res.status(502).json({
        error: 'send_failed',
        message: 'The confirmation email could not be delivered. Your action was saved.',
      })
    }

    const result = await response.json().catch(() => ({}))
    await logEmail({
      supabaseUrl,
      serviceKey,
      userId: user.id,
      recipient,
      kind,
      status: 'sent',
      detail: clean(result.id, 120) || null,
    })

    return res.status(200).json({ ok: true, sent: true, message: `Confirmation sent to ${recipient}.` })
  } catch {
    await logEmail({ supabaseUrl, serviceKey, userId: user.id, recipient, kind, status: 'failed', detail: 'network error' })
    return res.status(502).json({
      error: 'network_error',
      message: 'Could not reach the email service. Your action was saved.',
    })
  }
}
