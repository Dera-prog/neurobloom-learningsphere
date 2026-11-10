// Grant (or revoke) the platform admin role on an existing account.
//
// Usage:
//   node scripts/grant-admin.mjs someone@example.com
//   node scripts/grant-admin.mjs someone@example.com --role=parent
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .secrets/supabase.env.
// Never creates accounts and never prints the key.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envFile = join(root, '.secrets', 'supabase.env')

function loadEnv(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const [, key, raw] = match
    const value = raw.replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv(envFile)

const args = process.argv.slice(2)
const email = (args.find((arg) => !arg.startsWith('--')) ?? '').trim()
const roleArg = args.find((arg) => arg.startsWith('--role='))
const role = roleArg ? roleArg.slice('--role='.length).trim() : 'admin'
const allowed = ['admin', 'junior', 'senior', 'special', 'teacher', 'parent']

if (!email || !email.includes('@')) {
  console.error('Usage: npm run grant:admin -- someone@example.com [--role=parent]')
  process.exit(1)
}
if (!allowed.includes(role)) {
  console.error(`Role must be one of: ${allowed.join(', ')}`)
  process.exit(1)
}

const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .secrets/supabase.env.')
  process.exit(1)
}

const response = await fetch(`${url}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
  method: 'PATCH',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
  body: JSON.stringify({ role }),
})

const body = await response.json().catch(() => null)
if (!response.ok) {
  console.error(`Supabase replied ${response.status}: ${body?.message ?? 'unknown error'}`)
  process.exit(1)
}

const rows = Array.isArray(body) ? body : []
if (!rows.length) {
  console.error(`No profile found for ${email}. Sign up first, then run this again.`)
  process.exit(1)
}

console.log(`✓ ${email} now has the "${role}" role.`)
console.log(role === 'admin' ? 'Open /admin in the app (sign out and back in if the role looks stale).' : 'Done.')
