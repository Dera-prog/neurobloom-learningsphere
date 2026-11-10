import {
  CHILDREN,
  COUPONS,
  PLANS,
  PREMIUM_PLANS,
  currentUser,
  fail,
  isAddonPlan,
  paystack,
  priceWithCoupon,
  readUserState,
  send,
  siteUrl,
} from './_shared.js'

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
  if (!body) return fail(res, 400, 'invalid_body', 'Send a JSON body.')

  const childId = String(body.child_id || '').trim()
  const planId = String(body.plan_id || '').trim()
  if (!CHILDREN.has(childId)) return fail(res, 400, 'invalid_child', 'Unknown child for this account.')
  if (!PLANS[planId]) return fail(res, 400, 'invalid_plan', 'Unknown subscription plan.')

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return send(res, 503, {
      error: 'payments_not_configured',
      skipped: true,
      message: 'Online payments are not connected yet. Nothing was charged.',
    })
  }

  const user = await currentUser(req)
  if (!user) return fail(res, 401, 'unauthorized', 'Sign in again to start a payment.')

  const plan = PLANS[planId]
  const addon = isAddonPlan(planId)

  if (addon) {
    const state = await readUserState(user.id)
    const childPlan = state.plans?.[childId]
    if (!PREMIUM_PLANS.has(childPlan)) {
      return fail(
        res,
        409,
        'not_eligible',
        'Parent Access is optional and only available on the Premium, Premium Plus and Special Needs Premium plans.',
      )
    }
  }

  const requestedCoupon = addon ? '' : String(body.coupon || '').trim().toUpperCase()
  if (requestedCoupon && !COUPONS[requestedCoupon]) {
    return fail(res, 400, 'invalid_coupon', 'That promo code is not valid or has expired.')
  }
  const pricing = priceWithCoupon(planId, requestedCoupon)
  // Paystack plans always charge their fixed price, so a discounted checkout is
  // a one-off charge at the promo price instead of a subscription.
  const planCode = pricing.coupon ? undefined : process.env[plan.env] || undefined
  const callback = `${siteUrl(req)}/payment/callback`

  const init = await paystack('/transaction/initialize', {
    method: 'POST',
    body: {
      email: user.email,
      amount: pricing.price * 100,
      currency: 'NGN',
      callback_url: callback,
      ...(planCode ? { plan: planCode } : {}),
      metadata: {
        user_id: user.id,
        child_id: childId,
        plan_id: planId,
        plan_name: plan.name,
        kind: addon ? 'addon' : 'plan',
        amount_ngn: pricing.price,
        list_price_ngn: plan.price,
        coupon: pricing.coupon || undefined,
      },
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    },
  })

  if (!init.ok || !init.payload?.status) {
    const detail = init.payload?.message || `Paystack replied ${init.status}`
    return fail(res, 502, 'paystack_error', `Could not start the payment: ${detail}`)
  }

  return send(res, 200, {
    ok: true,
    authorization_url: init.payload.data.authorization_url,
    reference: init.payload.data.reference,
    amount: pricing.price,
    discount: pricing.discount,
    coupon: pricing.coupon,
  })
}
