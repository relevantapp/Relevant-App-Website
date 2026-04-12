import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const VALID_ENTITY_TYPES = new Set(['company', 'person', 'topic', 'location'])
const VALID_LENSES = new Set(['founder', 'product', 'gtm', 'strategy', 'investor'])
const VALID_LOOKBACK_DAYS = new Set([30, 60, 90])

const EDGE_TIMEOUT_MS = 90_000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

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
    console.error('[api/dossier] Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    return NextResponse.json(
      { error: 'Meeting Prep is not configured. Please contact support.' },
      { status: 500 }
    )
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
  const lookbackDays = typeof body.lookbackDays === 'number' && VALID_LOOKBACK_DAYS.has(body.lookbackDays) ? body.lookbackDays : 30
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

  // Rate limit per user
  const now = Date.now()
  const bucket = rateLimitMap.get(user.id)
  if (bucket && now < bucket.resetAt) {
    if (bucket.count >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 }
      )
    }
    bucket.count++
  } else {
    rateLimitMap.set(user.id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), EDGE_TIMEOUT_MS)

    const edgeRes = await fetch(`${supabaseUrl}/functions/v1/pro-entity-dossier`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, entityType, lensKey, lookbackDays, forceRefresh }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const data = await edgeRes.json()

    if (!edgeRes.ok) {
      console.error('[api/dossier] Edge function error:', data.error)
      return NextResponse.json(
        { error: 'Dossier request failed. Please try again.' },
        { status: edgeRes.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/dossier] Edge function call failed:', err)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out. Please try a shorter time range or different query.' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Failed to reach dossier service' }, { status: 502 })
  }
}
