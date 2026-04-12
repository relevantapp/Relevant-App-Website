'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, X, BookOpen, Loader2, Search, Pin, PinOff,
  Bookmark, PenLine, Mic, MessageSquare, SlidersHorizontal,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

/* ── Types (mirrors mobile NoteRow) ─────────────────────────────── */

type NoteOrigin = 'feed_save' | 'composer' | 'share_sheet' | 'widget' | 'prompt' | 'voice'

type NoteRow = {
  id: string
  user_id: string
  week_key: string
  entry_type: string
  content: string
  source_ref: string | null
  source_headline: string | null
  origin: NoteOrigin
  is_prompt_response: boolean
  prompt_text: string | null
  created_at: string
  mood: number | null
  raw_content: string | null
  polished_content: string | null
  is_polished: boolean
  is_pinned: boolean
  tags: string[]
}

type FilterKey = 'all' | 'feed_save' | 'composer' | 'voice' | 'prompt'

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <SlidersHorizontal size={14} /> },
  { key: 'feed_save', label: 'Saved', icon: <Bookmark size={14} /> },
  { key: 'composer', label: 'Notes', icon: <PenLine size={14} /> },
  { key: 'voice', label: 'Voice', icon: <Mic size={14} /> },
  { key: 'prompt', label: 'Prompts', icon: <MessageSquare size={14} /> },
]

const PAGE_SIZE = 40

/* ── Helpers ─────────────────────────────────────────────────────── */

function noteTitle(note: NoteRow): string {
  if (note.source_headline) return note.source_headline
  const first = (note.polished_content || note.content || '').split('\n')[0]
  return first.length > 80 ? first.slice(0, 80) + '…' : first || 'Untitled'
}

function noteBody(note: NoteRow): string {
  const text = note.polished_content || note.content || ''
  const lines = text.split('\n').filter(Boolean)
  return lines.length > 1 ? lines.slice(1).join(' ') : lines[0] || ''
}

function originLabel(o: NoteOrigin): string {
  const m: Record<NoteOrigin, string> = {
    feed_save: 'Saved',
    composer: 'Note',
    share_sheet: 'Shared',
    widget: 'Widget',
    prompt: 'Prompt',
    voice: 'Voice',
  }
  return m[o] || o
}

