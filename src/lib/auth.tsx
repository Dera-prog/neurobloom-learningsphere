import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Audience } from '../data/content'
import { markOnboardingPending } from './onboarding'
import { isSupabaseConfigured, supabase } from './supabase'

/** Roles a person may pick for themselves at signup. Admin is granted, never chosen. */
export const ACCOUNT_ROLES: Audience[] = ['junior', 'senior', 'special', 'teacher', 'parent']

/** Every role a stored profile may carry, including the operator console. */
const SESSION_ROLES: Audience[] = [...ACCOUNT_ROLES, 'admin']

export function asRole(value: unknown): Audience | null {
  return typeof value === 'string' && (SESSION_ROLES as string[]).includes(value) ? (value as Audience) : null
}

export function asAccountRole(value: unknown): Audience | null {
  return typeof value === 'string' && (ACCOUNT_ROLES as string[]).includes(value) ? (value as Audience) : null
}

export interface Profile {
  id: string
  role: Audience
  full_name: string
  email: string
}

interface SignUpInput {
  email: string
  password: string
  fullName: string
  role: Audience
  phone?: string
}

interface AuthValue {
  configured: boolean
  loading: boolean
  profileLoading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  recovering: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (input: SignUpInput) => Promise<{ error?: string; needsConfirmation?: boolean }>
  requestPasswordReset: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

function friendlyAuthError(message: string) {
  const text = message.toLowerCase()
  if (text.includes('invalid login credentials')) return 'That email and password don’t match an account.'
  if (text.includes('email not confirmed')) return 'Confirm your email first — check your inbox for the link.'
  if (text.includes('user already registered')) return 'An account with this email already exists. Sign in instead.'
  if (text.includes('password should be at least')) return 'Use a password of at least 8 characters.'
  if (text.includes('should be different from the old password')) return 'Choose a password you haven’t used before.'
  if (text.includes('rate limit') || text.includes('too many')) return 'Too many attempts. Wait a minute and try again.'
  if (text.includes('unable to validate email')) return 'That email address doesn’t look right.'
  if (text.includes('auth session missing') || text.includes('session not found')) {
    return 'Your reset link has expired. Request a new one.'
  }
  return message
}

function profileFromUser(user: User): Profile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  return {
    id: user.id,
    // Signup metadata is user-controlled, so admin can never arrive from here.
    role: asAccountRole(meta.role) ?? 'junior',
    full_name: typeof meta.full_name === 'string' ? meta.full_name : (user.email ?? '').split('@')[0],
    email: user.email ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [profileLoading, setProfileLoading] = useState(false)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return
      // Supabase fires this when someone opens a password-reset link. The
      // session it creates is only good for setting a new password.
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') setRecovering(false)
      setSession(next)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    let active = true
    const user = session.user
    setProfileLoading(true)

    async function load(current: User) {
      const { data } = await supabase!
        .from('profiles')
        .select('id, role, full_name, email')
        .eq('id', current.id)
        .maybeSingle()
      if (!active) return

      if (data) {
        const role = asRole((data as { role?: unknown }).role) ?? 'junior'
        setProfile({
          id: current.id,
          role,
          full_name: (data as { full_name?: string }).full_name ?? '',
          email: (data as { email?: string }).email ?? current.email ?? '',
        })
        setProfileLoading(false)
        return
      }

      // Covers projects where the signup trigger has not been installed yet.
      const fallback = profileFromUser(current)
      const { error } = await supabase!.from('profiles').insert(fallback)
      if (!active) return
      if (error) console.warn('Could not create profile row:', error.message)
      setProfile(fallback)
      setProfileLoading(false)
    }

    void load(user)

    return () => {
      active = false
    }
  }, [session?.user?.id])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Accounts aren’t connected in this build yet.' }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? { error: friendlyAuthError(error.message) } : {}
  }, [])

  const signUp = useCallback(async ({ email, password, fullName, role, phone }: SignUpInput) => {
    if (!supabase) return { error: 'Accounts aren’t connected in this build yet.' }
    const accountRole = asAccountRole(role)
    if (!accountRole) return { error: 'Choose the dashboard that fits you.' }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), role: accountRole, phone: phone?.trim() || null },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) return { error: friendlyAuthError(error.message) }
    // The store picks this up when it first hydrates the new account.
    markOnboardingPending(data.user?.id)
    return { needsConfirmation: !data.session }
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Accounts aren’t connected in this build yet.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    return error ? { error: friendlyAuthError(error.message) } : {}
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) return { error: 'Accounts aren’t connected in this build yet.' }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: friendlyAuthError(error.message) }
    setRecovering(false)
    return {}
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      profileLoading,
      session,
      user: session?.user ?? null,
      profile,
      recovering,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      signOut,
    }),
    [loading, profileLoading, session, profile, recovering, signIn, signUp, requestPasswordReset, updatePassword, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
