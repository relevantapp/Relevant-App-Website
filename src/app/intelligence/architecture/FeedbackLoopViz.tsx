'use client'

import { useState } from 'react'

const ACTIONS = [
  { action: 'share', label: 'Share', icon: '↗', delta: '+0.10', color: 'green', description: 'User found it valuable enough to share' },
  { action: 'save', label: 'Save', icon: '⊕', delta: '+0.05', color: 'green', description: 'Bookmarked for later reference' },
  { action: 'pin', label: 'Pin', icon: '📌', delta: '+0.15', color: 'green', description: 'Highest-value signal — actively tracking' },
  { action: 'deep_dive', label: 'Deep Dive', icon: '🔍', delta: '+0.05', color: 'green', description: 'Wanted more detail on this topic' },
  { action: 'dismiss', label: 'Dismiss', icon: '✕', delta: '-0.10', color: 'red', description: 'Not useful right now' },
  { action: 'not_relevant', label: 'Not Relevant', icon: '⊘', delta: '-0.20', color: 'red', description: 'Actively unhelpful — strongest negative signal' },
]

const SAMPLE_DIMENSIONS = [
  { name: 'competitive', baseWeight: 1.0, adjusted: 1.0, actions: 0 },
  { name: 'regulatory', baseWeight: 1.0, adjusted: 1.0, actions: 0 },
  { name: 'financial', baseWeight: 1.0, adjusted: 1.0, actions: 0 },
  { name: 'technical', baseWeight: 1.0, adjusted: 1.0, actions: 0 },
  { name: 'operational', baseWeight: 1.0, adjusted: 1.0, actions: 0 },
]

type SimAction = { dimension: string; delta: number; action: string }

