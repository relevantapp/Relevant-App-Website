'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, LogOut, Sun, Moon, Save, Edit, Loader2, Brain } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  DEFAULT_MODEL_PREFERENCE,
  MODEL_STORAGE_KEY,
  getModelFamilyId,
  normalizeModelPreference,
  type ModelCatalogResponse,
  type ModelPreference,
} from '@/lib/intelligence/models'

type ProfileData = {
  full_name: string
  email: string
  profile_kind: string
  industry_raw: string
  role_raw: string
  company_id: string | null
  company_name_manual: string
  company_display_name: string
}

type CompanyLookupRow = {
  name: string | null
}

const PROFILE_KINDS = ['general', 'executive', 'investor', 'operator', 'analyst']

function formatContextLength(value: number | null): string {
  if (!value) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M tokens`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k tokens`
  return `${value} tokens`
}

function formatPricePerMillion(price: string | null): string {
  if (!price) return '—'
  const numeric = Number(price)
  if (!Number.isFinite(numeric)) return '—'
  return `$${(numeric * 1_000_000).toFixed(numeric * 1_000_000 >= 1 ? 2 : 3)}/M`
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [intelligenceModel, setIntelligenceModel] = useState<ModelPreference>(DEFAULT_MODEL_PREFERENCE)
  const [modelCatalog, setModelCatalog] = useState<ModelCatalogResponse | null>(null)
  const [modelCatalogLoading, setModelCatalogLoading] = useState(true)
  const [modelCatalogError, setModelCatalogError] = useState<string | null>(null)
  const [selectedFamily, setSelectedFamily] = useState<string>(getModelFamilyId(DEFAULT_MODEL_PREFERENCE))

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    profile_kind: 'general',
    industry_raw: '',
    role_raw: '',
    company_id: null,
    company_name_manual: '',
    company_display_name: '',
  })

  const [editProfile, setEditProfile] = useState<ProfileData>(profile)

  useEffect(() => {
    const stored = localStorage.getItem('relevant-site-theme') as 'dark' | 'light' | null
    const current = stored || (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
    setTheme(current)
    const storedModel = normalizeModelPreference(localStorage.getItem(MODEL_STORAGE_KEY))
    setIntelligenceModel(storedModel)
    setSelectedFamily(getModelFamilyId(storedModel))
    localStorage.setItem(MODEL_STORAGE_KEY, storedModel)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadModelCatalog = async () => {
      setModelCatalogLoading(true)
      setModelCatalogError(null)

      try {
        const res = await fetch('/api/intelligence/models', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load model catalog')

        const data = await res.json() as ModelCatalogResponse
        if (cancelled) return

        setModelCatalog(data)

        const availableModelIds = new Set(data.families.flatMap((family) => family.models.map((model) => model.id)))
        const storedModel = normalizeModelPreference(localStorage.getItem(MODEL_STORAGE_KEY))
        const resolvedModel = availableModelIds.has(storedModel)
          ? storedModel
          : data.defaultModel

        setIntelligenceModel(resolvedModel)
        setSelectedFamily(getModelFamilyId(resolvedModel))
        localStorage.setItem(MODEL_STORAGE_KEY, resolvedModel)
      } catch (err) {
        if (cancelled) return

        console.error('Load model catalog error:', err)
        setModelCatalogError('Could not load the curated model list.')
      } finally {
        if (!cancelled) setModelCatalogLoading(false)
      }
    }

    void loadModelCatalog()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('full_name, email, profile_kind, industry_raw, role_raw, company_id, company_name_manual')
        .eq('id', user.id)
        .maybeSingle()

      const companyId = typeof data?.company_id === 'string' && data.company_id.trim()
        ? data.company_id.trim()
        : null
      const companyManual = typeof data?.company_name_manual === 'string'
        ? data.company_name_manual.trim()
        : ''

      let companyDisplayName = companyManual

      if (companyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .maybeSingle()

        const company = companyData as CompanyLookupRow | null
        if (typeof company?.name === 'string' && company.name.trim()) {
          companyDisplayName = company.name.trim()
        }
      }

      const nextProfile: ProfileData = data ? {
        full_name: (data.full_name as string) || user.name || '',
        email: (data.email as string) || user.email || '',
        profile_kind: (data.profile_kind as string) || 'general',
        industry_raw: (data.industry_raw as string) || '',
        role_raw: (data.role_raw as string) || '',
        company_id: companyId,
        company_name_manual: companyManual,
        company_display_name: companyDisplayName,
      } : {
        full_name: user.name || '',
        email: user.email || '',
        profile_kind: 'general',
        industry_raw: '',
        role_raw: '',
        company_id: null,
        company_name_manual: '',
        company_display_name: '',
      }

      setProfile(nextProfile)
      setEditProfile(nextProfile)
    }

    void fetchProfile()
  }, [user])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('relevant-site-theme', next)
  }, [theme])

  const handleModelChange = useCallback((model: ModelPreference) => {
    setIntelligenceModel(model)
    setSelectedFamily(getModelFamilyId(model))
    localStorage.setItem(MODEL_STORAGE_KEY, model)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const nextCompanyManual = editProfile.company_name_manual.trim()
      await updateProfile({
        full_name: editProfile.full_name.trim(),
        profile_kind: editProfile.profile_kind,
        industry_raw: editProfile.industry_raw.trim(),
        role_raw: editProfile.role_raw.trim(),
        ...(profile.company_id ? {} : { company_name_manual: nextCompanyManual }),
      })

      const nextProfile: ProfileData = {
        ...editProfile,
        company_display_name: profile.company_id
          ? profile.company_display_name
          : nextCompanyManual,
      }

      setProfile(nextProfile)
      setEditProfile(nextProfile)
      setEditing(false)
    } catch (err) {
      console.error('Save profile error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleCancelEdit = () => {
    setEditProfile(profile)
    setEditing(false)
  }

  const families = modelCatalog?.families ?? []
  const activeFamily = families.find((family) => family.id === selectedFamily)
    ?? families.find((family) => family.id === getModelFamilyId(intelligenceModel))
    ?? families[0]
  const activeModels = activeFamily?.models ?? []
  const activeModel = families
    .flatMap((family) => family.models)
    .find((model) => model.id === intelligenceModel)
    ?? activeModels[0]

  return (
    <div className="mx-auto max-w-3xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text)]">Profile</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
            >
              <Edit size={14} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{profile.full_name || 'User'}</h2>
            <p className="text-sm text-[var(--text-muted)]">{profile.email}</p>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Account</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-soft)] opacity-70"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={editProfile.full_name}
                  onChange={(e) => setEditProfile({ ...editProfile, full_name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {profile.full_name || '—'}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Profile Kind</label>
              {editing ? (
                <select
                  value={editProfile.profile_kind}
                  onChange={(e) => setEditProfile({ ...editProfile, profile_kind: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  {PROFILE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind.charAt(0).toUpperCase() + kind.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm capitalize text-[var(--text)]">
                  {profile.profile_kind}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Professional</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Industry</label>
              {editing ? (
                <input
                  type="text"
                  value={editProfile.industry_raw}
                  onChange={(e) => setEditProfile({ ...editProfile, industry_raw: e.target.value })}
                  placeholder="e.g. Technology, Finance, Healthcare"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {profile.industry_raw || '—'}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Role</label>
              {editing ? (
                <input
                  type="text"
                  value={editProfile.role_raw}
                  onChange={(e) => setEditProfile({ ...editProfile, role_raw: e.target.value })}
                  placeholder="e.g. CEO, Product Manager, Analyst"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {profile.role_raw || '—'}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Company</label>
              {editing ? (
                profile.company_id ? (
                  <div>
                    <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                      {profile.company_display_name || '—'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      This company came from your onboarding selection.
                    </p>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editProfile.company_name_manual}
                    onChange={(e) => setEditProfile({ ...editProfile, company_name_manual: e.target.value })}
                    placeholder="Company name"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                )
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {profile.company_display_name || '—'}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">
            <Brain size={14} />
            Intelligence Model
          </h3>
          <p className="mb-3 text-xs text-[var(--text-muted)]">
            Intelligence now runs through OpenRouter. Pick a model family, then the exact model you want for research, refine, and follow-up.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Model Family</label>
              <select
                value={activeFamily?.id ?? selectedFamily}
                onChange={(e) => {
                  const nextFamily = e.target.value
                  setSelectedFamily(nextFamily)
                  const firstModel = families.find((family) => family.id === nextFamily)?.models[0]
                  if (firstModel) handleModelChange(firstModel.id)
                }}
                disabled={modelCatalogLoading || families.length === 0}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60"
              >
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.label} ({family.models.length})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Exact Model</label>
              <select
                value={activeModel?.id ?? intelligenceModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={modelCatalogLoading || activeModels.length === 0}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60"
              >
                {activeModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {modelCatalogError && (
            <p className="mt-3 text-xs text-[var(--accent-coral)]">{modelCatalogError}</p>
          )}
          {modelCatalogLoading && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">Loading the curated model list…</p>
          )}
          {activeModel && (
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{activeModel.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{activeModel.id}</p>
                </div>
                <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-[10px] font-medium text-[var(--accent)]">
                  Active
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Context</p>
                  <p className="mt-1 text-sm text-[var(--text)]">{formatContextLength(activeModel.contextLength)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Input</p>
                  <p className="mt-1 text-sm text-[var(--text)]">{formatPricePerMillion(activeModel.promptPrice)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Output</p>
                  <p className="mt-1 text-sm text-[var(--text)]">{formatPricePerMillion(activeModel.completionPrice)}</p>
                </div>
              </div>
              {activeModel.description && (
                <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{activeModel.description}</p>
              )}
            </div>
          )}
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Theme</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--bg-elevated)] p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--accent-coral)]">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Sign out</p>
                <p className="text-xs text-[var(--text-muted)]">End your current session</p>
              </div>
              <button
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-coral)]/30 px-4 py-2 text-sm font-medium text-[var(--accent-coral)] transition-colors hover:border-[var(--accent-coral)]/50 hover:bg-[var(--accent-coral)]/8"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  )
}
