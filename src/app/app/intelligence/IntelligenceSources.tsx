/* ── Editorial source list ── */
'use client'

import type { BriefSource } from '@/lib/intelligence/contracts'
import SourcesStrip from './results/shared/SourcesStrip'

interface IntelligenceSourcesProps {
  sources: BriefSource[]
}

export default function IntelligenceSources({ sources }: IntelligenceSourcesProps) {
  return <SourcesStrip sources={sources} />
}
