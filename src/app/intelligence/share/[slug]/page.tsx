/* ── Public shared intelligence brief page ──────────────── */

import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import SharedBriefView from './SharedBriefView'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^=+/, '').trim()
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/^=+/, '').trim()

async function getSharedBrief(slug: string) {
  if (!supabaseUrl || !serviceRoleKey) return null
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase
    .from('intelligence_briefs')
    .select('*')
    .eq('share_slug', slug)
    .eq('is_shared', true)
    .single()

  if (error || !data) return null
  return data
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const brief = await getSharedBrief(slug)
  if (!brief) {
    return { title: 'Brief not found — Relevant' }
  }
  const synthesis = brief.synthesis as Record<string, unknown>
  const headline = (synthesis.headline as string) ?? 'Intelligence Brief'
  const bottomLine = (synthesis.bottomLine as string) ?? ''

  return {
    title: `${headline} — Relevant Intelligence`,
    description: bottomLine.slice(0, 200),
    openGraph: {
      title: headline,
      description: bottomLine.slice(0, 200),
      type: 'article',
    },
  }
}

export default async function SharedBriefPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const brief = await getSharedBrief(slug)

  if (!brief) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] p-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--text)]">Brief not found</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          This link may have expired or the brief is no longer shared.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Go to Relevant
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[var(--text)]">
            Relevant Intelligence
          </Link>
          <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
            Shared Brief
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <SharedBriefView
          synthesis={brief.synthesis}
          sources={brief.sources}
          researchType={brief.research_type}
          confidence={brief.confidence}
          createdAt={brief.created_at}
        />
      </main>
    </div>
  )
}
