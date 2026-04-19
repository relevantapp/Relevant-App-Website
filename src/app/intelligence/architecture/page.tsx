'use client'

import { useState } from 'react'
import { EnrichedContextViz } from './EnrichedContextViz'
import { RoleConcernsViz } from './RoleConcernsViz'
import { IntentLayerViz } from './IntentLayerViz'
import { FeedbackLoopViz } from './FeedbackLoopViz'

const tabs = [
  { id: 'context', label: 'Enriched Context', color: 'blue' },
  { id: 'role', label: 'Role Concerns', color: 'violet' },
  { id: 'intent', label: 'Intent Layer', color: 'teal' },
  { id: 'feedback', label: 'Feedback Loop', color: 'amber' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function IntelligenceArchitecturePage() {
  const [activeTab, setActiveTab] = useState<TabId>('context')

  return (
    <main className="min-h-screen bg-[var(--color-gray-950)] text-[var(--color-gray-50)]">
      {/* Header */}
      <section className="px-6 pt-20 pb-12 max-w-5xl mx-auto text-center">
        <p className="text-sm font-mono tracking-widest text-[var(--color-blue-400)] uppercase mb-3">
          Intelligence Architecture
        </p>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">
          Four Layers of Personalization
        </h1>
        <p className="text-lg text-[var(--color-gray-400)] max-w-2xl mx-auto">
          How Relevant turns raw information into a brief that feels like it was written
          by an analyst who knows your role, your company, and what you care about.
        </p>
      </section>

      {/* Pipeline Overview */}
      <section className="px-6 pb-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
          {['Raw Articles', 'Matching', 'Scoring'].map((step, i) => (
            <div key={step} className="flex items-center gap-1 md:gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-[var(--color-gray-800)] text-xs font-mono text-[var(--color-gray-400)]">
                {step}
              </div>
              {i < 2 && <span className="text-[var(--color-gray-600)]">→</span>}
            </div>
          ))}
          <span className="text-[var(--color-gray-600)]">→</span>
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--color-blue-500)]/20 to-[var(--color-violet-500)]/20 border border-[var(--color-blue-500)]/30 text-sm font-semibold text-[var(--color-blue-300)]">
            ✦ Super-Agent Layer
          </div>
          <span className="text-[var(--color-gray-600)]">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--color-gray-800)] text-xs font-mono text-[var(--color-gray-400)]">
            Your Brief
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 max-w-5xl mx-auto">
        <div className="flex gap-2 border-b border-[var(--color-gray-800)] pb-0 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.id
                  ? `text-[var(--color-${tab.color}-400)] border-[var(--color-${tab.color}-400)]`
                  : 'text-[var(--color-gray-500)] border-transparent hover:text-[var(--color-gray-300)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="pb-20">
          {activeTab === 'context' && <EnrichedContextViz />}
          {activeTab === 'role' && <RoleConcernsViz />}
          {activeTab === 'intent' && <IntentLayerViz />}
          {activeTab === 'feedback' && <FeedbackLoopViz />}
        </div>
      </section>
    </main>
  )
}
