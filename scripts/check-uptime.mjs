#!/usr/bin/env node
// Polls /api/health and exits non-zero when the site is down or unhealthy.
// Wire it into any external monitor (Better Stack, UptimeRobot, a cron job):
//   node scripts/check-uptime.mjs https://neurobloom-learningsphere.vercel.app
// or set NEUROBLOOM_URL. UPTIME_ATTEMPTS (default 3) and UPTIME_DELAY_MS
// (default 5000) control retries so a single cold start is not a false alarm.

const base = (process.argv[2] || process.env.NEUROBLOOM_URL || 'https://neurobloom-learningsphere.vercel.app').replace(/\/$/, '')
const attempts = Number(process.env.UPTIME_ATTEMPTS ?? 3)
const delayMs = Number(process.env.UPTIME_DELAY_MS ?? 5000)
const timeoutMs = Number(process.env.UPTIME_TIMEOUT_MS ?? 15000)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function probe() {
  const started = Date.now()
  const res = await fetch(`${base}/api/health`, {
    headers: { 'User-Agent': 'neurobloom-uptime/1.0' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const ms = Date.now() - started
  if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status} in ${ms}ms` }
  const body = await res.json().catch(() => null)
  if (!body || typeof body !== 'object' || !('payments' in body) || !('email' in body) || !('sms' in body)) {
    return { ok: false, detail: `unexpected body in ${ms}ms` }
  }
  const off = ['payments', 'email', 'sms'].filter((key) => body[key] !== true)
  return {
    ok: true,
    detail: `${ms}ms · ${body.emailProvider ?? 'email off'} · ${body.smsProvider ?? 'sms off'}${off.length ? ` · unconfigured: ${off.join(', ')}` : ''}`,
  }
}

let last
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    last = await probe()
  } catch (error) {
    last = { ok: false, detail: error?.name === 'TimeoutError' ? `timeout after ${timeoutMs}ms` : String(error?.message ?? error) }
  }
  if (last.ok) {
    console.log(`UP ${base}/api/health · ${last.detail}`)
    process.exit(0)
  }
  console.warn(`attempt ${attempt}/${attempts} failed · ${last.detail}`)
  if (attempt < attempts) await sleep(delayMs)
}

console.error(`DOWN ${base}/api/health · ${last?.detail ?? 'no response'}`)
process.exit(1)
