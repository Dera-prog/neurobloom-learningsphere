import { useEffect, useRef, useState } from 'react'
import type { AdminLedgerRow, AdminSubscription, AdminUser } from '../data/admin'
import { plans, type PlanId } from '../data/content'
import { useAuth } from './auth'
import { isSupabaseConfigured, supabase } from './supabase'

/**
 * Admin console data access (0015_admin_console.sql).
 *
 * Live mode is a signed-in administrator: Postgres decides what the console
 * may read and write (profiles, payments and subscriptions carry admin
 * policies; admin_records is admin-only). Demo and ?preview=1 keep the
 * browser-local sample data so the console can be reviewed without an account.
 */

export type AdminCollection = 'console' | 'products' | 'invoices' | 'payroll' | 'feedback' | 'settings'

export const PLAN_IDS: PlanId[] = ['general', 'premium', 'premium_plus', 'special']

export interface AdminSnapshot {
  users: AdminUser[]
  ledger: AdminLedgerRow[]
  subscriptions: AdminSubscription[]
  loadedAt: string
}

interface ProfileRow {
  id: string
  role: string
  full_name: string
  email: string
  created_at: string
  status: string
  verified: boolean
}

interface SubscriptionRow {
  id: string
  user_id: string
  child_slot: string
  plan_id: string
  status: string
  amount: number
  current_period_end: string | null
}

interface PaymentRow {
  id: string
  user_id: string
  child_id: string
  plan_id: string
  reference: string
  amount: number
  status: string
  paid_at: string | null
  created_at: string
}

interface ChildRow {
  id: string
  guardian_id: string
  full_name: string
}

interface VerificationRow {
  teacher_id: string
  status: string
}

interface DocumentRow {
  collection: string
  id: string
  data: unknown
  updated_at: string
}

const ROLE_KIND: Record<string, AdminUser['kind']> = {
  junior: 'student',
  senior: 'student',
  special: 'student',
  teacher: 'teacher',
  parent: 'parent',
}

const ROLE_DETAIL: Record<string, string> = {
  junior: 'Junior secondary',
  senior: 'Senior secondary',
  special: 'Special-needs learner',
  teacher: 'Teacher',
  parent: 'Parent',
}

function isPreviewConsole() {
  if (!isSupabaseConfigured) return true
  try {
    if (sessionStorage.getItem('neurobloom:admin-preview') === '1') return true
  } catch {
    // Storage can be blocked in private browsing; fall through to the query.
  }
  try {
    return new URLSearchParams(window.location.search).get('preview') === '1'
  } catch {
    return false
  }
}

