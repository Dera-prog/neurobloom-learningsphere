import { PREMIUM_PLAN_IDS, type ChildId, type PlanId } from '../data/content'
import { supabase } from './supabase'

/** True only when the Paystack public key reached the build (see .env.local / Vercel). */
export const paymentsConfigured = Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY)

export interface PaymentRow {
  id: string
  child_id: ChildId
  plan_id: PlanId
  reference: string
  amount: number
  status: string
  created_at: string
}

/** The signed-in parent's own charges (RLS allows self-read only). */
export async function listMyPayments(): Promise<PaymentRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('payments')
    .select('id,child_id,plan_id,reference,amount,status,created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return data as PaymentRow[]
}

export interface CheckoutStart {
  ok: boolean
  message: string
}

/** Display mirror of the server list in api/paystack/_shared.js — the server is authoritative. */
export const COUPONS: Record<string, { percent: number; label: string }> = {
  BLOOM10: { percent: 10, label: 'Welcome offer · 10% off' },
  FAMILY15: { percent: 15, label: 'Sibling discount · 15% off' },
  WAEC20: { percent: 20, label: 'WAEC prep · 20% off' },
}

export interface CouponPreview {
  code: string
  percent: number
  label: string
  discount: number
  total: number
}

export function applyCoupon(code: string, price: number): CouponPreview | null {
  const clean = code.trim().toUpperCase()
  const coupon = COUPONS[clean]
  if (!coupon) return null
  const discount = Math.round((price * coupon.percent) / 100)
  return { code: clean, percent: coupon.percent, label: coupon.label, discount, total: price - discount }
}

export interface VerifyResult {
  ok: boolean
  planId?: string
  childId?: string
  message: string
}

async function accessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/** Creates a Paystack checkout and sends the browser there. */
export async function startCheckout(childId: string, planId: string, coupon?: string): Promise<CheckoutStart> {
  const token = await accessToken()
  if (!token) return { ok: false, message: 'Sign in again to start a payment.' }

  try {
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ child_id: childId, plan_id: planId, coupon: coupon?.trim().toUpperCase() || undefined }),
    })
    const body = (await response.json().catch(() => ({}))) as {
      authorization_url?: string
      message?: string
    }

    if (!response.ok) {
      return { ok: false, message: body.message ?? 'Could not start the payment. Try again.' }
    }
    if (!body.authorization_url) {
      return { ok: false, message: 'Paystack did not return a checkout link.' }
    }

    window.location.assign(body.authorization_url)
    return { ok: true, message: 'Redirecting to Paystack…' }
  } catch {
    return { ok: false, message: 'Network error — the payment was not started.' }
  }
}

/** Confirms a Paystack reference and activates the plan server-side. */
export async function verifyPayment(reference: string): Promise<VerifyResult> {
  const token = await accessToken()
  if (!token) return { ok: false, message: 'Sign in again to confirm the payment.' }

  try {
    const response = await fetch('/api/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reference }),
    })
    const body = (await response.json().catch(() => ({}))) as {
      plan_id?: string
      child_id?: string
      message?: string
    }

    if (!response.ok) {
      return { ok: false, message: body.message ?? 'We could not confirm that payment.' }
    }
    return {
      ok: true,
      planId: body.plan_id,
      childId: body.child_id,
      message: 'Payment confirmed — your plan is active.',
    }
  } catch {
    return { ok: false, message: 'Network error — the payment could not be confirmed.' }
  }
}

const INTENT_KEY = 'neurobloom:parent-access-signup'
const INTENT_TTL = 6 * 60 * 60 * 1000

export interface ParentAccessIntent {
  childId: ChildId
  planId: PlanId
}

/**
 * A Parent Access signup pays for the child's premium plan first and the add-on
 * second, so the chosen learner and plan wait here across the Paystack redirect.
 */
export function saveParentAccessIntent(childId: ChildId, planId: PlanId) {
  try {
    window.localStorage.setItem(
      INTENT_KEY,
      JSON.stringify({ childId, planId, startedAt: new Date().toISOString() }),
    )
  } catch {
    // A blocked localStorage only costs the automatic second step.
  }
}

export function readParentAccessIntent(): ParentAccessIntent | null {
  try {
    const raw = window.localStorage.getItem(INTENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { childId?: unknown; planId?: unknown; startedAt?: unknown }
    const started = typeof parsed.startedAt === 'string' ? Date.parse(parsed.startedAt) : 0
    const fresh = Number.isFinite(started) && Date.now() - started < INTENT_TTL
    const childId = parsed.childId
    const planId = parsed.planId
    if (
      !fresh ||
      (childId !== 'tunde' && childId !== 'chidi') ||
      typeof planId !== 'string' ||
      !PREMIUM_PLAN_IDS.includes(planId as PlanId)
    ) {
      return null
    }
    return { childId, planId: planId as PlanId }
  } catch {
    return null
  }
}

export function clearParentAccessIntent() {
  try {
    window.localStorage.removeItem(INTENT_KEY)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}
