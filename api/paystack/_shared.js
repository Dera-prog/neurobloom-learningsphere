// Shared helpers for the Paystack endpoints. Files starting with "_" are not
// routed by Vercel, so this never becomes a public URL.

export const PAYSTACK_BASE = 'https://api.paystack.co'

// Must match src/data/content.ts — the client only ever sends an id, never a price.
export const PLANS = {
  general: { name: 'General Plan', price: 8500, env: 'PAYSTACK_PLAN_GENERAL' },
  premium: { name: 'Premium Plan', price: 15000, env: 'PAYSTACK_PLAN_PREMIUM' },
  premium_plus: { name: 'Premium Plus', price: 25000, env: 'PAYSTACK_PLAN_PREMIUM_PLUS' },
  special: { name: 'Special Needs Premium', price: 22000, env: 'PAYSTACK_PLAN_SPECIAL' },
  parent_access: { name: 'Parent Access', price: 2500, env: 'PAYSTACK_PLAN_PARENT_ACCESS' },
}

/** Plans that include premium benefits, including the Parent Access add-on. */
export const PREMIUM_PLANS = new Set(['premium', 'premium_plus', 'special'])

export function isAddonPlan(planId) {
  return planId === 'parent_access'
}

export const CHILDREN = new Set(['tunde', 'chidi'])

// Promo codes are resolved on the server so a client can never name its own
// price. Keep this list in sync with src/lib/payments.ts (display preview only).
export const COUPONS = {
  BLOOM10: { percent: 10, label: 'Welcome offer · 10% off' },
  FAMILY15: { percent: 15, label: 'Sibling discount · 15% off' },
  WAEC20: { percent: 20, label: 'WAEC prep · 20% off' },
}

/** Returns the coupon-adjusted naira price for a plan. Unknown codes are rejected by callers. */
export function priceWithCoupon(planId, code) {
  const plan = PLANS[planId]
  if (!plan) return null
  const clean = String(code || '').trim().toUpperCase()
  const coupon = clean ? COUPONS[clean] : null
  if (!coupon) return { coupon: null, price: plan.price, discount: 0 }
  const discount = Math.round((plan.price * coupon.percent) / 100)
  return { coupon: clean, price: plan.price - discount, discount }
}

export function send(res, status, body) {
  res.status(status).json(body)
}

export function fail(res, status, error, message) {
  res.status(status).json({ error, message })
}

export async function paystack(path, { method = 'GET', body } = {}) {
  const key = process.env.PAYSTACK_SECRET_KEY || ''
  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, payload }
}

function serviceHeaders() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
}

export function supabaseUrl() {
  return (process.env.SUPABASE_URL || '').replace(/\/$/, '')
}

/** Returns the signed-in Supabase user, or null when the bearer token is missing/invalid. */
export async function currentUser(req) {
  const url = supabaseUrl()
  const authHeader = String(req.headers.authorization || '')
  if (!url || !authHeader.startsWith('Bearer ')) return null
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: process.env.SUPABASE_ANON_KEY || '' },
    })
    if (!response.ok) return null
    const user = await response.json()
    return user?.id ? user : null
  } catch {
    return null
  }
}