/** True when the console should show the sample DataSet instead of the live one. */
export function adminDemoMode(profileRole: string | undefined) {
  return isPreviewConsole() || !isSupabaseConfigured || profileRole !== 'admin'
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function humanizeSlot(slot: string) {
  const clean = String(slot ?? '')
    .replace(/^(child|kid)[-_]?/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
  if (!clean || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(clean)) return 'Learner'
  return clean.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

function newestPlan(rows: SubscriptionRow[]): PlanId | undefined {
  const active = rows.filter((row) => row.status === 'active')
  for (const id of ['premium_plus', 'special', 'premium', 'general'] as PlanId[]) {
    if (active.some((row) => row.plan_id === id)) return id
  }
  return undefined
}

const PLAN_PRICE = new Map(plans.map((plan) => [plan.id, plan.price]))

function buildSnapshot(
  profiles: ProfileRow[],
  subscriptions: SubscriptionRow[],
  payments: PaymentRow[],
  children: ChildRow[],
  verifications: VerificationRow[],
): AdminSnapshot {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
  const childNameById = new Map<string, string>()
  const childCount = new Map<string, number>()
  for (const child of children) {
    childNameById.set(child.id, child.full_name)
    childCount.set(child.guardian_id, (childCount.get(child.guardian_id) ?? 0) + 1)
  }
  const verificationByTeacher = new Map(verifications.map((row) => [row.teacher_id, row.status]))

  const users: AdminUser[] = profiles
    .filter((profile) => ROLE_KIND[profile.role])
    .map((profile) => {
      const kind = ROLE_KIND[profile.role]
      const mine = subscriptions.filter((row) => row.user_id === profile.id)
      const plan = kind === 'parent' ? newestPlan(mine) : undefined
      const verification = verificationByTeacher.get(profile.id)
      const pending = verification === 'pending'
      const children = childCount.get(profile.id) ?? 0
      return {
        id: profile.id,
        name: profile.full_name || profile.email || 'Account',
        email: profile.email,
        kind,
        detail:
          kind === 'parent'
            ? `${children} child${children === 1 ? '' : 'ren'} · ${plan ? plans.find((p) => p.id === plan)?.name ?? plan : 'No active plan'}`
            : ROLE_DETAIL[profile.role] ?? 'Account',
        status: profile.status === 'suspended' ? 'suspended' : pending ? 'pending' : 'active',
        verified: Boolean(profile.verified) || verification === 'approved',
        joined: formatDate(profile.created_at),
        plan,
        spend: plan ? PLAN_PRICE.get(plan) : undefined,
      } satisfies AdminUser
    })

  const ledger: AdminLedgerRow[] = payments
    .filter((payment) => (PLAN_IDS as string[]).includes(payment.plan_id))
    .map((payment) => {
      const payer = profileById.get(payment.user_id)
      return {
        id: payment.reference,
        date: formatDate(payment.paid_at ?? payment.created_at),
        parent: payer?.full_name || payer?.email || 'Account',
        child: childNameById.get(payment.child_id) ?? humanizeSlot(payment.child_id),
        plan: payment.plan_id as PlanId,
        amount: payment.amount,
        status:
          payment.status === 'refunded' ? 'refunded' : payment.status === 'success' ? 'success' : 'failed',
      } satisfies AdminLedgerRow
    })

  const subscriptionsView: AdminSubscription[] = subscriptions
    .filter((row) => (PLAN_IDS as string[]).includes(row.plan_id))
    .map((row) => {
      const payer = profileById.get(row.user_id)
      return {
        id: row.id,
        child: childNameById.get(row.child_slot) ?? humanizeSlot(row.child_slot),
        parent: payer?.full_name || payer?.email || 'Account',
        plan: row.plan_id as PlanId,
        amount: row.amount,
        next: row.status === 'active' ? formatDate(row.current_period_end) : '—',
        status: row.status === 'active' ? 'active' : row.status === 'cancelled' ? 'cancelled' : 'past_due',
      } satisfies AdminSubscription
    })

  return { users, ledger, subscriptions: subscriptionsView, loadedAt: new Date().toISOString() }
}

let snapshotPromise: Promise<AdminSnapshot | null> | null = null

export function invalidateAdminSnapshot() {
  snapshotPromise = null
}

export function loadAdminSnapshot(): Promise<AdminSnapshot | null> {
  if (!supabase) return Promise.resolve(null)
  snapshotPromise ??= (async () => {
    try {
      const [profiles, subscriptions, payments, children, verifications] = await Promise.all([
        supabase
          .from('profiles')
          .select('id,role,full_name,email,created_at,status,verified')
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('subscriptions')
          .select('id,user_id,child_slot,plan_id,status,amount,current_period_end')
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('payments')
          .select('id,user_id,child_id,plan_id,reference,amount,status,paid_at,created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('children').select('id,guardian_id,full_name').limit(1000),
        supabase.from('teacher_verifications').select('teacher_id,status').limit(1000),
      ])
      if (profiles.error) throw profiles.error
      return buildSnapshot(
        (profiles.data ?? []) as ProfileRow[],
        (subscriptions.data ?? []) as SubscriptionRow[],
        (payments.data ?? []) as PaymentRow[],
        (children.data ?? []) as ChildRow[],
        (verifications.data ?? []) as VerificationRow[],
      )
    } catch (error) {
      console.warn('[admin-console] snapshot unavailable:', (error as Error)?.message ?? error)
      return null
    }
  })()
  return snapshotPromise
}

/* ------------------------------- Documents -------------------------------- */

let documentsPromise: Promise<Record<string, Record<string, unknown>> | null> | null = null
let documentCache: Record<string, Record<string, unknown>> | null = null

export function invalidateAdminDocuments() {
  documentsPromise = null
  documentCache = null
}

export function loadAdminDocuments(): Promise<Record<string, Record<string, unknown>> | null> {
  if (!supabase) return Promise.resolve(null)
  documentsPromise ??= (async () => {
    try {
      const { data, error } = await supabase
        .from('admin_records')
        .select('collection,id,data,updated_at')
        .order('updated_at', { ascending: false })
      if (error) throw error
      const map: Record<string, Record<string, unknown>> = {}
      for (const row of (data ?? []) as DocumentRow[]) {
        map[row.collection] ??= {}
        map[row.collection][row.id] = row.data
      }
      documentCache = map
      return map
    } catch (error) {
      console.warn('[admin-console] records unavailable:', (error as Error)?.message ?? error)
      return null
    }
  })()
  return documentsPromise
}

export async function saveAdminDocument(collection: AdminCollection, id: string, data: unknown) {
  if (!supabase) return false
  const { error } = await supabase
    .from('admin_records')
    .upsert({ collection, id, data }, { onConflict: 'collection,id' })
  if (error) {
    console.warn('[admin-console] save failed:', error.message)
    return false
  }
  if (documentCache) {
    documentCache[collection] ??= {}
    documentCache[collection][id] = data
  }
  return true
}

export async function setAccountStatus(userId: string, status: 'active' | 'suspended') {
  if (!supabase) return false
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
  if (error) {
    console.warn('[admin-console] status update failed:', error.message)
    return false
  }
  return true
}

export async function cancelSubscriptionRecord(id: string) {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const { data, error } = await supabase.rpc('admin_cancel_subscription', { target: id })
  if (error) return { ok: false, error: error.message }
  return { ok: Boolean(data) }
}

export async function setAccountVerified(userId: string, verified: boolean) {
  if (!supabase) return false
  const { error } = await supabase.from('profiles').update({ verified }).eq('id', userId)
  if (error) {
    console.warn('[admin-console] verification update failed:', error.message)
    return false
  }
  return true
}

/* -------------------------------- Activity -------------------------------- */

export interface AdminActivityRow {
  id: string
  when: string
  actor: string
  action: string
}

interface ActivityRow {
  collection: string
  id: string
  updated_at: string
  updated_by: string | null
}

const COLLECTION_LABEL: Record<string, string> = {
  console: 'console',
  products: 'product catalogue',
  invoices: 'invoice register',
  payroll: 'payroll',
  feedback: 'feedback',
  settings: 'settings',
}

export async function loadAdminActivity(limit = 8): Promise<AdminActivityRow[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('admin_records')
      .select('collection,id,updated_at,updated_by')
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    const rows = (data ?? []) as ActivityRow[]
    const authorIds = [...new Set(rows.map((row) => row.updated_by).filter((id): id is string => Boolean(id)))]
    const names = new Map<string, string>()
    if (authorIds.length) {
      const { data: people } = await supabase.from('profiles').select('id,full_name,email').in('id', authorIds)
      for (const person of (people ?? []) as { id: string; full_name: string; email: string }[]) {
        names.set(person.id, person.full_name || person.email)
      }
    }
    return rows.map((row) => ({
      id: `${row.collection}:${row.id}`,
      when: new Date(row.updated_at).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actor: (row.updated_by && names.get(row.updated_by)) || 'Administrator',
      action: `Saved the ${COLLECTION_LABEL[row.collection] ?? row.collection} record “${row.id}”`,
    }))
  } catch (error) {
    console.warn('[admin-console] activity unavailable:', (error as Error)?.message ?? error)
    return null
  }
}

/* --------------------------------- Hooks ---------------------------------- */

export function useAdminActivity(live: boolean) {
  const [rows, setRows] = useState<AdminActivityRow[] | null>(null)
  useEffect(() => {
    if (!live) {
      setRows(null)
      return
    }
    let active = true
    void loadAdminActivity().then((next) => {
      if (active) setRows(next)
    })
    return () => {
      active = false
    }
  }, [live])
  return rows
}

export function useAdminLive() {
  const { profile } = useAuth()
  return !adminDemoMode(profile?.role)
}

export function useAdminSnapshot(live: boolean) {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null)
  useEffect(() => {
    if (!live) {
      setSnapshot(null)
      return
    }
    let active = true
    void loadAdminSnapshot().then((next) => {
      if (active) setSnapshot(next)
    })
    return () => {
      active = false
    }
  }, [live])
  return snapshot
}

function readLocal<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback()
  } catch {
    return fallback()
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing can block storage; the page still works in memory.
  }
}

