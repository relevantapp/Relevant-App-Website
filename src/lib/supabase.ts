import { createBrowserClient, SupabaseClient } from '@supabase/ssr'

let _supabase: SupabaseClient | null = null

// SSR-safe stub that returns null for all operations during build/SSR
const ssrStub = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'SSR stub' } }),
    signUp: async () => ({ data: { user: null, session: null }, error: { message: 'SSR stub' } }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    refreshSession: async () => ({ data: { session: null }, error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    verifyOtp: async () => ({ data: { user: null, session: null }, error: null }),
    updateUser: async () => ({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    upsert: async () => ({ error: null }),
    update: async () => ({ eq: async () => ({ error: null }) }),
  }),
} as unknown as SupabaseClient

function getClient(): SupabaseClient {
  if (typeof window === 'undefined') return ssrStub
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) return ssrStub
  
  if (!_supabase) {
    _supabase = createBrowserClient(url, key)
  }
  return _supabase
}

// Export a proxy that lazily creates the client
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as Record<string | symbol, unknown>)[prop]
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
