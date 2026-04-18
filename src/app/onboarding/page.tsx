'use client'

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowRight, ArrowLeft, Check, ChevronDown, Sparkles, Search, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase, getValidAccessToken } from '@/lib/supabase'
import { markSignalForgePending } from '@/lib/signalForgeSession'

/* ─── Types ─── */
type TaxonomyOption = { id: string; name: string; slug?: string }
type IndustryRow = { id: string; name: string; slug: string; keywords: unknown }
type RoleRow = { id: string; name: string; slug: string; industry_id: string | null }
type CompanyRow = { id: string; name: string; slug: string }

/* ─── Constants ─── */
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'IN', name: 'India' },
]

const TOTAL_STEPS = 5

const STEP_LABELS = ['Industry', 'Role', 'Company', 'Location', 'AI Preview']

/* ─── Taxonomy hook (mirrors mobile useTaxonomySearch) ─── */
function useTaxonomySearch() {
  const industryCache = useRef<(TaxonomyOption & { keywords: string[] })[] | null>(null)
  const roleCache = useRef<(TaxonomyOption & { industryId: string | null })[] | null>(null)
  const companyCache = useRef<TaxonomyOption[] | null>(null)

  const ensureIndustries = useCallback(async () => {
    if (industryCache.current) return industryCache.current
    const { data } = await supabase.from('industries').select('id, name, slug, keywords').eq('is_active', true).order('name')
    const opts = ((data ?? []) as IndustryRow[]).map((r) => ({ id: r.id, name: r.name, slug: r.slug, keywords: (Array.isArray(r.keywords) ? (r.keywords as unknown[]).filter((v): v is string => typeof v === 'string').map((v) => v.toLowerCase()) : []) }))
    industryCache.current = opts
    return opts
  }, [])

  const ensureRoles = useCallback(async () => {
    if (roleCache.current) return roleCache.current
    const { data } = await supabase.from('roles').select('id, name, slug, industry_id').order('name')
    const opts = ((data ?? []) as RoleRow[]).map((r) => ({ id: r.id, name: r.name, slug: r.slug, industryId: r.industry_id ?? null }))
    roleCache.current = opts
    return opts
  }, [])

  const ensureCompanies = useCallback(async () => {
    if (companyCache.current) return companyCache.current
    const { data } = await supabase.from('companies').select('id, name, slug').eq('is_active', true).order('name')
    const opts = ((data ?? []) as CompanyRow[]).map((r) => ({ id: r.id, name: r.name, slug: r.slug }))
    companyCache.current = opts
    return opts
  }, [])

  const searchIndustries = useCallback(async (query: string): Promise<TaxonomyOption[]> => {
    const q = query.trim().toLowerCase()
    const all = await ensureIndustries()
    if (q.length < 1) return all.slice(0, 12).map(({ id, name, slug }) => ({ id, name, slug }))
    return all.filter((o) => o.name.toLowerCase().includes(q) || o.keywords.some((k) => k.includes(q))).slice(0, 12).map(({ id, name, slug }) => ({ id, name, slug }))
  }, [ensureIndustries])

  const searchRoles = useCallback(async (query: string, industryId?: string | null): Promise<TaxonomyOption[]> => {
    const q = query.trim().toLowerCase()
    const all = await ensureRoles()
    let filtered = all
    if (q.length >= 1) filtered = filtered.filter((o) => o.name.toLowerCase().includes(q))
    else filtered = filtered.slice(0, 12)
    if (industryId) {
      const specific = filtered.filter((o) => o.industryId === industryId)
      if (specific.length > 0) filtered = specific
      else filtered = filtered.filter((o) => o.industryId === null)
    }
    return filtered.slice(0, 12).map(({ id, name, slug }) => ({ id, name, slug }))
  }, [ensureRoles])

  const searchCompanies = useCallback(async (query: string): Promise<TaxonomyOption[]> => {
    const q = query.trim().toLowerCase()
    const all = await ensureCompanies()
    if (q.length < 1) return all.slice(0, 12)
    return all.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 12)
  }, [ensureCompanies])

  return { searchIndustries, searchRoles, searchCompanies }
}

