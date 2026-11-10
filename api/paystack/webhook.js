import { createHmac, timingSafeEqual } from 'node:crypto'
import { activatePlan, PLANS, send } from './_shared.js'

// Paystack signs the raw request body, so it must not be parsed before checking.
export const config = { api: { bodyParser: false } }

async function readRaw(req) {
  if (typeof req.body === 'string') return req.body
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body)
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

function signatureMatches(raw, header) {
  const key = process.env.PAYSTACK_SECRET_KEY || ''
  if (!key || !header) return false
  const expected = createHmac('sha512', key).update(raw).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(String(header), 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const raw = await readRaw(req)
  if (!signatureMatches(raw, req.headers['x-paystack-signature'])) {
    return res.status(401).json({ error: 'bad_signature' })
  }

  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return res.status(400).json({ error: 'invalid_json' })
  }

  // Answer 200 for anything we do not act on so Paystack stops retrying.
  if (event?.event !== 'charge.success') {
    return send(res, 200, { ok: true, ignored: event?.event || 'unknown' })
  }

  const data = event.data || {}
  const metadata = data.metadata || {}
  const planId = String(metadata.plan_id || '')
  const childId = String(metadata.child_id || '')
  const userId = String(metadata.user_id || '')

  if (!PLANS[planId] || !userId || !childId || data.status !== 'success') {
    return send(res, 200, { ok: true, ignored: 'missing_metadata' })
  }

  const activation = await activatePlan({
    userId,
    childId,
    planId,
    reference: data.reference,
    amount: data.requested_amount ?? data.amount,
    channel: data.channel,
    paidAt: data.paid_at,
    email: data.customer?.email,
    raw: { event: event.event, id: data.id, plan: data.plan?.plan_code, subscription: data.subscription?.subscription_code },
  })

  return send(res, activation.ok ? 200 : 500, { ok: activation.ok, duplicate: Boolean(activation.duplicate) })
}
