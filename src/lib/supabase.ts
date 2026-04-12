import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

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
