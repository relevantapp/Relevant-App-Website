import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const VALID_ENTITY_TYPES = new Set(['company', 'person', 'topic', 'location'])
const VALID_LENSES = new Set(['founder', 'product', 'gtm', 'strategy', 'investor'])

export async function POST(request: NextRequest) {
  // Verify user is authenticated via their JWT
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userToken = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  })
  const { data: { user }, error: authError } = await supabase.auth.getUser(userToken)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // Parse and validate request body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  const entityType = typeof body.entityType === 'string' ? body.entityType.trim().toLowerCase() : ''
  const lensKey = typeof body.lensKey === 'string' ? body.lensKey.trim().toLowerCase() : ''
  const lookbackDays = typeof body.lookbackDays === 'number' ? body.lookbackDays : 30
  const forceRefresh = body.forceRefresh === true

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }
  if (!VALID_ENTITY_TYPES.has(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 })
  }
  if (!VALID_LENSES.has(lensKey)) {
    return NextResponse.json({ error: 'Invalid lensKey' }, { status: 400 })
  }

  try {
    const edgeRes = await fetch(`${supabaseUrl}/functions/v1/pro-entity-dossier`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, entityType, lensKey, lookbackDays, forceRefresh }),
    })

    const data = await edgeRes.json()

    if (!edgeRes.ok) {
      return NextResponse.json(
        { error: data.error || 'Dossier request failed' },
        { status: edgeRes.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/dossier] Edge function call failed:', err)
    return NextResponse.json({ error: 'Failed to reach dossier service' }, { status: 502 })
  }
}
