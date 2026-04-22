'use client'

import { useMemo, useState } from 'react'
import type { MarketPlayer } from '@/lib/intelligence/contracts'

interface QuadrantProps {
  players: MarketPlayer[]
  label?: string
}

const CATEGORY_COLOR: Record<MarketPlayer['category'], string> = {
  leader: 'var(--accent-teal)',
  challenger: 'var(--accent-amber)',
  niche: 'var(--accent-violet)',
  emerging: 'var(--accent-coral)',
}

const VIEWBOX_WIDTH = 400
const VIEWBOX_HEIGHT = 280
const PLOT_LEFT = 56
const PLOT_RIGHT = 356
const PLOT_TOP = 28
const PLOT_BOTTOM = 232
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP

export function getQuadrantPoint(scale: number, momentum: number) {
  return {
    x: PLOT_LEFT + scale * PLOT_WIDTH,
    y: PLOT_BOTTOM - momentum * PLOT_HEIGHT,
  }
}

function getUnplottedReason(player: MarketPlayer) {
  if (typeof player.scale !== 'number' && typeof player.momentum !== 'number') {
    return 'Missing both scale and momentum scores.'
  }
  if (typeof player.scale !== 'number') {
    return 'Missing a defensible scale score.'
  }
  return 'Missing a defensible momentum score.'
}

export default function Quadrant({ players, label = 'Player quadrant' }: QuadrantProps) {
  const plottedPlayers = useMemo(
    () =>
      players.filter(
        (player) => typeof player.scale === 'number' && typeof player.momentum === 'number',
      ),
    [players],
  )
  const unplottedPlayers = useMemo(
    () =>
      players.filter(
        (player) => typeof player.scale !== 'number' || typeof player.momentum !== 'number',
      ),
    [players],
  )
  const [activePlayerName, setActivePlayerName] = useState(plottedPlayers[0]?.name ?? null)
  const activePlayer = plottedPlayers.find((player) => player.name === activePlayerName) ?? plottedPlayers[0] ?? null

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`${label}: ${players.map((player) => `${player.name}${typeof player.scale === 'number' && typeof player.momentum === 'number' ? ` at ${Math.round(player.scale * 100)}, ${Math.round(player.momentum * 100)}` : ' unplotted'}`).join(', ')}`}
      >
        <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="var(--surface)" rx="18" />
        <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke="var(--border)" strokeWidth="1.5" />
        <line x1={PLOT_LEFT} y1={PLOT_TOP} x2={PLOT_LEFT} y2={PLOT_BOTTOM} stroke="var(--border)" strokeWidth="1.5" />
        <line x1={PLOT_LEFT + PLOT_WIDTH / 2} y1={PLOT_TOP} x2={PLOT_LEFT + PLOT_WIDTH / 2} y2={PLOT_BOTTOM} stroke="var(--border)" strokeDasharray="6 6" />
        <line x1={PLOT_LEFT} y1={PLOT_TOP + PLOT_HEIGHT / 2} x2={PLOT_RIGHT} y2={PLOT_TOP + PLOT_HEIGHT / 2} stroke="var(--border)" strokeDasharray="6 6" />

        <text x={PLOT_RIGHT} y={PLOT_BOTTOM + 22} textAnchor="end" className="mono" style={{ fontSize: 10, fill: 'var(--text-soft)' }}>
          Scale
        </text>
        <text x={PLOT_LEFT - 24} y={PLOT_TOP} textAnchor="middle" className="mono" style={{ fontSize: 10, fill: 'var(--text-soft)' }} transform={`rotate(-90 ${PLOT_LEFT - 24} ${PLOT_TOP})`}>
          Momentum
        </text>

        {plottedPlayers.map((player) => {
          const point = getQuadrantPoint(player.scale as number, player.momentum as number)
          return (
            <g key={player.name}>
              <circle cx={point.x} cy={point.y} r="7" fill={CATEGORY_COLOR[player.category]} opacity={activePlayer?.name === player.name ? 1 : 0.82}>
                <title>{`${player.name}: ${player.scaleRationale ?? 'Scale rationale unavailable.'} ${player.momentumRationale ?? 'Momentum rationale unavailable.'}`}</title>
              </circle>
              <text
                x={Math.min(PLOT_RIGHT - 8, point.x + 10)}
                y={Math.max(PLOT_TOP + 12, point.y - 10)}
                className="mono"
                style={{ fontSize: 10, fill: 'var(--text)' }}
              >
                {player.name}
              </text>
            </g>
          )
        })}
      </svg>

      {plottedPlayers.length > 0 && activePlayer && (
        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {plottedPlayers.map((player) => (
              <button
                key={player.name}
                type="button"
                onMouseEnter={() => setActivePlayerName(player.name)}
                onFocus={() => setActivePlayerName(player.name)}
                onClick={() => setActivePlayerName(player.name)}
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  activePlayer.name === player.name ? 'border-[var(--accent)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                {player.name}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--text)]">{activePlayer.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            <strong className="text-[var(--text)]">Scale:</strong> {activePlayer.scaleRationale ?? 'Scale rationale unavailable.'}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
            <strong className="text-[var(--text)]">Momentum:</strong> {activePlayer.momentumRationale ?? 'Momentum rationale unavailable.'}
          </p>
        </div>
      )}

      {unplottedPlayers.length > 0 && (
        <div className="mt-3 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-4 py-4">
          <p className="kicker">Unplotted</p>
          <div className="mt-3 grid gap-2">
            {unplottedPlayers.map((player) => (
              <div key={player.name} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3">
                <p className="text-sm font-medium text-[var(--text)]">{player.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{getUnplottedReason(player)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
