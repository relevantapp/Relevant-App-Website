'use client'

import { Blocks, Compass, DollarSign, MoveRight } from 'lucide-react'
import type { BriefSource, WhitespacePocket } from '@/lib/intelligence/contracts'
import CitedText from '../CitedText'
import ExhibitShell from '../ExhibitShell'

const WHITESPACE_KINDS: Array<WhitespacePocket['kind']> = ['segment', 'flank', 'pricing', 'capability']

const WHITESPACE_META: Record<
  WhitespacePocket['kind'],
  {
    label: string
    Icon: typeof Compass
  }
> = {
  segment: {
    label: 'Segment gap',
    Icon: Compass,
  },
  flank: {
    label: 'Flank move',
    Icon: MoveRight,
  },
  pricing: {
    label: 'Pricing gap',
    Icon: DollarSign,
  },
  capability: {
    label: 'Capability gap',
    Icon: Blocks,
  },
}

interface WhitespacePanelProps {
  data: WhitespacePocket[]
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function WhitespacePanel({ data, headline, subhead, asOf, sources }: WhitespacePanelProps) {
  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="grid gap-4 md:grid-cols-2">
        {WHITESPACE_KINDS.map((kind) => {
          const pocket = data.find((entry) => entry.kind === kind)
          const { Icon, label } = WHITESPACE_META[kind]

          return (
            <article key={kind} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-soft)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-soft)]">{label}</span>
              </div>

              {pocket ? (
                <div>
                  <p className="mt-4 text-lg font-semibold leading-tight text-[var(--text)]">{pocket.headline}</p>
                  <div className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                    <CitedText spans={[pocket.evidence]} sources={sources} />
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">No clear gap identified here.</p>
              )}
            </article>
          )
        })}
      </div>
    </ExhibitShell>
  )
}
