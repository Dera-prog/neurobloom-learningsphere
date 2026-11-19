/**
 * Server-side rate limiting for the API routes.
 *
 * The verdict is stored in Supabase so every serverless instance shares it.
 * When the database is not configured (local preview, demo mode) the helper
 * fails open and the in-route checks still apply.
 */
export async function allowRequest(key, limit, windowSeconds) {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey || !key) return true

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/consume_rate_limit`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_key: key, p_limit: limit, p_window_seconds: windowSeconds }),
    })
    if (!response.ok) return true
    return (await response.json()) === true
  } catch {
    return true
  }
}

export function clientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return String(value ?? '').split(',')[0].trim().slice(0, 64)
}
