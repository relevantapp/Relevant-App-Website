'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, LogOut, Sun, Moon, Save, Edit, Loader2, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  cancelAccountDeletion,
  fetchAccountDeletionStatus,
  requestAccountDeletion,
  type AccountDeletionStatus,
} from '@/lib/accountDeletion'

type ProfileData = {
  full_name: string
  email: string
  industry_raw: string
  role_raw: string
  company_id: string | null
  company_name_manual: string
  company_display_name: string
  industry_last_updated_at: string | null
  role_last_updated_at: string | null
  company_last_updated_at: string | null
}

type CompanyLookupRow = {
  name: string | null
}

const CAREER_COOLDOWN_MS = 24 * 60 * 60 * 1000

function getCooldownState(lastUpdatedAt: string | null): { locked: boolean; label: string | null } {
  if (!lastUpdatedAt) return { locked: false, label: null }
  const last = new Date(lastUpdatedAt).getTime()
  if (!Number.isFinite(last)) return { locked: false, label: null }
  const unlocksAt = last + CAREER_COOLDOWN_MS
  if (Date.now() >= unlocksAt) return { locked: false, label: null }
  return {
    locked: true,
    label: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(unlocksAt)),
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [accountDeletionStatus, setAccountDeletionStatus] = useState<AccountDeletionStatus | null>(null)
  const [deletePanelOpen, setDeletePanelOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'temporary' | 'permanent'>('temporary')
  const [deletePassword, setDeletePassword] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    industry_raw: '',
    role_raw: '',
    company_id: null,
    company_name_manual: '',
    company_display_name: '',
    industry_last_updated_at: null,
    role_last_updated_at: null,
    company_last_updated_at: null,
  })

  const [editProfile, setEditProfile] = useState<ProfileData>(profile)

  useEffect(() => {
    const stored = localStorage.getItem('relevant-site-theme') as 'dark' | 'light' | null
    const current = stored || (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
    setTheme(current)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    void fetchAccountDeletionStatus()
      .then((status) => {
        if (!cancelled) setAccountDeletionStatus(status)
      })
      .catch(() => {
        if (!cancelled) setAccountDeletionStatus(null)
      })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('full_name, email, industry_raw, role_raw, company_id, company_name_manual, industry_last_updated_at, role_last_updated_at, company_last_updated_at')
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

      const editableCompanyName = companyManual || companyDisplayName
      const nextProfile: ProfileData = data ? {
        full_name: (data.full_name as string) || user.name || '',
        email: (data.email as string) || user.email || '',
        industry_raw: (data.industry_raw as string) || '',
        role_raw: (data.role_raw as string) || '',
        company_id: companyId,
        company_name_manual: editableCompanyName,
        company_display_name: companyDisplayName,
        industry_last_updated_at: (data.industry_last_updated_at as string | null) || null,
        role_last_updated_at: (data.role_last_updated_at as string | null) || null,
        company_last_updated_at: (data.company_last_updated_at as string | null) || null,
      } : {
        full_name: user.name || '',
        email: user.email || '',
        industry_raw: '',
        role_raw: '',
        company_id: null,
        company_name_manual: '',
        company_display_name: '',
        industry_last_updated_at: null,
        role_last_updated_at: null,
        company_last_updated_at: null,
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

  const handleSave = async () => {
    setSaving(true)
    setProfileError(null)
    try {
      const nextCompanyManual = editProfile.company_name_manual.trim()
      const nowIso = new Date().toISOString()
      const industryChanged = editProfile.industry_raw.trim() !== profile.industry_raw.trim()
      const roleChanged = editProfile.role_raw.trim() !== profile.role_raw.trim()
      const currentCompanyName = (profile.company_display_name || profile.company_name_manual).trim()
      const companyChanged = nextCompanyManual !== currentCompanyName
      await updateProfile({
        full_name: editProfile.full_name.trim(),
        industry_raw: editProfile.industry_raw.trim(),
        role_raw: editProfile.role_raw.trim(),
        ...(companyChanged
          ? { company_id: null, company_name_manual: nextCompanyManual }
          : {}),
      })

      const nextProfile: ProfileData = {
        ...editProfile,
        company_id: companyChanged ? null : profile.company_id,
        company_name_manual: companyChanged ? nextCompanyManual : profile.company_name_manual,
        company_display_name: companyChanged ? nextCompanyManual : profile.company_display_name,
        industry_last_updated_at: industryChanged ? nowIso : profile.industry_last_updated_at,
        role_last_updated_at: roleChanged ? nowIso : profile.role_last_updated_at,
        company_last_updated_at: companyChanged ? nowIso : profile.company_last_updated_at,
      }

      setProfile(nextProfile)
      setEditProfile(nextProfile)
      setEditing(false)
    } catch (err) {
      console.error('Save profile error:', err)
      setProfileError(err instanceof Error ? err.message : 'Could not save profile.')
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
    setProfileError(null)
    setEditing(false)
  }

  const handleRequestDeletion = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Enter your password to continue.')
      return
    }

    setDeletingAccount(true)
    setDeleteError(null)
    try {
      const status = await requestAccountDeletion(deleteMode, deletePassword)
      setAccountDeletionStatus(status)
      setDeletePassword('')
      if (status.status === 'completed' || deleteMode === 'permanent') {
        await signOut()
        router.push('/')
        return
      }
      setDeletePanelOpen(false)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not request deletion.')
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleCancelDeletion = async () => {
    setDeletingAccount(true)
    setDeleteError(null)
    try {
      const status = await cancelAccountDeletion()
      setAccountDeletionStatus(status)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not cancel deletion.')
    } finally {
      setDeletingAccount(false)
    }
  }

  const industryCooldown = getCooldownState(profile.industry_last_updated_at)
  const roleCooldown = getCooldownState(profile.role_last_updated_at)
  const companyCooldown = getCooldownState(profile.company_last_updated_at)

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
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Work Context</h3>
            <p className="text-xs text-[var(--text-muted)]">
              These fields shape relevance and can be changed once every 24 hours.
            </p>
          </div>
          {profileError && (
            <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)]">
              {profileError}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Industry</label>
              {editing ? (
                <>
                  <input
                    type="text"
                    value={editProfile.industry_raw}
                    onChange={(e) => setEditProfile({ ...editProfile, industry_raw: e.target.value })}
                    placeholder="e.g. Technology, Finance, Healthcare"
                    disabled={industryCooldown.locked}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:bg-[var(--surface)] disabled:text-[var(--text-soft)]"
                  />
                  {industryCooldown.locked && (
                    <p className="mt-1 text-xs text-[var(--text-soft)]">Available again {industryCooldown.label}.</p>
                  )}
                </>
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {profile.industry_raw || '—'}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Role</label>
              {editing ? (
                <>
                  <input
                    type="text"
                    value={editProfile.role_raw}
                    onChange={(e) => setEditProfile({ ...editProfile, role_raw: e.target.value })}
                    placeholder="e.g. CEO, Product Manager, Analyst"
                    disabled={roleCooldown.locked}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:bg-[var(--surface)] disabled:text-[var(--text-soft)]"
                  />
                  {roleCooldown.locked && (
                    <p className="mt-1 text-xs text-[var(--text-soft)]">Available again {roleCooldown.label}.</p>
                  )}
                </>
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {profile.role_raw || '—'}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Company</label>
              {editing ? (
                <>
                  <input
                    type="text"
                    value={editProfile.company_name_manual}
                    onChange={(e) => setEditProfile({ ...editProfile, company_name_manual: e.target.value })}
                    placeholder="Company name"
                    disabled={companyCooldown.locked}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:bg-[var(--surface)] disabled:text-[var(--text-soft)]"
                  />
                  {companyCooldown.locked && (
                    <p className="mt-1 text-xs text-[var(--text-soft)]">Available again {companyCooldown.label}.</p>
                  )}
                  {!companyCooldown.locked && profile.company_id && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Changing company replaces your onboarding company.
                    </p>
                  )}
                </>
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {profile.company_display_name || '—'}
                </p>
              )}
            </div>
          </div>
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

          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Account Safety</h3>
            <div className="flex flex-col gap-4">
              {accountDeletionStatus?.status === 'pending' ? (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                  <p className="text-sm font-medium text-[var(--text)]">Deletion scheduled</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                    {typeof accountDeletionStatus.daysRemaining === 'number'
                      ? `${accountDeletionStatus.daysRemaining} day${accountDeletionStatus.daysRemaining === 1 ? '' : 's'} left to cancel.`
                      : 'You can still cancel during the recovery window.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCancelDeletion()}
                    disabled={deletingAccount}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-medium text-[var(--text)] disabled:opacity-50"
                  >
                    {deletingAccount ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                    Cancel deletion
                  </button>
                </div>
              ) : null}

              {deletePanelOpen ? (
                <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">Delete account</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                        Choose a recovery window or delete permanently now. Confirm with your password.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletePanelOpen(false)
                        setDeleteError(null)
                        setDeletePassword('')
                      }}
                      className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)]"
                      aria-label="Close delete account"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      { id: 'temporary' as const, label: '15-day recovery' },
                      { id: 'permanent' as const, label: 'Delete now' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setDeleteMode(option.id)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs font-medium ${
                          deleteMode === option.id
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]'
                            : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 block text-xs text-[var(--text-muted)]">Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    autoComplete="current-password"
                  />
                  {deleteError && <p className="mt-2 text-xs text-[var(--text)]">{deleteError}</p>}
                  <button
                    type="button"
                    onClick={() => void handleRequestDeletion()}
                    disabled={deletingAccount}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text)] px-4 py-2.5 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
                  >
                    {deletingAccount ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {deleteMode === 'permanent' ? 'Delete permanently' : 'Schedule deletion'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeletePanelOpen(true)}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-left transition-colors hover:border-[var(--border-strong)]"
                >
                  <span>
                    <span className="block text-sm font-medium text-[var(--text)]">Delete account</span>
                    <span className="block text-xs text-[var(--text-muted)]">Schedule deletion or delete permanently.</span>
                  </span>
                  <Trash2 size={16} className="text-[var(--text-muted)]" />
                </button>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Sign out</p>
                  <p className="text-xs text-[var(--text-muted)]">End your current session</p>
                </div>
                <button
                  onClick={() => void handleSignOut()}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  )
}
