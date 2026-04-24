'use client'

import { useState } from 'react'

const SAMPLE_USER = {
  name: 'Sarah Chen',
  role: 'VP of Strategy',
  industry: 'Fintech',
  company: {
    name: 'Stripe',
    sector: 'Fintech',
    subSector: 'Payments Infrastructure',
    stage: 'Late-stage / Pre-IPO',
    sizeBucket: '5,001–10,000',
    businessModel: 'B2B SaaS + Platform',
    description: 'Global payments infrastructure for the internet economy.',
  },
  location: {
    city: 'San Francisco',
    country: 'US',
    countryLabel: 'United States',
    timezone: 'America/Los_Angeles',
  },
  goals: [
    { type: 'career_growth', concerns: ['leadership visibility', 'cross-functional influence', 'board readiness'] },
    { type: 'competitive_intel', concerns: ['market share shifts', 'competitor launches', 'pricing changes'] },
  ],
}

type ContextField = 'identity' | 'company' | 'location' | 'goals'

const fieldMeta: Record<ContextField, { label: string; icon: string; description: string }> = {
  identity: {
    label: 'Identity',
    icon: '👤',
    description: 'Name, role, industry — the basics that shape every synthesis.',
  },
  company: {
    label: 'Company Meta',
    icon: '🏢',
    description: 'Sector, stage, size, business model — so the AI understands your operating context.',
  },
  location: {
    label: 'Location',
    icon: '📍',
    description: 'Geography + timezone — regional relevance and regulatory context.',
  },
  goals: {
    label: 'Active Goals',
    icon: '🎯',
    description: 'What you\'re working on right now — career, competitive intel, ops efficiency.',
  },
}

