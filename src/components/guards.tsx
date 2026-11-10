import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Audience } from '../data/content'
import { roleConfigs } from '../config/roles'
import { useAuth } from '../lib/auth'
import { useApp } from '../store/store'

const ADMIN_PREVIEW_KEY = 'neurobloom:admin-preview'

function Pending({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center"
    >
      <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-2xl bg-primary text-lg text-white">🌱</span>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">This usually takes a second.</p>
    </div>
  )
}

export function RequireRole({ role, children }: { role: Audience; children: ReactNode }) {
  const { configured, loading, session, profile, profileLoading } = useAuth()
  const { ready } = useApp()
  const location = useLocation()

  // The operations console ships with sample data so it can be reviewed without
  // an administrator account. Preview is read-only in spirit — nothing leaves
  // this browser — while real changes need the admin role.
  const previewQuery = new URLSearchParams(location.search).get('preview') === '1'
  const [previewStored] = useState(() => {
    if (role !== 'admin') return false
    try {
      return sessionStorage.getItem(ADMIN_PREVIEW_KEY) === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    if (role !== 'admin' || !previewQuery) return
    try {
      sessionStorage.setItem(ADMIN_PREVIEW_KEY, '1')
    } catch {
      // Preview still works for this page when storage is blocked.
    }
  }, [role, previewQuery])
  if (role === 'admin' && (previewQuery || previewStored)) return <>{children}</>

  if (!configured) return <>{children}</>
  if (loading) return <Pending label="Checking your session…" />
  if (!session) {
    const next = encodeURIComponent(location.pathname)
    return <Navigate to={`/login?next=${next}&role=${role}`} replace />
  }
  if (profileLoading || !profile) return <Pending label="Loading your account…" />
  if (!ready) return <Pending label="Loading your learning data…" />
  // Administrators use one console login to inspect and support every portal.
  if (profile.role === 'admin') return <>{children}</>
  if (profile.role !== role) return <Navigate to={roleConfigs[profile.role].home} replace />

  return <>{children}</>
}
