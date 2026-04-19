import { NextResponse } from 'next/server'
import { listSelectableOpenRouterModels } from '@/lib/intelligence/openrouter'

export const maxDuration = 30

export async function GET() {
  const catalog = await listSelectableOpenRouterModels()

  return NextResponse.json(catalog, {
    headers: {
      'Cache-Control': 's-maxage=1800, stale-while-revalidate=86400',
    },
  })
}