export function EnrichedContextViz() {
  const [activeField, setActiveField] = useState<ContextField>('identity')

  return (
    <div className="space-y-8">
      {/* Explanation */}
      <div className="max-w-2xl">
        <h2 className="text-2xl font-display font-bold mb-2">Enriched User Context</h2>
        <p className="text-[var(--color-gray-400)]">
          Before writing a single word, the AI builds a complete picture of who you are.
          Not just your name — your company&apos;s market position, your geography, and your active goals.
          This is the foundation every other layer builds on.
        </p>
      </div>

      {/* Interactive diagram */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: field selector */}
        <div className="space-y-3">
          {(Object.keys(fieldMeta) as ContextField[]).map((key) => {
            const meta = fieldMeta[key]
            const isActive = activeField === key
            return (
              <button
                key={key}
                onClick={() => setActiveField(key)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-[var(--color-blue-500)]/40 bg-[var(--color-blue-500)]/10'
                    : 'bg-[var(--color-gray-900)] border-[var(--color-gray-800)] hover:border-[var(--color-gray-700)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta.icon}</span>
                  <div>
                    <p className={`font-semibold ${isActive ? 'text-[var(--color-blue-300)]' : 'text-[var(--color-gray-200)]'}`}>
                      {meta.label}
                    </p>
                    <p className="text-sm text-[var(--color-gray-500)]">{meta.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right: data preview */}
        <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-6 font-mono text-sm">
          <p className="text-[var(--color-gray-500)] text-xs uppercase tracking-wider mb-4">
            Data sent to AI
          </p>
          {activeField === 'identity' && (
            <div className="space-y-2">
              <DataRow label="Name" value={SAMPLE_USER.name} />
              <DataRow label="Role" value={SAMPLE_USER.role} />
              <DataRow label="Industry" value={SAMPLE_USER.industry} />
            </div>
          )}
          {activeField === 'company' && (
            <div className="space-y-2">
              <DataRow label="Name" value={SAMPLE_USER.company.name} />
              <DataRow label="Sector" value={SAMPLE_USER.company.sector} />
              <DataRow label="Sub-sector" value={SAMPLE_USER.company.subSector} />
              <DataRow label="Stage" value={SAMPLE_USER.company.stage} />
              <DataRow label="Size" value={SAMPLE_USER.company.sizeBucket} />
              <DataRow label="Model" value={SAMPLE_USER.company.businessModel} />
              <DataRow label="About" value={SAMPLE_USER.company.description} />
            </div>
          )}
          {activeField === 'location' && (
            <div className="space-y-2">
              <DataRow label="City" value={SAMPLE_USER.location.city} />
              <DataRow label="Country" value={SAMPLE_USER.location.countryLabel} />
              <DataRow label="Timezone" value={SAMPLE_USER.location.timezone} />
            </div>
          )}
          {activeField === 'goals' && (
            <div className="space-y-4">
              {SAMPLE_USER.goals.map((g, i) => (
                <div key={i}>
                  <p className="text-[var(--color-amber-400)]">{g.type.replace('_', ' ')}</p>
                  <p className="text-[var(--color-gray-400)] mt-1">
                    Concerns: {g.concerns.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Prompt preview */}
          <div className="mt-6 pt-4 border-t border-[var(--color-gray-800)]">
            <p className="text-[var(--color-gray-500)] text-xs uppercase tracking-wider mb-2">
              What the AI sees in the prompt ↓
            </p>
            <pre className="text-[var(--color-green-400)] whitespace-pre-wrap text-xs leading-relaxed">
{activeField === 'identity' && `WHO YOU ARE BRIEFING
- Name: ${SAMPLE_USER.name}
- Role: ${SAMPLE_USER.role} in ${SAMPLE_USER.industry}`}
{activeField === 'company' && `- Company: ${SAMPLE_USER.company.name} — a ${SAMPLE_USER.company.sizeBucket}, ${SAMPLE_USER.company.stage} ${SAMPLE_USER.company.sector} company. ${SAMPLE_USER.company.description}`}
{activeField === 'location' && `- Location: ${SAMPLE_USER.location.city}, ${SAMPLE_USER.location.countryLabel} (${SAMPLE_USER.location.timezone})`}
{activeField === 'goals' && `- Active goals:
${SAMPLE_USER.goals.map(g => `  - ${g.type.replace('_', ' ')}: cares about ${g.concerns.join(', ')}`).join('\n')}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Before / After */}
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <ComparisonCard
          title="Without Enriched Context"
          subtitle="Generic prompt"
          variant="before"
          lines={[
            '"You are an analyst writing for a fintech professional."',
            '3 words describe the user',
            'No company context → generic analysis',
            'No location → misses regulatory relevance',
          ]}
        />
        <ComparisonCard
          title="With Enriched Context"
          subtitle="WS8 prompt"
          variant="after"
          lines={[
            '"You\'re briefing Sarah Chen, VP of Strategy at Stripe..."',
            '47 data points describe the user',
            'Knows company stage → frames for pre-IPO ops',
            'Knows SF → catches CA regulatory signals',
          ]}
        />
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[var(--color-gray-600)] min-w-[80px]">{label}:</span>
      <span className="text-[var(--color-gray-200)]">{value}</span>
    </div>
  )
}

function ComparisonCard({
  title,
  subtitle,
  variant,
  lines,
}: {
  title: string
  subtitle: string
  variant: 'before' | 'after'
  lines: string[]
}) {
  const isBefore = variant === 'before'
  return (
    <div
      className={`p-5 rounded-xl border ${
        isBefore
          ? 'bg-[var(--color-gray-900)] border-[var(--color-gray-800)]'
          : 'bg-[var(--color-blue-500)]/5 border-[var(--color-blue-500)]/30'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${isBefore ? 'bg-[var(--color-gray-800)] text-[var(--color-gray-400)]' : 'bg-[var(--color-blue-500)]/20 text-[var(--color-blue-400)]'}`}>
          {subtitle}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={isBefore ? 'text-[var(--color-gray-600)]' : 'text-[var(--color-blue-400)]'}>
              {isBefore ? '×' : '✓'}
            </span>
            <span className="text-[var(--color-gray-400)]">{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
