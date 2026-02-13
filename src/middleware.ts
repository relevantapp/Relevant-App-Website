import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

function isUuidV4Like(input: string): boolean {
  const s = (input || '').trim()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const signal = url.searchParams.get('signal')

  // Backwards-compatible share contract:
  // `https://www.getrelevantapp.com/?signal=<id>` -> `/signal/<id>`
  // This makes social previews work (they do not run client-side JS redirects).
  if (url.pathname === '/' && signal && isUuidV4Like(signal)) {
    const next = url.clone()
    next.pathname = `/signal/${encodeURIComponent(signal)}`
    next.searchParams.delete('signal')
    return NextResponse.redirect(next, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
}
