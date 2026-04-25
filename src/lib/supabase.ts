import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let _supabase: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_supabase) return _supabase
  
  // Only create client in browser with valid credentials
  if (typeof window !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    _supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _supabase
  }
  
  // Return a minimal stub for SSR/build - these methods won't actually be called
  // because auth pages are client-side only
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => { throw new Error('Supabase client not initialized - check environment variables') },
      signUp: async () => { throw new Error('Supabase client not initialized - check environment variables') },
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      refreshSession: async () => ({ data: { session: null }, error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      verifyOtp: async () => ({ data: { user: null, session: null }, error: null }),
      updateUser: async () => ({ data: { user: null }, error: null }),
      resend: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }), order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
      upsert: async () => ({ error: null }),
      update: async () => ({ eq: async () => ({ error: null }) }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
    functions: {
      invoke: async () => ({ data: null, error: null }),
    },
  } as unknown as SupabaseClient
}

// Export lazy-initialized client
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export async function getValidAccessToken(bufferSeconds = 60): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session

  if (!session) return null

  const expiresAt = session.expires_at
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = expiresAt ? expiresAt - now : 0

  if (timeUntilExpiry <= bufferSeconds) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshData.session?.access_token) return null
    return refreshData.session.access_token
  }

  return session.access_token
}
