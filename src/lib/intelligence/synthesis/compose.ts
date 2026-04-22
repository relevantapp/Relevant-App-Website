import type { EvidencePack } from '../contracts'

export function evidencePackPrompt(pack: EvidencePack): string {
  return `Use only this evidence pack. Cite sourceId values exactly as listed in sourceLedger.

Source ledger:
${JSON.stringify(pack.sourceLedger, null, 2)}

Evidence:
${JSON.stringify(pack.evidence.map((item) => ({
  sourceId: item.sourceId,
  role: item.sourceRole,
  title: item.title,
  domain: item.domain,
  publishedAt: item.publishedAt,
  excerpt: item.excerpt,
  facts: item.facts,
})), null, 2)}

Contradictions:
${JSON.stringify(pack.contradictions, null, 2)}

Unknowns:
${JSON.stringify(pack.unknowns, null, 2)}

User lens:
${JSON.stringify(pack.userLens, null, 2)}

Prior memory:
${JSON.stringify(pack.priorMemory, null, 2)}`
}