export function FeedbackLoopViz() {
  const [simActions, setSimActions] = useState<SimAction[]>([])
  const [selectedDimension, setSelectedDimension] = useState('competitive')

  const dimensions = SAMPLE_DIMENSIONS.map((d) => {
    const relevantActions = simActions.filter((a) => a.dimension === d.name)
    const totalDelta = relevantActions.reduce((sum, a) => sum + a.delta, 0)
    return {
      ...d,
      adjusted: Math.max(0.1, Math.min(3.0, d.baseWeight + totalDelta)),
      actions: relevantActions.length,
    }
  })

  const addAction = (actionType: string, delta: number) => {
    setSimActions((prev) => [...prev, { dimension: selectedDimension, delta, action: actionType }])
  }

  const reset = () => setSimActions([])

  const maxWeight = Math.max(...dimensions.map((d) => d.adjusted))

  return (
    <div className="space-y-8">
      {/* Explanation */}
      <div className="max-w-2xl">
        <h2 className="text-2xl font-display font-bold mb-2">Feedback Loop</h2>
        <p className="text-[var(--color-gray-400)]">
          Every action you take on a signal teaches the system what matters to you.
          Share a competitive signal? Future briefs weigh competitive angles higher.
          Dismiss an operational signal? It gets deprioritized. Your brief improves
          with every interaction.
        </p>
      </div>

      {/* Interactive simulator */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: action panel */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--color-gray-300)]">
            Simulate user actions on &quot;{selectedDimension}&quot; signals:
          </p>

          {/* Dimension selector */}
          <div className="flex gap-2 flex-wrap">
            {dimensions.map((d) => (
              <button
                key={d.name}
                onClick={() => setSelectedDimension(d.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedDimension === d.name
                    ? 'bg-[var(--color-amber-500)]/20 text-[var(--color-amber-400)] border border-[var(--color-amber-500)]/40'
                    : 'bg-[var(--color-gray-900)] text-[var(--color-gray-500)] border border-[var(--color-gray-800)]'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.action}
                onClick={() => addAction(a.action, parseFloat(a.delta))}
                className={`p-3 rounded-xl text-left transition-all border ${
                  a.color === 'green'
                    ? 'bg-[var(--color-gray-900)] border-[var(--color-gray-800)] hover:border-[var(--color-green-500)]/40'
                    : 'bg-[var(--color-gray-900)] border-[var(--color-gray-800)] hover:border-[var(--color-red-500)]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--color-gray-200)]">
                    {a.icon} {a.label}
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      a.color === 'green' ? 'text-[var(--color-green-400)]' : 'text-[var(--color-red-400)]'
                    }`}
                  >
                    {a.delta}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-gray-600)]">{a.description}</p>
              </button>
            ))}
          </div>

          {simActions.length > 0 && (
            <button onClick={reset} className="text-xs text-[var(--color-gray-600)] hover:text-[var(--color-gray-400)]">
              Reset simulation
            </button>
          )}
        </div>

        {/* Right: weight visualization */}
        <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-6">
          <p className="text-sm font-semibold text-[var(--color-gray-200)] mb-4">
            Dimension Weight Multipliers
          </p>
          <div className="space-y-4">
            {dimensions.map((d) => {
              const pct = maxWeight > 0 ? (d.adjusted / maxWeight) * 100 : 0
              const isUp = d.adjusted > d.baseWeight
              const isDown = d.adjusted < d.baseWeight
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono text-[var(--color-gray-300)]">{d.name}</span>
                    <span
                      className={`text-sm font-mono ${
                        isUp
                          ? 'text-[var(--color-green-400)]'
                          : isDown
                            ? 'text-[var(--color-red-400)]'
                            : 'text-[var(--color-gray-500)]'
                      }`}
                    >
                      {d.adjusted.toFixed(2)}x
                      {d.actions > 0 && (
                        <span className="text-[var(--color-gray-600)] text-xs ml-1">
                          ({d.actions} action{d.actions !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-gray-800)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUp
                          ? 'bg-[var(--color-green-500)]'
                          : isDown
                            ? 'bg-[var(--color-red-500)]'
                            : 'bg-[var(--color-amber-500)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Effect explanation */}
          <div className="mt-6 pt-4 border-t border-[var(--color-gray-800)]">
            <p className="text-xs text-[var(--color-gray-500)]">
              Higher weight = more signals from this dimension in future briefs.
              Weights are clamped between 0.1x and 3.0x. Each action is small,
              but patterns compound over time.
            </p>
          </div>
        </div>
      </div>

      {/* Action log */}
      {simActions.length > 0 && (
        <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-4">
          <p className="text-xs font-mono text-[var(--color-gray-500)] uppercase tracking-wider mb-2">
            Action Log ({simActions.length})
          </p>
          <div className="flex gap-2 flex-wrap">
            {simActions.map((a, i) => (
              <span
                key={i}
                className={`px-2 py-1 rounded text-xs font-mono ${
                  a.delta > 0
                    ? 'bg-[var(--color-green-500)]/10 text-[var(--color-green-400)]'
                    : 'bg-[var(--color-red-500)]/10 text-[var(--color-red-400)]'
                }`}
              >
                {a.action} on {a.dimension} ({a.delta > 0 ? '+' : ''}{a.delta.toFixed(2)})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Flywheel diagram */}
      <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-6">
        <p className="text-sm font-semibold text-[var(--color-gray-200)] mb-4">The Feedback Flywheel</p>
        <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
          <FlyStep text="Read brief" />
          <FlyArrow />
          <FlyStep text="Take action" />
          <FlyArrow />
          <FlyStep text="Weights adjust" />
          <FlyArrow />
          <FlyStep text="Next brief improves" />
          <FlyArrow />
          <FlyStep text="More actions" />
        </div>
        <p className="text-center text-xs text-[var(--color-gray-600)] mt-3">
          ↻ Each cycle makes the brief more personally relevant
        </p>
      </div>
    </div>
  )
}

function FlyStep({ text }: { text: string }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-[var(--color-amber-500)]/10 border border-[var(--color-amber-500)]/20 text-[var(--color-amber-300)] text-sm font-medium">
      {text}
    </div>
  )
}

function FlyArrow() {
  return <span className="text-[var(--color-gray-700)] hidden md:inline text-lg">→</span>
}
