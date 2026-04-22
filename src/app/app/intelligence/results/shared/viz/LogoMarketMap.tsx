'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BriefSource, MarketMap, MarketPlayer, MarketPlayerTile } from '@/lib/intelligence/contracts'
import ExhibitShell from '../ExhibitShell'

interface LogoMarketMapProps {
  data: MarketMap
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
  playerDetails?: MarketPlayer[]
}

interface ActiveTile extends MarketPlayerTile {
  segment: string
  rationale: string
  stage: string | null
  geography: string[]
}

type TileVisual =
  | { kind: 'image'; src: string }
  | { kind: 'initials' }

type FilterState = {
  segment: string | null
  stage: string | null
  geography: string | null
}

const FILTER_PARAM_KEYS = {
  segment: 'mrSegment',
  stage: 'mrStage',
  geography: 'mrGeo',
} as const

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

function normalizeFilterValue(value: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function readUrlFilters(): FilterState {
  if (typeof window === 'undefined') {
    return { segment: null, stage: null, geography: null }
  }

  const params = new URLSearchParams(window.location.search)

  return {
    segment: normalizeFilterValue(params.get(FILTER_PARAM_KEYS.segment)),
    stage: normalizeFilterValue(params.get(FILTER_PARAM_KEYS.stage)),
    geography: normalizeFilterValue(params.get(FILTER_PARAM_KEYS.geography)),
  }
}

function writeUrlFilters(filters: FilterState) {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)

  for (const [key, paramKey] of Object.entries(FILTER_PARAM_KEYS) as Array<[keyof FilterState, string]>) {
    const value = filters[key]
    if (value) {
      params.set(paramKey, value)
    } else {
      params.delete(paramKey)
    }
  }

  const query = params.toString()
  const hash = window.location.hash
  const nextUrl = query
    ? `${window.location.pathname}?${query}${hash}`
    : `${window.location.pathname}${hash}`

  window.history.replaceState(window.history.state, '', nextUrl)
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b))
}

function sanitizeFilterValue(value: string | null, options: string[]) {
  return value && options.includes(value) ? value : null
}

