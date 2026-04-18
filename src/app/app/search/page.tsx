'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Clock, Loader2, Building2, Hash, Users, Landmark,
  TrendingUp, Cpu, BarChart3, ArrowLeft, Plus, Check, Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { getValidAccessToken } from '@/lib/supabase'
import type { ProBriefItem } from '@/types/signals'
import SignalCard from '@/components/app/SignalCard'

// ─── Constants ────────────────────────────────────────────────────────────────

const RECENT_SEARCHES_KEY = 'relevant_recent_searches'
const MAX_RECENT = 5
const DEBOUNCE_MS = 300

const SIGNAL_SELECT = 'event_id, headline, what_happened, why_it_matters, why_showing, synthesis, sources, consequence_steps, image_url, published_at, signal_date, source_count, update_count, trajectory, is_developing, created_at, updated_at' as const

const CATEGORY_ORDER = [
  'company', 'topic', 'person', 'policy',
  'economic_indicator', 'technology', 'market',
] as const

type CategoryKey = typeof CATEGORY_ORDER[number]

const CATEGORY_META: Record<CategoryKey, {
  label: string
  singular: string
  icon: typeof Building2
  accent: string
  gradient: string
  description: string
}> = {
  company: {
    label: 'Companies',
    singular: 'Company',
    icon: Building2,
    accent: 'var(--accent-teal)',
    gradient: 'from-teal-900/80 to-teal-700/40',
    description: 'Companies that move your work',
  },
  topic: {
    label: 'Topics',
    singular: 'Topic',
    icon: Hash,
    accent: 'var(--accent-coral)',
    gradient: 'from-rose-900/80 to-rose-700/40',
    description: 'Themes and shifts on your radar',
  },
  person: {
    label: 'People',
    singular: 'Person',
    icon: Users,
    accent: 'var(--accent-violet)',
    gradient: 'from-violet-900/80 to-violet-700/40',
    description: 'People whose decisions matter',
  },
  policy: {
    label: 'Policy',
    singular: 'Policy',
    icon: Landmark,
    accent: 'var(--accent-amber)',
    gradient: 'from-amber-900/80 to-amber-700/40',
    description: 'Rules that could change things',
  },
  economic_indicator: {
    label: 'Economic Indicators',
    singular: 'Indicator',
    icon: TrendingUp,
    accent: 'var(--accent-teal)',
    gradient: 'from-emerald-900/80 to-emerald-700/40',
    description: 'Numbers that show direction',
  },
  technology: {
    label: 'Technology',
    singular: 'Technology',
    icon: Cpu,
    accent: 'var(--accent-coral)',
    gradient: 'from-orange-900/80 to-orange-700/40',
    description: 'Tools and breakthroughs to watch',
  },
  market: {
    label: 'Markets',
    singular: 'Market',
    icon: BarChart3,
    accent: 'var(--accent-lime)',
    gradient: 'from-lime-900/80 to-lime-700/40',
    description: 'Sectors you want to understand early',
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DimensionRow = {
  id: string
  category: string
  value: string
  normalized_value: string | null
}

type DimensionTile = {
  id: string
  category: CategoryKey
  value: string
  normalizedValue: string
  signalCount: number
  imageUrl: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(input: string): string {
  return input.replace(/[<>"']/g, '').trim()
}

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? (JSON.parse(stored) as string[]).slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query)
  recent.unshift(query)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

function mapRow(row: Record<string, unknown>): ProBriefItem {
  return {
    id: row.event_id as string,
    headline: row.headline as string,
    what_happened: Array.isArray(row.what_happened) ? row.what_happened as string[] : [],
    why_it_matters: Array.isArray(row.why_it_matters) ? row.why_it_matters as string[] : [],
    why_showing: (row.why_showing as string) || '',
    synthesis: row.synthesis as string | null,
    sources: Array.isArray(row.sources) ? row.sources as ProBriefItem['sources'] : [],
    consequence_steps: Array.isArray(row.consequence_steps) ? row.consequence_steps as ProBriefItem['consequence_steps'] : [],
    imageUrl: row.image_url as string | null,
    publishedAt: row.published_at as string | null,
    signalDate: row.signal_date as string | null,
    sourceCount: row.source_count as number | null,
    updateCount: row.update_count as number | null,
    trajectory: row.trajectory as string | null,
    isDeveloping: row.is_developing as boolean | undefined,
    deliveredAt: row.created_at as string | null,
    updatedAt: row.updated_at as string | null,
  }
}

function getMonogram(value: string): string {
  const words = value.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return value.slice(0, 2).toUpperCase()
}

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 50%, 25%)`
}

// ─── Search state type ────────────────────────────────────────────────────────

type SearchState = 'idle' | 'loading' | 'results' | 'empty'
type ViewMode = 'home' | 'search' | 'category'

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter()
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProBriefItem[]>([])
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dimension tiles state
  const [dimensionTiles, setDimensionTiles] = useState<DimensionTile[]>([])
  const [tilesLoading, setTilesLoading] = useState(true)

  // Category drill-down state
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null)
  const [activeDimension, setActiveDimension] = useState<DimensionTile | null>(null)
  const [categorySignals, setCategorySignals] = useState<ProBriefItem[]>([])
  const [categoryLoading, setCategoryLoading] = useState(false)

  // Add topic state
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [addCategory, setAddCategory] = useState<CategoryKey>('topic')
  const [addValue, setAddValue] = useState('')
  const [addWhy, setAddWhy] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  const viewMode: ViewMode = useMemo(() => {
    if (activeDimension) return 'category'
    if (query.trim().length > 0) return 'search'
    return 'home'
  }, [activeDimension, query])

  // ── Load recent searches ────────────────────────────────────────────────
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // ── Load dimension tiles with images ────────────────────────────────────
  useEffect(() => {
    if (!user) return

    async function loadDimensionTiles() {
      setTilesLoading(true)
      try {
        // Fetch active dimensions
        const { data: dims } = await supabase
          .from('pro_influence_dimensions')
          .select('id, category, value, normalized_value')
          .eq('user_id', user!.id)
          .eq('is_active', true)
          .eq('user_dismissed', false)

        if (!dims || dims.length === 0) {
          setDimensionTiles([])
          setTilesLoading(false)
          return
        }

        // Fetch recent signals for images + counts
        const { data: signals } = await supabase
          .from('signal_items')
          .select('why_showing, image_url')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(500)

        const tiles: DimensionTile[] = (dims as DimensionRow[]).map((d) => {
          const nv = (d.normalized_value || '').toLowerCase()
          let signalCount = 0
          let imageUrl: string | null = null

          if (signals) {
            for (const s of signals) {
              const ws = ((s.why_showing as string) ?? '').toLowerCase()
              if (ws.includes(nv)) {
                signalCount++
                if (!imageUrl && s.image_url) {
                  imageUrl = s.image_url as string
                }
              }
            }
          }

          return {
            id: d.id as string,
            category: d.category as CategoryKey,
            value: d.value as string,
            normalizedValue: nv,
            signalCount,
            imageUrl,
          }
        })

        // Sort: most signals first
        tiles.sort((a, b) => b.signalCount - a.signalCount)
        setDimensionTiles(tiles)
      } catch (e) {
        console.error('Failed to load dimension tiles:', e)
      } finally {
        setTilesLoading(false)
      }
    }

    void loadDimensionTiles()
  }, [user])

  // ── Full-text search ────────────────────────────────────────────────────
  const performSearch = useCallback(async (searchQuery: string) => {
    const clean = sanitize(searchQuery)
    if (!clean || clean.length < 2) {
      setResults([])
      setSearchState('idle')
      return
    }

    setSearchState('loading')

    try {
      const { data, error } = await supabase
        .from('signal_items')
        .select(SIGNAL_SELECT)
        .textSearch('headline', clean, { type: 'websearch' })
        .limit(30)

      let items = data

      if (!error && (!items || items.length === 0)) {
        const { data: fallbackData } = await supabase
          .from('signal_items')
          .select(SIGNAL_SELECT)
          .ilike('headline', `%${clean}%`)
          .limit(30)
        items = fallbackData
      }

      if (error) {
        console.error('Search error:', error)
        setResults([])
        setSearchState('empty')
        return
      }

      const mapped = (items || []).map((row: Record<string, unknown>) => mapRow(row))
      setResults(mapped)
      setSearchState(mapped.length > 0 ? 'results' : 'empty')

      if (mapped.length > 0) {
        saveRecentSearch(clean)
        setRecentSearches(getRecentSearches())
      }
    } catch {
      setResults([])
      setSearchState('empty')
    }
  }, [])

  // ── Dimension drill-down ────────────────────────────────────────────────
  const openDimension = useCallback(async (tile: DimensionTile) => {
    if (!user) return
    setActiveDimension(tile)
    setCategoryLoading(true)

    try {
      const { data: signals } = await supabase
        .from('signal_items')
        .select(SIGNAL_SELECT)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)

      const matched = (signals ?? [])
        .filter((s: Record<string, unknown>) => {
          const ws = ((s.why_showing as string) ?? '').toLowerCase()
          return ws.includes(tile.normalizedValue)
        })
        .map((row: Record<string, unknown>) => mapRow(row))

      setCategorySignals(matched)
    } catch (e) {
      console.error('Failed to load dimension signals:', e)
      setCategorySignals([])
    } finally {
      setCategoryLoading(false)
    }
  }, [user])

  const closeDimension = useCallback(() => {
    setActiveDimension(null)
    setCategorySignals([])
  }, [])

  // ── Add topic handler ───────────────────────────────────────────────────
  const handleAddTopic = useCallback(async () => {
    if (!addValue.trim()) return
    setAddLoading(true)

    try {
      const token = await getValidAccessToken(60)
      if (!token) return

      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: addCategory,
          value: addValue.trim(),
          consequenceChain: addWhy.trim() || undefined,
        }),
      })

      if (res.ok) {
        setAddSuccess(true)
        setAddValue('')
        setAddWhy('')
        // Refresh tiles after short delay
        setTimeout(() => {
          setAddSuccess(false)
          setShowAddTopic(false)
          // Trigger re-fetch by clearing and reloading
          setDimensionTiles([])
          setTilesLoading(true)
        }, 1200)
      }
    } catch (e) {
      console.error('Failed to add topic:', e)
    } finally {
      setAddLoading(false)
    }
  }, [addCategory, addValue, addWhy])

  // Refresh tiles when addSuccess triggers re-load
  useEffect(() => {
    if (tilesLoading && user && dimensionTiles.length === 0) {
      // Re-run the tile loader
      const reload = async () => {
        try {
          const { data: dims } = await supabase
            .from('pro_influence_dimensions')
            .select('id, category, value, normalized_value')
            .eq('user_id', user!.id)
            .eq('is_active', true)
            .eq('user_dismissed', false)

          if (!dims || dims.length === 0) {
            setDimensionTiles([])
            setTilesLoading(false)
            return
          }

          const { data: signals } = await supabase
            .from('signal_items')
            .select('why_showing, image_url')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(500)

          const tiles: DimensionTile[] = (dims as DimensionRow[]).map((d) => {
            const nv = (d.normalized_value || '').toLowerCase()
            let signalCount = 0
            let imageUrl: string | null = null

            if (signals) {
              for (const s of signals as Array<{ why_showing: string | null; image_url: string | null }>) {
                const ws = (s.why_showing ?? '').toLowerCase()
                if (ws.includes(nv)) {
                  signalCount++
                  if (!imageUrl && s.image_url) {
                    imageUrl = s.image_url as string
                  }
                }
              }
            }

            return {
              id: d.id as string,
              category: d.category as CategoryKey,
              value: d.value as string,
              normalizedValue: nv,
              signalCount,
              imageUrl,
            }
          })

          tiles.sort((a, b) => b.signalCount - a.signalCount)
          setDimensionTiles(tiles)
        } catch (e) {
          console.error('Failed to reload tiles:', e)
        } finally {
          setTilesLoading(false)
        }
      }
      void reload()
    }
  }, [tilesLoading, user, dimensionTiles.length])

  // ── Input handlers ──────────────────────────────────────────────────────
  const handleInputChange = (value: string) => {
    setQuery(value)
    if (activeDimension) closeDimension()
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setResults([])
      setSearchState('idle')
      return
    }

    debounceRef.current = setTimeout(() => {
      void performSearch(value)
    }, DEBOUNCE_MS)
  }

  const handleRecentClick = (search: string) => {
    setQuery(search)
    void performSearch(search)
  }

  const handleClearRecent = () => {
    clearRecentSearches()
    setRecentSearches([])
  }

  const handleClearAll = () => {
    setQuery('')
    setResults([])
    setSearchState('idle')
    closeDimension()
    inputRef.current?.focus()
  }

  // ── Group tiles by category for display ─────────────────────────────────
  const tilesByCategory = useMemo(() => {
    const map = new Map<CategoryKey, DimensionTile[]>()
    for (const tile of dimensionTiles) {
      const arr = map.get(tile.category) || []
      arr.push(tile)
      map.set(tile.category, arr)
    }
    return map
  }, [dimensionTiles])

  const ADD_CATEGORIES: Array<{ key: CategoryKey; label: string }> = [
    { key: 'company', label: 'Company' },
    { key: 'topic', label: 'Topic' },
    { key: 'person', label: 'Person' },
    { key: 'policy', label: 'Policy' },
    { key: 'technology', label: 'Technology' },
    { key: 'market', label: 'Market' },
  ]

  return (
    <div className="mx-auto max-w-6xl py-6 sm:px-2 sm:py-8 lg:px-4">
      {/* Search input */}
      <div className="relative mb-8">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search topics, companies, people, or trends…"
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] py-4 pl-12 pr-12 text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        {query && (
          <button
            onClick={handleClearAll}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Dimension drill-down view ─────────────────────────────────────── */}
      {viewMode === 'category' && activeDimension && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            onClick={closeDimension}
            className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Back to explore
          </button>

          <div className="mb-6 flex items-center gap-3">
            {activeDimension.imageUrl ? (
              <div className="h-12 w-12 overflow-hidden rounded-xl">
                <img src={activeDimension.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: hashColor(activeDimension.value) }}
              >
                {getMonogram(activeDimension.value)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">{activeDimension.value}</h2>
              <p className="text-xs text-[var(--text-soft)]">
                {activeDimension.signalCount} signal{activeDimension.signalCount !== 1 ? 's' : ''} · {CATEGORY_META[activeDimension.category]?.label}
              </p>
            </div>
          </div>

          {categoryLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
            </div>
          ) : categorySignals.length === 0 ? (
            <p className="py-20 text-center text-sm text-[var(--text-soft)]">
              No signals for this topic yet
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {categorySignals.map((item, idx) => (
                  <SignalCard
                    key={item.id}
                    signal={item}
                    index={idx}
                    onClick={() => router.push(`/app/signal/${item.id}`)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Search loading ────────────────────────────────────────────────── */}
      {viewMode === 'search' && searchState === 'loading' && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
        </div>
      )}

      {/* ── Search results ────────────────────────────────────────────────── */}
      {viewMode === 'search' && searchState === 'results' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <p className="mb-4 text-xs text-[var(--text-soft)]">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {results.map((item, idx) => (
                <SignalCard
                  key={item.id}
                  signal={item}
                  index={idx}
                  onClick={() => router.push(`/app/signal/${item.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Empty search results ──────────────────────────────────────────── */}
      {viewMode === 'search' && searchState === 'empty' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-20"
        >
          <Search size={32} className="mb-3 text-[var(--text-soft)]" />
          <p className="text-sm text-[var(--text-soft)]">No signals match &ldquo;{query}&rdquo;</p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">Try a different term or browse your topics below</p>
        </motion.div>
      )}

      {/* ── Home / idle view ──────────────────────────────────────────────── */}
      {viewMode === 'home' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--text-muted)]">Recent searches</h3>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-[var(--text-soft)] hover:text-[var(--text-muted)]"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleRecentClick(search)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                  >
                    <Clock size={12} />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Header with Add Topic button */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Your Topics</h2>
              <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                {dimensionTiles.length} topic{dimensionTiles.length !== 1 ? 's' : ''} you&apos;re tracking
              </p>
            </div>
            <button
              onClick={() => setShowAddTopic(!showAddTopic)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              <Plus size={16} />
              Follow something new
            </button>
          </div>

          {/* ── Add Topic Form ──────────────────────────────────────────── */}
          <AnimatePresence>
            {showAddTopic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-6">
                  {addSuccess ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center py-4"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-teal/20">
                        <Check size={24} className="text-accent-teal" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text)]">Topic added!</p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">Signals will start appearing soon</p>
                    </motion.div>
                  ) : (
                    <>
                      <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">
                        <Sparkles size={14} className="mr-1.5 inline text-accent-amber" />
                        Add a topic to follow
                      </h3>

                      {/* Category pills */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        {ADD_CATEGORIES.map((cat) => {
                          const meta = CATEGORY_META[cat.key]
                          const Icon = meta.icon
                          const active = addCategory === cat.key
                          return (
                            <button
                              key={cat.key}
                              onClick={() => setAddCategory(cat.key)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                active
                                  ? 'border-2 text-[var(--text)]'
                                  : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                              }`}
                              style={active ? { borderColor: meta.accent, background: `color-mix(in srgb, ${meta.accent} 10%, transparent)` } : undefined}
                            >
                              <Icon size={14} style={active ? { color: meta.accent } : undefined} />
                              {cat.label}
                            </button>
                          )
                        })}
                      </div>

                      {/* Topic name input */}
                      <input
                        type="text"
                        value={addValue}
                        onChange={(e) => setAddValue(e.target.value)}
                        placeholder={`e.g. ${addCategory === 'company' ? 'Apple, Tesla, OpenAI' : addCategory === 'person' ? 'Satya Nadella, Jensen Huang' : addCategory === 'topic' ? 'AI regulation, remote work trends' : addCategory === 'policy' ? 'EU AI Act, GDPR enforcement' : addCategory === 'technology' ? 'LLM training, edge computing' : 'SaaS valuations, semiconductor market'}`}
                        className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
                        onKeyDown={(e) => { if (e.key === 'Enter' && addValue.trim()) handleAddTopic() }}
                      />

                      {/* Why it matters (optional) */}
                      <textarea
                        value={addWhy}
                        onChange={(e) => setAddWhy(e.target.value)}
                        placeholder="Why does this matter to you? (optional)"
                        rows={2}
                        className="mb-4 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
                      />

                      {/* Submit */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          onClick={() => setShowAddTopic(false)}
                          className="text-left text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddTopic}
                          disabled={!addValue.trim() || addLoading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-blue px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
                        >
                          {addLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                          Add {CATEGORY_META[addCategory]?.singular}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Topic tiles grid (image-based like mobile) ─────────────── */}
          {tilesLoading ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] animate-pulse rounded-2xl bg-[var(--surface)]"
                />
              ))}
            </div>
          ) : dimensionTiles.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <Sparkles size={32} className="mb-3 text-[var(--text-soft)]" />
              <p className="text-sm font-medium text-[var(--text)]">No topics yet</p>
              <p className="mt-1 text-xs text-[var(--text-soft)]">Start following companies, people, and trends to see them here</p>
              <button
                onClick={() => setShowAddTopic(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Plus size={16} />
                Follow your first topic
              </button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {dimensionTiles.map((tile, idx) => {
                const meta = CATEGORY_META[tile.category]
                return (
                  <motion.button
                    key={tile.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    onClick={() => void openDimension(tile)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl text-left transition-transform hover:scale-[1.02]"
                  >
                    {/* Background: image or gradient monogram */}
                    {tile.imageUrl ? (
                      <img
                        src={tile.imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: hashColor(tile.value) }}
                      >
                        <span className="text-3xl font-bold text-white/30">
                          {getMonogram(tile.value)}
                        </span>
                      </div>
                    )}

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Signal count badge */}
                    {tile.signalCount > 0 && (
                      <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                        {tile.signalCount} {tile.signalCount === 1 ? 'story' : 'stories'}
                      </div>
                    )}

                    {/* Category badge */}
                    <div
                      className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
                      style={{
                        background: `color-mix(in srgb, ${meta.accent} 30%, transparent)`,
                        color: 'white',
                      }}
                    >
                      {meta.singular}
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">
                        {tile.value}
                      </h3>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
