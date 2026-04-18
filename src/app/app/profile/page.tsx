'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, LogOut, Sun, Moon, Save, Edit, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type ProfileData = {
  full_name: string
  email: string
  profile_kind: string
  industry_raw: string
  role_raw: string
  company_name_manual: string
}

const PROFILE_KINDS = ['general', 'executive', 'investor', 'operator', 'analyst']

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    profile_kind: 'general',
    industry_raw: '',
    role_raw: '',
    company_name_manual: '',
  })

  const [editProfile, setEditProfile] = useState<ProfileData>(profile)

  // Load theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('relevant-site-theme') as 'dark' | 'light' | null
    const current = stored || (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
    setTheme(current)
  }, [])

  // Fetch user profile from DB
  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('full_name, email, profile_kind, industry_raw, role_raw, company_name_manual')
        .eq('id', user.id)
        .maybeSingle()

      if (data) {
        const p: ProfileData = {
          full_name: (data.full_name as string) || user.name || '',
          email: (data.email as string) || user.email || '',
          profile_kind: (data.profile_kind as string) || 'general',
          industry_raw: (data.industry_raw as string) || '',
          role_raw: (data.role_raw as string) || '',
          company_name_manual: (data.company_name_manual as string) || '',
        }
        setProfile(p)
        setEditProfile(p)
      } else {
        const p: ProfileData = {
          full_name: user.name || '',
          email: user.email || '',
          profile_kind: 'general',
          industry_raw: '',
          role_raw: '',
          company_name_manual: '',
        }
        setProfile(p)
        setEditProfile(p)
      }
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
    try {
      await updateProfile({
        full_name: editProfile.full_name.trim(),
        profile_kind: editProfile.profile_kind,
        industry_raw: editProfile.industry_raw.trim(),
        role_raw: editProfile.role_raw.trim(),
        company_name_manual: editProfile.company_name_manual.trim(),
      })
      setProfile(editProfile)
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

  return (
    <div className="mx-auto max-w-3xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
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

        {/* Avatar + Name */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{profile.full_name || 'User'}</h2>
            <p className="text-sm text-[var(--text-muted)]">{profile.email}</p>
          </div>
        </div>

        {/* Account section */}
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

        {/* Professional section */}
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
                <input
                  type="text"
                  value={editProfile.company_name_manual}
                  onChange={(e) => setEditProfile({ ...editProfile, company_name_manual: e.target.value })}
                  placeholder="Company name"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
                  {profile.company_name_manual || '—'}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Appearance + Danger zone side by side on desktop */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Appearance */}
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
                className="rounded-lg border border-[var(--border)] p-2.5 text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </section>

          {/* Danger zone */}
          <section className="rounded-xl border border-red-500/20 bg-[var(--bg-elevated)] p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-red-400">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Sign out</p>
                <p className="text-xs text-[var(--text-muted)]">End your current session</p>
              </div>
              <button
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
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
