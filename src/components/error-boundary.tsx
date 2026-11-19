import type { ReactNode } from 'react'
import { ErrorBoundary as SentryBoundary } from '@sentry/react'

function CrashFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-extrabold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This page hit an unexpected error. Your saved work is safe — reload to continue, and the
          technical team has been notified when monitoring is configured.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Reload the page
        </button>
      </div>
    </div>
  )
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return <SentryBoundary fallback={<CrashFallback />}>{children}</SentryBoundary>
}
