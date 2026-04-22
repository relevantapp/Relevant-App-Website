export function canonicalEntityName(name: string): string {
  return name
    .replace(/\b(incorporated|inc|ltd|llc|corp|corporation|co)\b\.?/gi, '')
    .replace(/[,\u2019']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function entityCacheTtlDays(kind: 'company' | 'person'): number {
  return kind === 'company' ? 7 : 30
}
