import type { EvidencePack } from '../contracts'

export interface EvidencePackValidation {
  ok: boolean
  issues: string[]
}

export function validateEvidencePack(pack: EvidencePack): EvidencePackValidation {
  const issues: string[] = []
  const ledgerIds = new Set(pack.sourceLedger.map((source) => source.sourceId))

  for (const item of pack.evidence) {
    if (!ledgerIds.has(item.sourceId)) {
      issues.push(`Evidence item ${item.id} is missing from source ledger.`)
    }
  }

  const duplicateLedgerIds = pack.sourceLedger
    .map((source) => source.sourceId)
    .filter((id, index, ids) => ids.indexOf(id) !== index)
  if (duplicateLedgerIds.length) {
    issues.push(`Duplicate source ledger IDs: ${Array.from(new Set(duplicateLedgerIds)).join(', ')}`)
  }

  return { ok: issues.length === 0, issues }
}

export function estimateEvidenceTokens(pack: EvidencePack): number {
  const chars = JSON.stringify({
    sourceLedger: pack.sourceLedger,
    evidence: pack.evidence.map((item) => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      facts: item.facts,
    })),
  }).length
  return Math.ceil(chars / 4)
}
