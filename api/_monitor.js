/**
 * Minimal Sentry reporter for the serverless routes.
 *
 * Uses Sentry's store endpoint directly so the API bundle stays small. Without
 * SENTRY_DSN every call is a no-op; the wrapper still turns an unexpected
 * throw into a clean 500 instead of a platform error page.
 */
import { randomUUID } from 'node:crypto'

const dsn = (process.env.SENTRY_DSN || '').trim()
const environment = process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || 'production'

function endpoint() {
  if (!dsn) return null
  try {
    const url = new URL(dsn)
    const projectId = url.pathname.replace(/^\//, '')
    if (!url.username || !projectId) return null
    return {
      key: url.username,
      url: `${url.protocol}//${url.host}/api/${projectId}/store/`,
    }
  } catch {
    return null
  }
}

function parseFrames(stack) {
  if (typeof stack !== 'string') return []
  return stack
    .split('\n')
    .slice(1, 41)
    .map((line) => line.trim())
    .map((line) => {
      const withParens = line.match(/^at (.+?) \((.+):(\d+):(\d+)\)$/)
      const bare = line.match(/^at (.+):(\d+):(\d+)$/)
      if (withParens) {
        return {
          function: withParens[1],
          filename: withParens[2],
          lineno: Number(withParens[3]),
          colno: Number(withParens[4]),
        }
      }
      if (bare) {
        return { function: '<anonymous>', filename: bare[1], lineno: Number(bare[2]), colno: Number(bare[3]) }
      }
      return { function: line.replace(/^at /, '') }
    })
    .reverse()
}

export function reportError(error, context = {}) {
  const target = endpoint()
  if (!target) return
  const name = error?.name || 'Error'
  const message = error?.message || String(error)
  const event = {
    event_id: randomUUID().replaceAll('-', ''),
    timestamp: new Date().toISOString(),
    platform: 'node',
    level: 'error',
    environment,
    server_name: 'neurobloom-api',
    tags: { runtime: 'vercel', ...(context.tags || {}) },
    extra: context.extra || {},
    exception: {
      values: [
        {
          type: name,
          value: message,
          stacktrace: { frames: parseFrames(error?.stack) },
        },
      ],
    },
  }
  void fetch(target.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${target.key}, sentry_client=neurobloom-api/1`,
    },
    body: JSON.stringify(event),
  }).catch(() => undefined)
}

export function withMonitoring(handler) {
  return async function monitored(req, res) {
    try {
      return await handler(req, res)
    } catch (error) {
      reportError(error, {
        tags: { route: String(req?.url || '').split('?')[0] },
        extra: { method: req?.method },
      })
      if (!res.headersSent) {
        res.status(500).json({
          error: 'server_error',
          message: 'Something went wrong on our side. Try again in a moment.',
        })
      }
    }
  }
}
