// Live data feed for the Super Admin console. Runs with the service role so the
// console never needs broad read policies on profiles/payments/email_log; the
// caller's own token is verified and their profile role must be "admin".

import { currentUser, fail, rest, send, supabaseUrl } from './paystack/_shared.js'

async function adminUsers() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  try {
    const response = await fetch(`${supabaseUrl()}/auth/v1/admin/users?page=1&per_page=500`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    })
    if (!response.ok) return []
    const payload = await response.json()
    return Array.isArray(payload?.users) ? payload.users : []
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return fail(res, 405, 'method_not_allowed', 'Use GET for this endpoint.')
  }

  const user = await currentUser(req)
  if (!user) return fail(res, 401, 'unauthorized', 'Sign in again to open the console.')

  const me = await rest(`/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(user.id)}`)
  const role = Array.isArray(me.data) && me.data[0]?.role
  if (role !== 'admin') {
    return fail(res, 403, 'forbidden', 'This console is limited to administrator accounts.')
  }

  const [profiles, payments, emails, states, auth] = await Promise.all([
    rest('/rest/v1/profiles?select=id,role,full_name,email,created_at&order=created_at.desc&limit=1000'),
    rest(
      '/rest/v1/payments?select=id,user_id,child_id,plan_id,reference,amount,currency,status,channel,paid_at,created_at&order=created_at.desc&limit=500',
    ),
    rest('/rest/v1/email_log?select=id,recipient,kind,status,detail,created_at&order=created_at.desc&limit=200'),
    rest('/rest/v1/user_state?select=user_id,updated_at&limit=1000'),
    adminUsers(),
  ])

  if (!profiles.ok) {
    return fail(res, 502, 'data_unavailable', profiles.data?.message || 'Could not read platform accounts.')
  }

  const signIn = new Map(auth.filter((row) => row?.id).map((row) => [row.id, row.last_sign_in_at || null]))
  const accounts = (Array.isArray(profiles.data) ? profiles.data : []).map((row) => ({
    id: row.id,
    role: row.role,
    name: row.full_name || '',
    email: row.email || '',
    joinedAt: row.created_at,
    lastSignInAt: signIn.get(row.id) ?? null,
  }))

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const stateRows = Array.isArray(states.data) ? states.data : []
  const progress = {
    tracked: stateRows.length,
    activeThisWeek: stateRows.filter((row) => row.updated_at && new Date(row.updated_at).getTime() >= weekAgo).length,
  }

  const paystackReady = Boolean(process.env.PAYSTACK_SECRET_KEY)
  const emailReady = Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN)

  return send(res, 200, {
    generatedAt: new Date().toISOString(),
    integrations: { payments: paystackReady, email: emailReady, database: true },
    accounts,
    payments: Array.isArray(payments.data) ? payments.data : [],
    emails: Array.isArray(emails.data) ? emails.data : [],
    progress,
  })
}
