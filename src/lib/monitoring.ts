import * as Sentry from '@sentry/react'

const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim()

export const monitoringEnabled = Boolean(dsn)

export function initMonitoring() {
  if (!dsn) return
  Sentry.init({
    dsn,
    environment:
      (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ||
      (import.meta.env.PROD ? 'production' : 'development'),
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    // Sentry 11 replaced sendDefaultPii with per-source collection flags; keep
    // child names, emails and cookies out of error reports.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { deny: ['authorization', 'cookie'] }, response: false },
      httpBodies: [],
      urlQueryParams: false,
    },
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0) || 0,
  })
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!monitoringEnabled) return
  Sentry.captureException(error, context ? { extra: context } : undefined)
}
