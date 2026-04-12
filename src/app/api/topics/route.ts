import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = auth.slice(7)

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Verify the user's JWT to get user_id
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const value = typeof body.value === 'string' ? body.value.trim() : ''
  const consequenceChain = typeof body.consequenceChain === 'string' ? body.consequenceChain.trim() : ''
  const relationship = typeof body.relationship === 'string' ? body.relationship.trim() : null
  const industrySegment = typeof body.industrySegment === 'string' ? body.industrySegment.trim() : null

  if (!category || !value) {
    return NextResponse.json({ error: 'category and value are required' }, { status: 400 })
  }

  const allowedCategories = ['company', 'topic', 'person', 'policy', 'economic_indicator', 'technology', 'market']
  if (!allowedCategories.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const normalizedValue = value.toLowerCase().replace(/\s+/g, ' ')

  const { data, error } = await supabase
    .from('pro_influence_dimensions')
    .upsert({
      user_id: user.id,
      category,
      value,
      normalized_value: normalizedValue,
      consequence_chain: consequenceChain || 'User-added item tracked for signals',
      consequence_type: 'strategic',
      source: 'user_manual',
      weight: 5,
      is_active: true,
      user_dismissed: false,
      relationship: relationship || null,
      industry_segment: industrySegment || null,
    }, {
      onConflict: 'user_id,category,normalized_value',
    })
    .select('id, category, value, normalized_value')
    .single()

  if (error) {
    console.error('Failed to add topic:', error)
    return NextResponse.json({ error: 'Failed to add topic' }, { status: 500 })
  }

  return NextResponse.json({ topic: data })
}
