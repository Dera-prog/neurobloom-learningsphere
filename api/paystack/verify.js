import { PLANS, activatePlan, currentUser, fail, paystack, priceWithCoupon, send } from './_shared.js'

function parseBody(req) {
  if (!req.body) return null
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return null
    }
  }
  return req.body
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return fail(res, 405, 'method_not_allowed', 'Use POST for this endpoint.')
  }

  const body = parseBody(req)
  const reference = String(body?.reference || '').trim()
  if (!reference) return fail(res, 400, 'invalid_reference', 'Missing Paystack reference.')

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return fail(res, 503, 'payments_not_configured', 'Online payments are not connected yet.')
  }

  const user = await currentUser(req)
  if (!user) return fail(res, 401, 'unauthorized', 'Sign in again to confirm the payment.')

  const result = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`)
  const tx = result.payload?.data
  if (!result.ok || !result.payload?.status || !tx) {
    return fail(res, 502, 'paystack_error', result.payload?.message || 'Could not verify the payment.')
  }

  if (tx.status !== 'success') {
    return send(res, 402, {
      error: 'payment_not_successful',
      status: tx.status,
      message: tx.gateway_response || 'That payment was not completed.',
    })
  }

  const metadata = tx.metadata || {}
  if (metadata.user_id !== user.id) {
    return fail(res, 403, 'forbidden', 'That payment belongs to a different account.')
  }

  const planId = String(metadata.plan_id || '')
  const childId = String(metadata.child_id || '')
  const plan = PLANS[planId]
  if (!plan) return fail(res, 400, 'invalid_plan', 'That payment is not tied to a known plan.')

  // When the merchant passes Paystack's fee to the customer, `amount` includes
  // it and only `requested_amount` matches what we asked for.
  const paid = Math.round(Number(tx.requested_amount ?? tx.amount))
  const expected = priceWithCoupon(planId, metadata.coupon)
  if (!expected || paid !== expected.price * 100) {
    return fail(res, 400, 'amount_mismatch', 'The amount paid does not match the plan price.')
  }
  if (tx.currency && tx.currency !== 'NGN') {
    return fail(res, 400, 'currency_mismatch', 'That payment was not made in naira.')
  }

  const activation = await activatePlan({
    userId: user.id,
    childId,
    planId,
    reference: tx.reference || reference,
    amount: paid,
    channel: tx.channel,
    paidAt: tx.paid_at,
    email: tx.customer?.email,
    raw: { id: tx.id, status: tx.status, gateway_response: tx.gateway_response, plan: tx.plan?.plan_code },
  })

  if (!activation.ok) {
    return fail(res, 500, 'activation_failed', 'The payment succeeded but the plan could not be activated. Contact support.')
  }

  return send(res, 200, {
    ok: true,
    plan_id: planId,
    child_id: childId,
    amount: paid,
    duplicate: Boolean(activation.duplicate),
  })
}