function formatStageLabel(stage: string) {
  return stage
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
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

export default function LogoMarketMap({ data, headline, subhead, asOf, sources, playerDetails }: LogoMarketMapProps) {
  const [openSegment, setOpenSegment] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(() => readUrlFilters())
  const playerDetailsByName = useMemo(
    () => new Map((playerDetails ?? []).map((player) => [player.name, player])),
    [playerDetails],
  )
  const allTiles = useMemo<ActiveTile[]>(
    () =>
      data.segments.flatMap((segment) =>
        segment.players.map((player) => ({
          ...player,
          segment: segment.name,
          rationale: segment.rationale,
          stage: playerDetailsByName.get(player.name)?.category ?? null,
          geography: player.geography ?? [],
        })),
      ),
    [data.segments, playerDetailsByName],
  )
  const segmentOptions = useMemo(
    () => uniqueStrings(data.segments.map((segment) => segment.name)),
    [data.segments],
  )
  const stageOptions = useMemo(
    () => uniqueStrings(allTiles.map((tile) => tile.stage)),
    [allTiles],
  )
  const geographyOptions = useMemo(
    () => uniqueStrings(allTiles.flatMap((tile) => tile.geography)),
    [allTiles],
  )
  const activeFilters = {
    segment: sanitizeFilterValue(filters.segment, segmentOptions),
    stage: sanitizeFilterValue(filters.stage, stageOptions),
    geography: sanitizeFilterValue(filters.geography, geographyOptions),
  } satisfies FilterState
  const filteredTiles = allTiles.filter((tile) => {
    if (activeFilters.segment && tile.segment !== activeFilters.segment) return false
    if (activeFilters.stage && tile.stage !== activeFilters.stage) return false
    if (activeFilters.geography && !tile.geography.includes(activeFilters.geography)) return false
    return true
  })
  const filteredTileNames = new Set(filteredTiles.map((tile) => tile.name))
  const filteredSegments = data.segments
    .map((segment) => ({
      ...segment,
      players: segment.players.filter((player) => filteredTileNames.has(player.name)),
    }))
    .filter((segment) => segment.players.length > 0)
  const [activePlayerName, setActivePlayerName] = useState<string | null>(allTiles[0]?.name ?? null)
  const activeTile = filteredTiles.find((tile) => tile.name === activePlayerName) ?? filteredTiles[0] ?? null
  const hasActiveFilters = Boolean(activeFilters.segment || activeFilters.stage || activeFilters.geography)

  useEffect(() => {
    const nextFilters = readUrlFilters()
    setFilters(nextFilters)

    const handlePopState = () => {
      setFilters(readUrlFilters())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (
      filters.segment === activeFilters.segment &&
      filters.stage === activeFilters.stage &&
      filters.geography === activeFilters.geography
    ) {
      return
    }

    setFilters(activeFilters)
    writeUrlFilters(activeFilters)
  }, [activeFilters, filters])

  useEffect(() => {
    if (!filteredSegments.some((segment) => segment.name === openSegment)) {
      setOpenSegment(null)
    }
  }, [filteredSegments, openSegment])

  useEffect(() => {
    if (!filteredTiles.length) {
      setActivePlayerName(null)
      return
    }

    if (!activePlayerName || !filteredTiles.some((tile) => tile.name === activePlayerName)) {
      setActivePlayerName(filteredTiles[0]?.name ?? null)
    }
  }, [activePlayerName, filteredTiles])

  const updateFilter = (key: keyof FilterState, value: string) => {
    const nextFilters = {
      ...filters,
      [key]: value || null,
    }

    setFilters(nextFilters)
    writeUrlFilters(nextFilters)
  }

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-[180px] flex-col gap-2 text-sm text-[var(--text-muted)]">
          <span className="kicker">Segment</span>
          <select
            value={activeFilters.segment ?? ''}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onChange={(event) => updateFilter('segment', event.currentTarget.value)}
          >
            <option value="">All segments</option>
            {segmentOptions.map((segment) => (
              <option key={segment} value={segment}>
                {segment}
              </option>
            ))}
          </select>
        </label>

        {stageOptions.length ? (
          <label className="flex min-w-[160px] flex-col gap-2 text-sm text-[var(--text-muted)]">
            <span className="kicker">Stage</span>
            <select
              value={activeFilters.stage ?? ''}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm capitalize text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => updateFilter('stage', event.currentTarget.value)}
            >
              <option value="">All stages</option>
              {stageOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {formatStageLabel(stage)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {geographyOptions.length ? (
          <label className="flex min-w-[160px] flex-col gap-2 text-sm text-[var(--text-muted)]">
            <span className="kicker">Geography</span>
            <select
              value={activeFilters.geography ?? ''}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => updateFilter('geography', event.currentTarget.value)}
            >
              <option value="">All geographies</option>
              {geographyOptions.map((geography) => (
                <option key={geography} value={geography}>
                  {geography}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">
            {filteredTiles.length} players shown
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onClick={() => {
                const nextFilters = { segment: null, stage: null, geography: null }
                setFilters(nextFilters)
                writeUrlFilters(nextFilters)
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]"
        role="img"
        aria-label={`${headline}: ${filteredSegments.map((segment) => `${segment.name} with ${segment.players.length} players`).join('; ')}`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSegments.length ? filteredSegments.map((segment) => {
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
                            {[allTiles.find((tile) => tile.name === player.name)?.stage, player.domain ?? 'detail unavailable']
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          }) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-muted)]">
              No players match the current market-map filters.
            </div>
          )}
        </div>

        <aside className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 xl:sticky xl:top-6 xl:self-start">
          <p className="kicker">Player detail</p>
          {activeTile ? (
            <>
              <div className="mt-4 flex items-center gap-3">
                <LogoTileArt player={activeTile} />
                <div>
                  <p className="text-base font-semibold text-[var(--text)]">{activeTile.name}</p>
                  <p className="text-sm text-[var(--text-soft)]">
                    {[
                      activeTile.segment,
                      activeTile.stage ? formatStageLabel(activeTile.stage) : null,
                      activeTile.geography[0] ?? null,
                    ].filter(Boolean).join(' · ')}
                  </p>
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