export async function rest(path, { method = 'GET', body, prefer } = {}) {
  const headers = serviceHeaders()
  if (prefer) headers.Prefer = prefer
  const response = await fetch(`${supabaseUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: response.ok, status: response.status, data }
}

async function applyPlanToState(userId, childId, planId) {
  const current = await rest(
    `/rest/v1/user_state?select=state&user_id=eq.${encodeURIComponent(userId)}`,
  )
  const state = (Array.isArray(current.data) && current.data[0]?.state) || {}
  if (state.plans?.[childId] === planId) return { ok: true }
  const nextState = {
    ...state,
    plans: { ...(state.plans || {}), [childId]: planId },
  }
  return rest('/rest/v1/user_state?on_conflict=user_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: { user_id: userId, state: nextState, updated_at: new Date().toISOString() },
  })
}

async function applyParentAccessToState(userId, childId) {
  const state = await readUserState(userId)
  const childPlan = state.plans?.[childId]
  if (!PREMIUM_PLANS.has(childPlan)) {
    return { ok: false, reason: 'not_eligible' }
  }
  const existing = state.parentAccess?.[childId]
  if (existing?.active && existing.until && new Date(existing.until) > new Date()) {
    return { ok: true, duplicate: true }
  }
  const until = new Date()
  until.setMonth(until.getMonth() + 1)
  const write = await writeUserState(userId, {
    ...state,
    parentAccess: {
      ...(state.parentAccess || {}),
      [childId]: { active: true, until: until.toISOString() },
    },
  })
  return write.ok ? { ok: true, duplicate: false } : { ok: false, reason: 'state_write_failed' }
}

export async function readUserState(userId) {
  const result = await rest(`/rest/v1/user_state?select=state&user_id=eq.${encodeURIComponent(userId)}`)
  return Array.isArray(result.data) && result.data[0]?.state ? result.data[0].state : {}
}

async function writeUserState(userId, state) {
  return rest('/rest/v1/user_state?on_conflict=user_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: { user_id: userId, state, updated_at: new Date().toISOString() },
  })
}

function planCodeOf(planId) {
  const env = PLANS[planId]?.env
  return env ? process.env[env] || '' : ''
}

/**
 * Paystack's list endpoint filters by numeric customer id — an email there
 * matches nothing and silently returns 200 with an empty list.
 */
async function customerIdFor(email) {
  const found = await paystack(`/customer/${encodeURIComponent(email)}`)
  const id = found.payload?.data?.id
  return found.ok && id ? id : null
}

/**
 * Paystack keeps charging every subscription it created, so a plan switch would
 * otherwise bill the old and the new plan. The ledger is the source of truth:
 * keep one active subscription per paid child, disable the rest.
 */
export async function reconcileSubscriptions({ userId, email }) {
  if (!email) return { ok: true, skipped: 'no_email' }
  const codes = Object.entries(PLANS)
    .filter(([id]) => !isAddonPlan(id))
    .map(([, plan]) => process.env[plan.env])
    .filter(Boolean)
  if (!codes.length) return { ok: true, skipped: 'no_plans' }

  const ledger = await rest(
    `/rest/v1/payments?select=child_id,plan_id,created_at&user_id=eq.${encodeURIComponent(userId)}&status=eq.success&order=created_at.desc`,
  )
  const rows = Array.isArray(ledger.data) ? ledger.data : []
  // Without a ledger we cannot tell which charge is current, and disabling on a
  // guess could cancel a subscription the parent just paid for.
  if (!rows.length) return { ok: true, skipped: 'no_ledger' }
  const desired = {}
  const seen = new Set()
  for (const row of rows) {
    if (seen.has(row.child_id)) continue
    seen.add(row.child_id)
    const code = planCodeOf(row.plan_id)
    if (code) desired[code] = (desired[code] || 0) + 1
  }

  const customerId = await customerIdFor(email)
  if (!customerId) return { ok: true, skipped: 'no_customer' }

  const list = await paystack(`/subscription?customer=${customerId}&perPage=100`)
  const subs = Array.isArray(list.payload?.data) ? list.payload.data : []
  const byPlan = new Map()
  for (const sub of subs) {
    if (sub.status !== 'active') continue
    const code = typeof sub.plan === 'string' ? sub.plan : sub.plan?.plan_code
    if (!code || !codes.includes(code)) continue
    byPlan.set(code, [...(byPlan.get(code) || []), sub])
  }

  let disabled = 0
  for (const [code, bucket] of byPlan) {
    for (const sub of bucket.slice(desired[code] || 0)) {
      if (!sub.email_token) continue
      const result = await paystack('/subscription/disable', {
        method: 'POST',
        body: { code: sub.subscription_code, token: sub.email_token },
      })
      if (result.ok) disabled += 1
    }
  }
  return { ok: true, disabled }
}

async function safeReconcile(args) {
  try {
    return await reconcileSubscriptions(args)
  } catch {
    // Never fail a paid activation because subscription housekeeping failed.
    return { ok: false, reason: 'reconcile_failed' }
  }
}

/**
 * Activates a paid plan and records the charge. Idempotent on the Paystack
 * reference so a verify call and a webhook for the same charge cannot double-apply.
 */
export async function activatePlan({ userId, childId, planId, reference, amount, channel, paidAt, email, raw }) {
  if (!PLANS[planId] || !CHILDREN.has(childId)) {
    return { ok: false, reason: 'invalid_target' }
  }
  if (isAddonPlan(planId)) {
    return applyParentAccessToState(userId, childId)
  }

  const existing = await rest(
    `/rest/v1/payments?select=id,plan_id&reference=eq.${encodeURIComponent(reference)}`,
  )
  if (Array.isArray(existing.data) && existing.data.length) {
    // The charge is already banked; make sure the plan stuck even if a stale
    // client autosave overwrote it after the webhook ran.
    const reapplied = await applyPlanToState(userId, childId, planId)
    if (!reapplied.ok) return { ok: false, reason: 'state_write_failed' }
    await safeReconcile({ userId, email })
    return { ok: true, duplicate: true }
  }

  const write = await applyPlanToState(userId, childId, planId)
  if (!write.ok) return { ok: false, reason: 'state_write_failed' }

  const ledger = await rest('/rest/v1/payments', {
    method: 'POST',
    prefer: 'return=minimal',
    body: {
      user_id: userId,
      child_id: childId,
      plan_id: planId,
      reference,
      amount: Math.round(Number(amount) || 0),
      channel: channel || null,
      status: 'success',
      paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      raw: raw ?? null,
    },
  })

  await safeReconcile({ userId, email })

  return { ok: true, duplicate: false, ledgerWritten: ledger.ok }
}

export function siteUrl(req) {
  const configured = (process.env.SITE_URL || '').replace(/\/$/, '')
  if (configured) return configured
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return host ? `https://${host}` : ''
}