/* ─── Suggestion input component ─── */
function SuggestionInput({
  value,
  onChange,
  placeholder,
  searchFn,
  onSelect,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  searchFn: (q: string) => Promise<TaxonomyOption[]>
  onSelect: (opt: TaxonomyOption) => void
  label: string
}) {
  const [suggestions, setSuggestions] = useState<TaxonomyOption[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const debounce = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    debounce.current = setTimeout(() => {
      void searchFn(value).then((opts) => {
        setSuggestions(opts)
        setFocusedIdx(-1)
      })
    }, 150)
    return () => clearTimeout(debounce.current)
  }, [value, searchFn])

  // Load initial suggestions on mount
  useEffect(() => {
    void searchFn('').then(setSuggestions)
  }, [searchFn])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault()
      onSelect(suggestions[focusedIdx])
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
          className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 text-sm text-[var(--text)] placeholder-[var(--text-soft)] outline-none transition-colors focus:border-accent-blue"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg">
          {value.trim().length === 0 && (
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-soft)]">
              Quick picks
            </div>
          )}
          {suggestions.map((opt, i) => (
            <button
              key={opt.id}
              onMouseDown={(e) => { e.preventDefault(); onSelect(opt); setShowSuggestions(false) }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                opt.name.toLowerCase() === value.trim().toLowerCase()
                  ? 'bg-accent-blue/10 text-accent-blue'
                  : i === focusedIdx
                    ? 'bg-[var(--surface)] text-[var(--text)]'
                    : 'text-[var(--text)] hover:bg-[var(--surface)]'
              }`}
            >
              {opt.name.toLowerCase() === value.trim().toLowerCase() && <Check size={14} className="shrink-0 text-accent-blue" />}
              <span>{opt.name}</span>
            </button>
          ))}
          {value.trim().length >= 2 && !suggestions.some((s) => s.name.toLowerCase() === value.trim().toLowerCase()) && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setShowSuggestions(false) }}
              className="flex w-full items-center gap-2 border-t border-[var(--border)] px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--surface)]"
            >
              Use &ldquo;{value.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── SSE Parser (matches mobile) ─── */
function extractSseEvents(buffer: string): { events: { event: string; data: string }[]; rest: string } {
  const blocks = buffer.split('\n\n')
  const rest = blocks.pop() ?? ''
  const events = blocks.map((block) => {
    const lines = block.split(/\r?\n/)
    let event = 'message'
    const dataLines: string[] = []
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
    }
    const data = dataLines.join('\n').trim()
    return data ? { event, data } : null
  }).filter((e): e is { event: string; data: string } => e !== null)
  return { events, rest }
}

/* ─── Main Page ─── */
export default function OnboardingPage() {
  const { user, updateProfile, markOnboardingComplete, setIsSignalForgeInProgress, signOut } = useAuth()
  const router = useRouter()
  const taxonomy = useTaxonomySearch()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [industry, setIndustry] = useState('')
  const [industryId, setIndustryId] = useState<string | null>(null)
  const [role, setRole] = useState('')
  const [roleId, setRoleId] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // AI Preview state
  const [aiPassage, setAiPassage] = useState('')
  const [passageLoading, setPassageLoading] = useState(false)
  const [passageStatus, setPassageStatus] = useState('')
  const [contextNote, setContextNote] = useState('')
  const [regenCount, setRegenCount] = useState(0)
  const passageAbort = useRef<AbortController | null>(null)
  const hasFetchedPassage = useRef(false)
  const MAX_REGENERATIONS = 3

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const canAdvance = () => {
    if (step === 1) return industry.trim().length > 0
    if (step === 2) return role.trim().length > 0
    if (step === 3) return true // company is optional
    if (step === 4) return Boolean(countryCode)
    if (step === 5) return !passageLoading
    return true
  }

  /* ─── AI Passage Preview ─── */
  const fetchPassagePreview = useCallback(async () => {
    passageAbort.current?.abort()
    const controller = new AbortController()
    passageAbort.current = controller
    setPassageLoading(true)
    setAiPassage('')
    setPassageStatus('Understanding your work…')

    try {
      const token = await getValidAccessToken(180)
      if (!token || controller.signal.aborted) { setPassageLoading(false); return }

      const body = {
        profile_kind: 'professional',
        industry: industry.trim(),
        role: role.trim(),
        company: company.trim(),
        country: COUNTRIES.find((c) => c.code === countryCode)?.name ?? '',
        profile_context_note: contextNote.trim() || undefined,
      }

      // Try streaming
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const res = await fetch(`${supabaseUrl}/functions/v1/pro-passage-preview?stream=1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
          'x-supabase-auth': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        // Fallback to non-streaming
        try {
          const fallbackRes = await supabase.functions.invoke('pro-passage-preview', {
            headers: { Authorization: `Bearer ${token}` },
            body,
          })
          if (fallbackRes.data?.passage) {
            setAiPassage(fallbackRes.data.passage)
          } else {
            setPassageStatus('Preview unavailable — you can finish setup and your feed will be ready shortly.')
          }
        } catch {
          setPassageStatus('Preview unavailable — you can finish setup and your feed will be ready shortly.')
        }
        setPassageLoading(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) { setPassageLoading(false); return }

      const decoder = new TextDecoder()
      let buffer = ''
      let nextPassage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parsed = extractSseEvents(buffer)
        buffer = parsed.rest

        for (const evt of parsed.events) {
          if (evt.event === 'status') {
            try { const p = JSON.parse(evt.data); if (p.label) setPassageStatus(p.label) } catch { /* skip */ }
          }
          if (evt.event === 'delta') {
            try { const p = JSON.parse(evt.data); if (p.text) { nextPassage += p.text; setAiPassage(nextPassage.trimStart()) } } catch { /* skip */ }
          }
          if (evt.event === 'done') {
            try { const p = JSON.parse(evt.data); if (p.passage) { nextPassage = p.passage; setAiPassage(p.passage) } } catch { /* skip */ }
          }
        }
      }
    } catch {
      // Edge function unavailable — show a helpful fallback so user can still proceed
      setAiPassage('')
      setPassageStatus('Preview unavailable right now — you can finish setup and your feed will be ready shortly.')
    } finally {
      if (!controller.signal.aborted) setPassageLoading(false)
    }
  }, [industry, role, company, countryCode, contextNote])

  // Trigger passage fetch when entering step 5
  useEffect(() => {
    if (step === 5 && !hasFetchedPassage.current) {
      hasFetchedPassage.current = true
      void fetchPassagePreview()
    }
  }, [step, fetchPassagePreview])

  /* ─── Submit ─── */
  const handleComplete = async () => {
    setError('')
    setLoading(true)
    try {
      await updateProfile({
        profile_kind: 'professional',
        industry_id: industryId || undefined,
        role_id: roleId || undefined,
        company_id: companyId || undefined,
        industry_raw: industry.trim(),
        role_raw: role.trim(),
        company_name_manual: companyId ? undefined : (company.trim() || undefined),
        location_country: countryCode,
        profile_context_note: contextNote.trim() || undefined,
        onboarding_completed: true,
      })
      markOnboardingComplete()
      if (user) markSignalForgePending(user.id)
      setIsSignalForgeInProgress(true)
      router.push('/app/building')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    if (step < TOTAL_STEPS) { setDirection(1); setStep(step + 1) }
    else void handleComplete()
  }
  const back = () => {
    if (step > 1) { setDirection(-1); setStep(step - 1) }
  }
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (canAdvance()) next() }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs text-[var(--text-soft)]">
              {STEP_LABELS[step - 1]}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface)]">
            <motion.div
              className="h-full rounded-full bg-accent-blue"
              initial={false}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Step 1: Industry */}
              {step === 1 && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[var(--text)]">What industry are you in?</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Relevant watches news that affects your industry.</p>
                  </div>
                  <SuggestionInput
                    value={industry}
                    onChange={(v) => { setIndustry(v); setIndustryId(null) }}
                    placeholder="e.g. SaaS, Healthcare, Finance"
                    searchFn={taxonomy.searchIndustries}
                    onSelect={(opt) => { setIndustry(opt.name); setIndustryId(opt.id) }}
                    label="Industry"
                  />
                </form>
              )}

              {/* Step 2: Role */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[var(--text)]">What&apos;s your role?</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">So we can tailor signals to your responsibilities.</p>
                  </div>
                  <SuggestionInput
                    value={role}
                    onChange={(v) => { setRole(v); setRoleId(null) }}
                    placeholder="e.g. VP of Product, Sales Manager, Analyst"
                    searchFn={(q) => taxonomy.searchRoles(q, industryId)}
                    onSelect={(opt) => { setRole(opt.name); setRoleId(opt.id) }}
                    label="Role"
                  />
                </form>
              )}

              {/* Step 3: Company */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[var(--text)]">Where do you work?</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Optional — helps us watch for news about your company.</p>
                  </div>
                  <SuggestionInput
                    value={company}
                    onChange={(v) => { setCompany(v); setCompanyId(null) }}
                    placeholder="e.g. Stripe, Mayo Clinic, Deloitte"
                    searchFn={taxonomy.searchCompanies}
                    onSelect={(opt) => { setCompany(opt.name); setCompanyId(opt.id) }}
                    label="Company"
                  />
                </form>
              )}

              {/* Step 4: Country */}
              {step === 4 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[var(--text)]">Where are you based?</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">So we can prioritize signals from your region.</p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCountryOpen(!countryOpen)}
                      className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm transition-colors ${
                        countryCode
                          ? 'border-accent-blue bg-[var(--surface)] text-[var(--text)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)]'
                      }`}
                    >
                      {selectedCountry ? selectedCountry.name : 'Select your country'}
                      <ChevronDown size={16} className={`transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {countryOpen && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            onClick={() => { setCountryCode(c.code); setCountryOpen(false) }}
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                              countryCode === c.code
                                ? 'bg-accent-blue/10 text-accent-blue'
                                : 'text-[var(--text)] hover:bg-[var(--surface)]'
                            }`}
                          >
                            {countryCode === c.code && <Check size={14} className="shrink-0" />}
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: AI Preview */}
              {step === 5 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[var(--text)]">Here&apos;s how we understand your work</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Check the summary before we build your feed.</p>
                  </div>

                  {/* AI Summary Card */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-blue">
                        <Sparkles size={11} />
                        {passageLoading ? 'AI is writing this' : 'AI summary'}
                      </span>
                      <span className="text-xs text-[var(--text-soft)]">
                        {passageLoading ? passageStatus : ''}
                      </span>
                    </div>
                    <div className="min-h-[60px] text-sm leading-relaxed text-[var(--text)]">
                      {passageLoading && !aiPassage ? (
                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                          <Loader2 size={14} className="animate-spin" />
                          Getting a sharper read on your work…
                        </div>
                      ) : (
                        aiPassage || 'We\'ll generate a personalized summary based on your profile.'
                      )}
                    </div>
                  </div>

                  {/* Correction area */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                      What should we fix or sharpen?
                    </label>
                    <textarea
                      value={contextNote}
                      onChange={(e) => setContextNote(e.target.value)}
                      maxLength={500}
                      disabled={passageLoading}
                      placeholder="e.g. I focus on domestic delivery operations, not cross-border shipping."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-soft)] outline-none transition-colors focus:border-accent-blue disabled:opacity-50"
                    />
                    <span className="mt-1 block text-[10px] text-[var(--text-soft)]">{contextNote.length}/500</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-3">
                    {/* Regenerate — primary, requires feedback text */}
                    <button
                      type="button"
                      disabled={!contextNote.trim() || passageLoading || regenCount >= MAX_REGENERATIONS}
                      onClick={() => {
                        setRegenCount((c) => c + 1)
                        hasFetchedPassage.current = false
                        void fetchPassagePreview()
                      }}
                      className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent-blue text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {passageLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={14} />
                          {regenCount >= MAX_REGENERATIONS ? 'Max regenerations reached' : 'Regenerate'}
                        </>
                      )}
                    </button>
                    {!contextNote.trim() && regenCount < MAX_REGENERATIONS && !passageLoading && (
                      <p className="text-center text-[10px] text-[var(--text-soft)]">Write feedback above to regenerate</p>
                    )}

                    {/* Looks good — secondary */}
                    <button
                      type="button"
                      disabled={loading || passageLoading}
                      onClick={() => void handleComplete()}
                      className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)] disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : (
                        <><Check size={16} /> Looks good, sign up</>
                      )}
                    </button>

                    {/* Skip — tertiary */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => { setContextNote(''); void handleComplete() }}
                      className="text-xs text-[var(--text-soft)] transition-opacity hover:text-[var(--text-muted)]"
                    >
                      Skip and sign up
                    </button>
                  </div>

                  {/* Acceptance */}
                  <p className="text-xs leading-relaxed text-[var(--text-soft)]">
                    Relevant uses AI to build a personalized relevance lens from your profile. Your data is used only to tailor your feed — never sold. By continuing, you agree to our terms.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-lg bg-semantic-errorMuted px-3 py-2.5 text-sm text-semantic-error"
            >
              {error}
            </motion.p>
          )}

          {/* Navigation buttons — hidden on step 5 which has its own buttons */}
          {step < TOTAL_STEPS && (
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={back}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <button
                onClick={() => void handleSignOut()}
                className="flex items-center gap-1 text-sm text-[var(--text-soft)] transition-colors hover:text-semantic-error"
              >
                <LogOut size={14} /> Sign out
              </button>
            )}
            <button
              onClick={next}
              disabled={!canAdvance() || loading}
              className="flex items-center gap-2 rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Continue <ArrowRight size={16} /></>
              )}
            </button>
          </div>
          )}
          {step === TOTAL_STEPS && (
            <div className="mt-4 flex items-center">
              <button
                onClick={back}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
