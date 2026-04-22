import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveClaimFeedback } from '@/lib/intelligence/db'
import { ClaimFeedbackPayloadSchema } from '@/lib/intelligence/feedback'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^=+/, '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^=+/, '').trim()

function getAuthenticatedClient(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const userToken = authHeader.replace('Bearer ', '')
  return {
    client: createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    }),
    token: userToken,
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuthenticatedClient(request.headers.get('authorization'))
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await auth.client.auth.getUser(auth.token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = ClaimFeedbackPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const result = await saveClaimFeedback(auth.client, user.id, parsed.data)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ id: result.id })
}
