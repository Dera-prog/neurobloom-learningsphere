import { PREMIUM_PLAN_IDS, type ChildId, type PlanId } from '../data/content'
import { supabase } from './supabase'

/** Plans a parent may see for a child, mirroring the subscription rows. */
export interface EntitlementSnapshot {
  plans: Partial<Record<ChildId, PlanId>>
  parentAccess: Partial<Record<ChildId, { active: boolean; until: string | null }>>
}

const SLOTS: ChildId[] = ['tunde', 'chidi']

const KNOWN_PLANS = new Set<string>(['general', ...PREMIUM_PLAN_IDS])

interface SubscriptionRow {
  child_slot: string
  plan_id: string
  status: string
  current_period_end: string | null
}

/**
 * Reads the server-owned entitlements. Returns null when Supabase is absent or
 * the subscriptions table has not been migrated yet, so callers keep whatever
 * the synced state already holds.
 */
export async function loadEntitlements(): Promise<EntitlementSnapshot | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('subscriptions')
    .select('child_slot,plan_id,status,current_period_end')
    .eq('status', 'active')
  if (error || !Array.isArray(data)) return null

  const snapshot: EntitlementSnapshot = { plans: {}, parentAccess: {} }
  for (const row of data as SubscriptionRow[]) {
    if (!SLOTS.includes(row.child_slot as ChildId)) continue
    const slot = row.child_slot as ChildId
    if (row.plan_id === 'parent_access') {
      const until = row.current_period_end
      if (until && new Date(until) > new Date()) snapshot.parentAccess[slot] = { active: true, until }
      continue
    }
    if (KNOWN_PLANS.has(row.plan_id)) snapshot.plans[slot] = row.plan_id as PlanId
  }
  return snapshot
}
