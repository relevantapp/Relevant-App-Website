const KEY_PREFIX = '@relevant_signal_forge_pending_v1'

function key(userId: string): string {
  return `${KEY_PREFIX}:${userId}`
}

export function markSignalForgePending(userId: string): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify({ startedAt: new Date().toISOString() }))
  } catch {
    // localStorage unavailable (SSR, private mode)
  }
}

export function clearSignalForgePending(userId: string): void {
  try {
    localStorage.removeItem(key(userId))
  } catch {
    // ignore
  }
}

export function isSignalForgePending(userId: string): boolean {
  try {
    return localStorage.getItem(key(userId)) !== null
  } catch {
    return false
  }
}
