'use client'

import { useState } from 'react'

const ROLES = [
  {
    slug: 'vp_strategy',
    label: 'VP of Strategy',
    keyConcerns: ['Market positioning', 'Competitive threats', 'M&A activity', 'Revenue diversification', 'Board-readiness'],
    lessRelevant: ['Day-to-day ops', 'Bug fixes', 'Hiring pipeline'],
    preferredConsequenceTypes: ['strategic', 'financial', 'competitive'],
    sampleOutput: 'Signal about Adyen\'s embedded finance push → frames it as a competitive positioning threat to Stripe\'s platform strategy, not just a product launch.',
  },
  {
    slug: 'product_manager',
    label: 'Product Manager',
    keyConcerns: ['User behavior shifts', 'Feature parity', 'API ecosystem changes', 'Activation metrics', 'Competitor feature launches'],
    lessRelevant: ['Macro policy', 'C-suite reshuffles', 'Stock price movements'],
    preferredConsequenceTypes: ['product', 'operational', 'technical'],
    sampleOutput: 'Signal about open banking regulation → frames it as an integration opportunity for checkout flow, not a compliance risk.',
  },
  {
    slug: 'founder_ceo',
    label: 'Founder / CEO',
    keyConcerns: ['Fundraising climate', 'Market timing', 'Talent market', 'Regulatory landscape', 'Burn rate signals'],
    lessRelevant: ['Implementation details', 'Sprint velocity', 'Code quality metrics'],
    preferredConsequenceTypes: ['strategic', 'financial', 'regulatory'],
    sampleOutput: 'Signal about fintech funding slowdown → frames it as a runway strategy decision, not a market trends summary.',
  },
  {
    slug: 'data_scientist',
    label: 'Data Scientist',
    keyConcerns: ['Model performance', 'Data quality', 'ML ops tooling', 'Privacy regulations on data use', 'Benchmark changes'],
    lessRelevant: ['Brand marketing', 'Sales pipeline', 'Office logistics'],
    preferredConsequenceTypes: ['technical', 'operational', 'regulatory'],
    sampleOutput: 'Signal about EU AI Act → frames it as a model documentation requirement, not a political event.',
  },
]

export function RoleConcernsViz() {
  const [selectedRole, setSelectedRole] = useState(0)
  const role = ROLES[selectedRole]

  return (
    <div className="space-y-8">
      {/* Explanation */}
      <div className="max-w-2xl">
        <h2 className="text-2xl font-display font-bold mb-2">Role-Concerns Layer</h2>
        <p className="text-[var(--color-gray-400)]">
          The same news event matters differently to different roles. A VP of Strategy
          cares about competitive positioning; a Product Manager cares about feature
          implications. This layer tells the AI what to emphasize and what to skip.
        </p>
      </div>

      {/* Role selector */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((r, i) => (
          <button
            key={r.slug}
            onClick={() => setSelectedRole(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedRole === i
                ? 'bg-[var(--color-violet-500)]/20 text-[var(--color-violet-300)] border border-[var(--color-violet-500)]/40'
                : 'bg-[var(--color-gray-900)] text-[var(--color-gray-400)] border border-[var(--color-gray-800)] hover:border-[var(--color-gray-700)]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Role concerns visualization */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Key concerns */}
        <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--color-green-400)]" />
            <p className="text-sm font-semibold text-[var(--color-green-400)]">Prioritize</p>
          </div>
          <ul className="space-y-2">
            {role.keyConcerns.map((c) => (
              <li key={c} className="text-sm text-[var(--color-gray-300)] flex items-start gap-2">
                <span className="text-[var(--color-green-400)] mt-0.5">↑</span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Less relevant */}
        <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--color-gray-500)]" />
            <p className="text-sm font-semibold text-[var(--color-gray-400)]">Deprioritize</p>
          </div>
          <ul className="space-y-2">
            {role.lessRelevant.map((c) => (
              <li key={c} className="text-sm text-[var(--color-gray-500)] flex items-start gap-2">
                <span className="text-[var(--color-gray-600)] mt-0.5">↓</span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Consequence types */}
        <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--color-violet-400)]" />
            <p className="text-sm font-semibold text-[var(--color-violet-400)]">Preferred Framing</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {role.preferredConsequenceTypes.map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--color-violet-500)]/10 text-[var(--color-violet-300)] border border-[var(--color-violet-500)]/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sample output */}
      <div className="bg-gradient-to-r from-[var(--color-violet-500)]/5 to-transparent rounded-xl border border-[var(--color-violet-500)]/20 p-6">
        <p className="text-xs font-mono text-[var(--color-violet-400)] uppercase tracking-wider mb-2">
          Example: Same signal, different framing for {role.label}
        </p>
        <p className="text-[var(--color-gray-300)] text-sm leading-relaxed">
          {role.sampleOutput}
        </p>
      </div>

      {/* How it works */}
      <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-6">
        <p className="text-sm font-semibold text-[var(--color-gray-200)] mb-3">How it works</p>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <Step n={1} text="User sets role during onboarding" />
          <Arrow />
          <Step n={2} text="Role maps to concern keywords" />
          <Arrow />
          <Step n={3} text="AI gets: prioritize X, deprioritize Y" />
          <Arrow />
          <Step n={4} text="Synthesis uses preferred framing" />
        </div>
      </div>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-[var(--color-violet-500)]/20 text-[var(--color-violet-400)] text-xs flex items-center justify-center font-mono">
        {n}
      </span>
      <span className="text-[var(--color-gray-400)]">{text}</span>
    </div>
  )
}

function Arrow() {
  return <span className="text-[var(--color-gray-700)] hidden md:inline">→</span>
}