/**
 * One console document (a whole array or settings object). In live mode it is
 * loaded from admin_records and saved back after a short pause; in demo mode it
 * behaves exactly like the old localStorage hook.
 */
export function useAdminDoc<T>({
  collection,
  id,
  seed,
  empty,
  storageKey,
  live,
}: {
  collection: AdminCollection
  id: string
  seed: () => T
  empty: () => T
  storageKey: string
  live: boolean
}) {
  // Decide the starting point from configuration and preview, never from the
  // profile: it is still loading on the first render.
  const demoAtMount = useRef(!isSupabaseConfigured || isPreviewConsole())
  const [value, setValue] = useState<T>(() =>
    demoAtMount.current ? readLocal(storageKey, seed) : empty(),
  )
  const ready = useRef(false)
  const dirty = useRef(false)
  const latest = useRef(value)

  useEffect(() => {
    latest.current = value
  }, [value])

  useEffect(() => {
    if (!live) {
      if (demoAtMount.current) writeLocal(storageKey, value)
      return
    }
    let active = true
    void loadAdminDocuments().then((docs) => {
      if (!active) return
      const stored = docs?.[collection]?.[id]
      if (stored !== undefined) {
        setValue(stored as T)
        latest.current = stored as T
      }
      ready.current = true
    })
    return () => {
      active = false
    }
    // Only the identity of the document matters here; value changes are saved below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, collection, id, storageKey])

  useEffect(() => {
    if (!live || !ready.current || !dirty.current) return
    const timer = setTimeout(() => {
      dirty.current = false
      void saveAdminDocument(collection, id, latest.current)
    }, 600)
    return () => clearTimeout(timer)
  }, [value, live, collection, id])

  const update = (next: T | ((prev: T) => T)) => {
    dirty.current = true
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
      latest.current = resolved
      return resolved
    })
  }

  return [value, update] as const
}
