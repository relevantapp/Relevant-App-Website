'use client'

import { useMemo, useState } from 'react'
import type { BriefSource, MarketMap, MarketPlayerTile } from '@/lib/intelligence/contracts'
import ExhibitShell from '../ExhibitShell'

interface LogoMarketMapProps {
  data: MarketMap
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

interface ActiveTile extends MarketPlayerTile {
  segment: string
  rationale: string
}

type TileVisual =
  | { kind: 'image'; src: string }
  | { kind: 'initials' }

function getDetailUrl(domain: string | null) {
  if (!domain) return null
  if (domain.startsWith('http://') || domain.startsWith('https://')) return domain
  return `https://${domain}`
}

export function getFaviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

export function getTileInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getInitialTileVisual(tile: MarketPlayerTile): TileVisual {
  if (tile.logoUrl) return { kind: 'image', src: tile.logoUrl }
  if (tile.domain) return { kind: 'image', src: getFaviconUrl(tile.domain) }
  return { kind: 'initials' }
}

function LogoTileArt({ player }: { player: MarketPlayerTile }) {
  const [visual, setVisual] = useState<TileVisual>(() => getInitialTileVisual(player))

  if (visual.kind === 'initials') {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)]">
        {getTileInitials(player.name)}
      </span>
    )
  }

  return (
    <img
      src={visual.src}
      alt=""
      className="h-11 w-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] object-contain p-2 [filter:grayscale(1)_sepia(0.3)_saturate(0.55)]"
      onError={() => {
        if (player.domain && visual.src !== getFaviconUrl(player.domain)) {
          setVisual({ kind: 'image', src: getFaviconUrl(player.domain) })
          return
        }
        setVisual({ kind: 'initials' })
      }}
    />
  )
}

export default function LogoMarketMap({ data, headline, subhead, asOf, sources }: LogoMarketMapProps) {
  const [openSegment, setOpenSegment] = useState<string | null>(null)
  const allTiles = useMemo<ActiveTile[]>(
    () =>
      data.segments.flatMap((segment) =>
        segment.players.map((player) => ({
          ...player,
          segment: segment.name,
          rationale: segment.rationale,
        })),
      ),
    [data.segments],
  )
  const [activePlayerName, setActivePlayerName] = useState<string | null>(allTiles[0]?.name ?? null)
  const activeTile = allTiles.find((tile) => tile.name === activePlayerName) ?? allTiles[0] ?? null

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]"
        role="img"
        aria-label={`${headline}: ${data.segments.map((segment) => `${segment.name} with ${segment.players.length} players`).join('; ')}`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {data.segments.map((segment) => {
            const tooltipId = `segment-rationale-${segment.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
            const isOpen = openSegment === segment.name

            return (
              <section
                key={segment.name}
                className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="kicker">Segment</p>
                    <h3 className="mt-2 text-base font-semibold text-[var(--text)]">{segment.name}</h3>
                  </div>
                  <span
                    className="relative"
                    onMouseEnter={() => setOpenSegment(segment.name)}
                    onMouseLeave={() => setOpenSegment((current) => (current === segment.name ? null : current))}
                  >
                    <button
                      type="button"
                      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--text-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      aria-describedby={isOpen ? tooltipId : undefined}
                      onFocus={() => setOpenSegment(segment.name)}
                      onBlur={() => setOpenSegment((current) => (current === segment.name ? null : current))}
                      onClick={() => setOpenSegment((current) => (current === segment.name ? null : segment.name))}
                    >
                      Why this segment
                    </button>
                    {isOpen ? (
                      <div
                        id={tooltipId}
                        role="tooltip"
                        className="absolute right-0 top-[calc(100%+0.5rem)] z-10 w-60 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-relaxed text-[var(--text-muted)] shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
                      >
                        {segment.rationale}
                      </div>
                    ) : null}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {segment.players.map((player) => {
                    const isActive = activeTile?.name === player.name

                    return (
                      <button
                        key={`${segment.name}-${player.name}`}
                        type="button"
                        className={`flex min-h-[88px] items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                          isActive
                            ? 'border-[var(--accent)] bg-[var(--surface)]'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                        }`}
                        onClick={() => setActivePlayerName(player.name)}
                      >
                        <LogoTileArt player={player} />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-snug text-[var(--text)]">{player.name}</span>
                          <span className="mt-1 block text-xs text-[var(--text-soft)]">
                            {player.domain ?? 'detail unavailable'}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <aside className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 xl:sticky xl:top-6 xl:self-start">
          <p className="kicker">Player detail</p>
          {activeTile ? (
            <>
              <div className="mt-4 flex items-center gap-3">
                <LogoTileArt player={activeTile} />
                <div>
                  <p className="text-base font-semibold text-[var(--text)]">{activeTile.name}</p>
                  <p className="text-sm text-[var(--text-soft)]">{activeTile.segment}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{activeTile.rationale}</p>
              {getDetailUrl(activeTile.domain) ? (
                <a
                  href={getDetailUrl(activeTile.domain) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded-full border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] underline-offset-2 hover:underline"
                >
                  Open player detail
                </a>
              ) : (
                <p className="mt-4 text-sm text-[var(--text-soft)]">No player detail link available.</p>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm text-[var(--text-muted)]">No players mapped yet.</p>
          )}
        </aside>
      </div>
    </ExhibitShell>
  )
}