function originColor(o: NoteOrigin): string {
  const m: Record<NoteOrigin, string> = {
    feed_save: 'var(--accent-teal)',
    composer: 'var(--accent)',
    share_sheet: 'var(--accent-violet)',
    widget: 'var(--accent-amber)',
    prompt: 'var(--accent-coral)',
    voice: 'var(--accent-lime)',
  }
  return m[o] || 'var(--text-muted)'
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getWeekKey(): string {
  const d = new Date()
  const year = d.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/* ── Component ───────────────────────────────────────────────────── */

export default function JournalPage() {
  const { user } = useAuth()

  // Data
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [comingSoon, setComingSoon] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  // UI state
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Composer
  const [compContent, setCompContent] = useState('')
  const [compTags, setCompTags] = useState('')

  /* ── Fetch ────────────────────────────────────────────────────── */

  const fetchNotes = useCallback(async (pageNum: number, append: boolean) => {
    if (!user) return
    if (pageNum === 0) setLoading(true)

    try {
      const from = pageNum * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error } = await supabase
        .from('goal_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .neq('entry_type', 'weekly_summary')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setComingSoon(true)
        } else {
          console.error('Journal fetch error:', error)
        }
        if (!append) setNotes([])
        return
      }

      const rows = (data || []) as NoteRow[]
      setHasMore(rows.length === PAGE_SIZE)

      if (append) {
        setNotes(prev => [...prev, ...rows])
      } else {
        setNotes(rows)
      }
    } catch {
      if (!append) {
        setComingSoon(true)
        setNotes([])
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void fetchNotes(0, false)
  }, [fetchNotes])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    void fetchNotes(next, true)
  }

  /* ── Mutations ────────────────────────────────────────────────── */

  const handleSave = async () => {
    if (!user || !compContent.trim()) return
    setSaving(true)
    try {
      const tags = compTags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5)

      const { error } = await supabase
        .from('goal_journal_entries')
        .insert({
          user_id: user.id,
          content: compContent.trim(),
          entry_type: 'freeform',
          origin: 'composer',
          is_prompt_response: false,
          is_pinned: false,
          is_polished: false,
          tags,
          week_key: getWeekKey(),
          created_at: new Date().toISOString(),
        })

      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation')) {
          setComingSoon(true)
        } else {
          console.error('Save error:', error)
        }
        return
      }

      setCompContent('')
      setCompTags('')
      setShowComposer(false)
      setPage(0)
      void fetchNotes(0, false)
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePin = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const next = !note.is_pinned
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: next } : n))

    const { error } = await supabase
      .from('goal_journal_entries')
      .update({ is_pinned: next })
      .eq('id', noteId)

    if (error) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: !next } : n))
    }
  }

  const handleDelete = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('goal_journal_entries')
        .delete()
        .eq('id', noteId)

      if (error) {
        console.error('Delete error:', error)
        return
      }
      setDeleteConfirm(null)
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch {
      console.error('Delete failed')
    }
  }

  /* ── Derived data ─────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let list = notes

    // Origin filter
    if (filter === 'feed_save') list = list.filter(n => n.origin === 'feed_save')
    else if (filter === 'composer') list = list.filter(n => n.origin === 'composer' || n.origin === 'share_sheet' || n.origin === 'widget')
    else if (filter === 'voice') list = list.filter(n => n.origin === 'voice')
    else if (filter === 'prompt') list = list.filter(n => n.origin === 'prompt' || n.is_prompt_response)

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(n =>
        (n.content || '').toLowerCase().includes(q) ||
        (n.source_headline || '').toLowerCase().includes(q) ||
        n.tags.some(t => t.includes(q))
      )
    }

    return list
  }, [notes, filter, search])

  const pinnedNotes = useMemo(() => filtered.filter(n => n.is_pinned), [filtered])
  const unpinnedNotes = useMemo(() => filtered.filter(n => !n.is_pinned), [filtered])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    notes.forEach(n => n.tags?.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [notes])

  /* ── Coming Soon ──────────────────────────────────────────────── */

  if (comingSoon) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--text-soft)' }} />
          <h2 style={{ color: 'var(--text)' }} className="mb-2 text-xl font-semibold">Journal — Coming Soon</h2>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            Your personal note space is being built. Stay tuned.
          </p>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className="journal-shell">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="journal-sidebar">
        <div className="journal-sidebar-header">
          <h1 className="journal-title">Journal</h1>
          <button onClick={() => setShowComposer(true)} className="journal-new-btn" title="New Note">
            <Plus size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="journal-search-wrap">
          <Search size={14} className="journal-search-icon" />
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="journal-search-input"
          />
          {search && (
            <button onClick={() => setSearch('')} className="journal-search-clear">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="journal-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`journal-filter-btn ${filter === f.key ? 'active' : ''}`}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Pinned section */}
        {pinnedNotes.length > 0 && (
          <div className="journal-pinned-section">
            <p className="journal-section-label">
              <Pin size={11} /> Pinned
            </p>
            <div className="journal-pinned-list">
              {pinnedNotes.map(n => (
                <button key={n.id} className="journal-pinned-item" title={noteTitle(n)}>
                  <span className="journal-pinned-text">{noteTitle(n)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tag cloud */}
        {allTags.length > 0 && (
          <div className="journal-tags-section">
            <p className="journal-section-label">Tags</p>
            <div className="journal-tag-cloud">
              {allTags.slice(0, 20).map(t => (
                <button
                  key={t}
                  onClick={() => setSearch(search === t ? '' : t)}
                  className={`journal-tag-chip ${search === t ? 'active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="journal-sidebar-footer">
          <span className="journal-count">{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="journal-main">
        {/* Inline Composer */}
        <AnimatePresence>
          {showComposer && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="journal-composer"
            >
              <div className="journal-composer-header">
                <h3 className="journal-composer-title">New Note</h3>
                <button onClick={() => setShowComposer(false)} className="journal-composer-close">
                  <X size={16} />
                </button>
              </div>
              <textarea
                placeholder="Write your thoughts…"
                value={compContent}
                onChange={e => setCompContent(e.target.value)}
                rows={5}
                className="journal-composer-textarea"
                autoFocus
              />
              <div className="journal-composer-meta">
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={compTags}
                  onChange={e => setCompTags(e.target.value)}
                  className="journal-composer-tags-input"
                />
                <button
                  onClick={() => void handleSave()}
                  disabled={!compContent.trim() || saving}
                  className="journal-composer-save"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Save
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {filtered.length === 0 && !showComposer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="journal-empty">
            <BookOpen size={40} />
            <p className="journal-empty-title">
              {search ? 'No notes match your search' : 'No notes yet'}
            </p>
            <p className="journal-empty-sub">
              {search
                ? 'Try a different keyword or clear filters.'
                : 'Capture thoughts, save from your feed, or record a voice note in the app.'}
            </p>
            {!search && (
              <button onClick={() => setShowComposer(true)} className="journal-empty-cta">
                <Plus size={16} /> Write your first note
              </button>
            )}
          </motion.div>
        )}

        {/* Notes grid */}
        {filtered.length > 0 && (
          <div className="journal-grid">
            <AnimatePresence mode="popLayout">
              {[...pinnedNotes, ...unpinnedNotes].map((note, idx) => (
                <motion.article
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                  className={`journal-card ${note.is_pinned ? 'pinned' : ''}`}
                >
                  {/* Card top row */}
                  <div className="journal-card-top">
                    <span
                      className="journal-origin-badge"
                      style={{ '--badge-color': originColor(note.origin) } as React.CSSProperties}
                    >
                      {originLabel(note.origin)}
                    </span>
                    <div className="journal-card-actions">
                      <button
                        onClick={() => void handleTogglePin(note.id)}
                        className="journal-card-action"
                        title={note.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        {note.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                      </button>
                      {deleteConfirm === note.id ? (
                        <span className="journal-delete-confirm">
                          <button onClick={() => void handleDelete(note.id)} className="journal-delete-yes">Delete</button>
                          <button onClick={() => setDeleteConfirm(null)} className="journal-delete-no">Cancel</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(note.id)} className="journal-card-action journal-card-action-delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="journal-card-title">{noteTitle(note)}</h4>

                  {/* Body preview */}
                  {noteBody(note) && (
                    <p className="journal-card-body">{noteBody(note)}</p>
                  )}

                  {/* Prompt context */}
                  {note.is_prompt_response && note.prompt_text && (
                    <p className="journal-card-prompt">
                      <MessageSquare size={12} /> {note.prompt_text}
                    </p>
                  )}

                  {/* Tags + timestamp */}
                  <div className="journal-card-footer">
                    <div className="journal-card-tags">
                      {(note.tags || []).slice(0, 3).map(t => (
                        <span key={t} className="journal-card-tag">{t}</span>
                      ))}
                    </div>
                    <time className="journal-card-time">{formatRelative(note.created_at)}</time>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load more */}
        {hasMore && filtered.length > 0 && (
          <div className="journal-load-more">
            <button onClick={loadMore} className="journal-load-more-btn">
              Load more
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
