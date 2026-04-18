'use client'

import { ChevronDown } from 'lucide-react'
import { DossierResponse, EntityType, domainFromUrl } from './types'

/* ── Collapsible Section ─────────────────────────────────────── */

export function CollapsibleSection({
  title,
  icon,
  isCollapsed,
  onToggle,
  children,
}: {
  title: string
  icon?: React.ReactNode
  isCollapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="mb-3 flex w-full items-center gap-2 text-left text-sm font-semibold text-[var(--text)]"
      >
        {icon}
        {title}
        <ChevronDown
          className={`ml-auto h-4 w-4 text-[var(--text-soft)] transition-transform ${
            isCollapsed ? '-rotate-90' : ''
          }`}
        />
      </button>
      {!isCollapsed && children}
    </div>
  )
}

/* ── Related Entity Extraction ───────────────────────────────── */

export interface RelatedEntity {
  query: string
  entityType: EntityType
}

export function extractRelatedEntities(dossier: DossierResponse): RelatedEntity[] {
  const currentQuery = dossier.entity.normalizedQuery.toLowerCase()
  const entities = new Map<string, EntityType>()

  // Extract entities mentioned in timeline headlines
  for (const event of dossier.timeline) {
    // Look for capitalized multi-word proper nouns (likely companies/people)
    const matches = event.headline.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g)
    if (matches) {
      for (const match of matches) {
        const lower = match.toLowerCase()
        if (lower !== currentQuery && !entities.has(lower) && match.length > 4) {
          // Heuristic: 2-3 title-case words → person, otherwise company
          const words = match.split(/\s+/)
          const type: EntityType =
            words.length >= 2 && words.length <= 3 ? 'person' : 'company'
          entities.set(lower, type)
        }
      }
    }
  }

  // Extract from source domains (unique outlets → company)
  const domains = new Set<string>()
  for (const source of Object.values(dossier.proofSources)) {
    const domain = domainFromUrl(source.url).replace(/\.(com|org|net|io|co)$/, '')
    if (domain.length > 3 && !domains.has(domain)) {
      domains.add(domain)
    }
  }

  return Array.from(entities.entries())
    .slice(0, 6)
    .map(([query, entityType]) => ({
      query: query.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      entityType,
    }))
}
