/* ── Intelligence Briefs API — save, list, share ───────────── */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveBrief, listBriefs, toggleShare, getBrief } from '@/lib/intelligence/db'

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

  const body = await request.json()
  const { action } = body

  if (action === 'save') {
    const { researchType, requestPayload, brief } = body
    if (!researchType || !brief) {
      return NextResponse.json({ error: 'Missing researchType or brief' }, { status: 400 })
    }
    const result = await saveBrief(auth.client, user.id, researchType, requestPayload ?? {}, brief)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ id: result.id })
  }

  if (action === 'list') {
    const limit = Math.min(body.limit ?? 50, 100)
    const offset = Math.max(body.offset ?? 0, 0)
    const result = await listBriefs(auth.client, user.id, limit, offset)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ briefs: result.data })
  }

  if (action === 'get') {
    const { briefId } = body
    if (!briefId || typeof briefId !== 'string') {
      return NextResponse.json({ error: 'Missing briefId' }, { status: 400 })
    }
    const result = await getBrief(auth.client, briefId)
    if (result.error || !result.data) {
      return NextResponse.json({ error: result.error ?? 'Brief not found' }, { status: 404 })
    }
    return NextResponse.json({ brief: result.data })
  }

  if (action === 'share') {
    const { briefId, share } = body
    if (!briefId || typeof share !== 'boolean') {
      return NextResponse.json({ error: 'Missing briefId or share boolean' }, { status: 400 })
    }
    const result = await toggleShare(auth.client, briefId, user.id, share)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ slug: result.slug })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
