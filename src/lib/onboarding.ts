// A signup leaves this marker until the account's first state row is written.
// It is how the store tells a brand-new account apart from a returning one
// that simply has not saved any learning data yet.
const PENDING_PREFIX = 'neurobloom:onboarding:'

export function markOnboardingPending(userId?: string | null) {
  if (!userId) return
  try {
    localStorage.setItem(`${PENDING_PREFIX}${userId}`, 'pending')
  } catch {
    // Private browsing can block storage; the account still works normally.
  }
}

export function hasPendingOnboarding(userId: string) {
  try {
    return localStorage.getItem(`${PENDING_PREFIX}${userId}`) === 'pending'
  } catch {
    return false
  }
}

export function clearOnboardingPending(userId?: string | null) {
  if (!userId) return
  try {
    localStorage.removeItem(`${PENDING_PREFIX}${userId}`)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
