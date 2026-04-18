'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase, getValidAccessToken } from '@/lib/supabase'
import type { AuthUser, AuthNotice } from '@/types/signals'
import { isSignalForgePending } from '@/lib/signalForgeSession'

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  needsOnboarding: boolean
  markOnboardingComplete: () => void
  needsEmailVerification: boolean
  pendingVerificationEmail: string | null
  clearPendingVerification: () => void
  notice: AuthNotice | null
  clearNotice: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string, preferences?: Record<string, unknown>) => Promise<void>
  verifySignUp: (email: string, token: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  updateProfile: (preferences: Record<string, unknown>) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (email: string, token: string, newPassword: string) => Promise<void>
  signOut: () => Promise<void>
  isSignalForgeInProgress: boolean
  setIsSignalForgeInProgress: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const CACHED_USER_KEY = 'relevant_cached_user'

function toUser(id: string, email: string, name?: string | null): AuthUser {
  return { id, email, name: name?.trim() || email.split('@')[0] || 'User' }
}

function mapAuthErrorMessage(
  rawMessage: string | undefined | null,
  context: 'signIn' | 'signUp' | 'resetRequest' | 'resetVerify'
): string {
  const message = (rawMessage || '').toLowerCase()
  if (message.includes('email not confirmed')) return "Your email isn't verified yet. Check your inbox for the confirmation email."
  if (message.includes('invalid login credentials')) return 'Invalid email or password.'
  if (message.includes('user not found')) return context === 'signIn' ? 'No account found for that email.' : "We couldn't find that account."
  if (message.includes('already registered')) return 'An account with this email already exists.'
  if (message.includes('password') && (message.includes('at least') || message.includes('minimum'))) return 'Password is too short. Use at least 8 characters.'
  if (message.includes('rate limit') || message.includes('too many')) return context === 'resetRequest' ? 'Too many reset attempts. Please wait a few minutes.' : 'Too many attempts. Please wait a moment.'
  if (context === 'resetVerify' && (message.includes('expired') || message.includes('invalid'))) return 'That code is invalid or expired. Request a new one.'
  return rawMessage || 'Something went wrong. Please try again.'
}

function normalizeProfileKind(value: unknown): string {
  if (typeof value !== 'string') return 'general'
  const normalized = value.trim().toLowerCase()
  const valid = ['general', 'executive', 'investor', 'operator', 'analyst']
  return valid.includes(normalized) ? normalized : 'general'
}

async function syncUserProfileFromAuthMetadata(sessionUser: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}): Promise<void> {
  const email = sessionUser.email || ''
  const metadata = sessionUser.user_metadata || {}
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : ''
  const profileKind = normalizeProfileKind(metadata.profile_kind)

  const payload: Record<string, unknown> = {
    id: sessionUser.id,
    email: email || `unknown+${sessionUser.id}@relevant.local`,
    full_name: fullName || email.split('@')[0] || 'User',
    profile_kind: profileKind,
  }

  const industryId = typeof metadata.industry_id === 'string' ? metadata.industry_id.trim() : ''
  const roleId = typeof metadata.role_id === 'string' ? metadata.role_id.trim() : ''
  const companyId = typeof metadata.company_id === 'string' ? metadata.company_id.trim() : ''
  const companyManual = typeof metadata.company_name_manual === 'string' ? metadata.company_name_manual.trim() : ''
  const industryRaw = typeof metadata.industry_raw === 'string' ? metadata.industry_raw.trim() : ''
  const roleRaw = typeof metadata.role_raw === 'string' ? metadata.role_raw.trim() : ''

  if (industryId) payload.industry_id = industryId
  if (roleId) payload.role_id = roleId
  if (companyId || companyManual) {
    payload.company_id = companyId || null
    payload.company_name_manual = companyId ? null : companyManual
  }
  if (industryRaw) payload.industry_raw = industryRaw
  if (roleRaw) payload.role_raw = roleRaw

  await supabase.from('users').upsert(payload, { onConflict: 'id' })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState<AuthNotice | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  const [isSignalForgeInProgress, setIsSignalForgeInProgress] = useState(false)

  const cacheUser = (u: AuthUser | null) => {
    if (u) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u))
    } else {
      localStorage.removeItem(CACHED_USER_KEY)
    }
  }

  const fetchProfileName = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, onboarding_completed_at')
        .eq('id', userId)
        .maybeSingle()

      if (error) return

      if (!data?.onboarding_completed_at) {
        setNeedsOnboarding(true)
      } else {
        setNeedsOnboarding(false)
        if (isSignalForgePending(userId)) {
          setIsSignalForgeInProgress(true)
        }
      }

      const nextUser = toUser(userId, email, data?.full_name)
      setUser(nextUser)
      cacheUser(nextUser)
    } catch {
      // Profile details are optional
    }
  }, [])

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        const cached = localStorage.getItem(CACHED_USER_KEY)
        if (cached && active) setUser(JSON.parse(cached) as AuthUser)
      } catch { /* ignore */ }

      try {
        const { data } = await supabase.auth.getSession()
        const sessionUser = data.session?.user

        if (sessionUser && active) {
          if (!sessionUser.email_confirmed_at) {
            setUser(null)
            cacheUser(null)
            setNeedsEmailVerification(true)
            setPendingVerificationEmail(sessionUser.email || null)
            return
          }

          setNeedsEmailVerification(false)
          setPendingVerificationEmail(null)
          const nextUser = toUser(sessionUser.id, sessionUser.email || '', sessionUser.user_metadata?.full_name as string)
          setUser(nextUser)
          cacheUser(nextUser)
          void fetchProfileName(nextUser.id, nextUser.email)
        } else if (active) {
          setUser(null)
          cacheUser(null)
        }
      } catch { /* keep cached state */ } finally {
        if (active) setIsLoading(false)
      }
    }

    void bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const sessionUser = session?.user
      if (sessionUser) {
        if (!sessionUser.email_confirmed_at) {
          setUser(null)
          cacheUser(null)
          setNeedsEmailVerification(true)
          setPendingVerificationEmail(sessionUser.email || null)
          setIsLoading(false)
          return
        }
        setNeedsEmailVerification(false)
        setPendingVerificationEmail(null)
        const nextUser = toUser(sessionUser.id, sessionUser.email || '', sessionUser.user_metadata?.full_name as string)
        setUser(nextUser)
        cacheUser(nextUser)
        void fetchProfileName(nextUser.id, nextUser.email)
      } else {
        setUser(null)
        cacheUser(null)
      }
      setIsLoading(false)
    })

    return () => { active = false; subscription.unsubscribe() }
  }, [fetchProfileName])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('email not confirmed')) {
        const trimmed = email.trim().toLowerCase()
        setNeedsEmailVerification(true)
        setPendingVerificationEmail(trimmed)
        try {
          await supabase.auth.resend({ type: 'signup', email: trimmed })
        } catch { /* non-critical */ }
        return
      }
      throw new Error(mapAuthErrorMessage(error.message, 'signIn'))
    }

    const sessionUser = data.session?.user
    if (!sessionUser?.email) throw new Error('Could not establish a valid session.')
    if (!sessionUser.email_confirmed_at) {
      setNeedsEmailVerification(true)
      setPendingVerificationEmail(sessionUser.email)
      return
    }

    setNeedsEmailVerification(false)
    setPendingVerificationEmail(null)

    try { await syncUserProfileFromAuthMetadata(sessionUser) } catch { /* resilient */ }

    const nextUser = toUser(sessionUser.id, sessionUser.email, sessionUser.user_metadata?.full_name as string)
    setUser(nextUser)
    cacheUser(nextUser)
    void fetchProfileName(nextUser.id, nextUser.email)
  }

  const signUp = async (name: string, email: string, password: string, preferences?: Record<string, unknown>) => {
    const trimmedEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { full_name: name.trim(), ...(preferences || {}) },
      },
    })

    if (error) throw new Error(mapAuthErrorMessage(error.message, 'signUp'))

    // Check for existing confirmed user
    if (data.session === null && data.user) {
      const identitiesLen = Array.isArray(data.user.identities) ? data.user.identities.length : null
      if (identitiesLen === 0) {
        throw new Error('An account with this email already exists. Go to sign in instead.')
      }
    }

    setUser(null)
    cacheUser(null)
    setNeedsEmailVerification(true)
    setPendingVerificationEmail(trimmedEmail)
    setNotice({ kind: 'info', message: 'Check your email for the verification code.' })
  }

  const verifySignUp = async (email: string, token: string) => {
    const trimmedToken = token.trim()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !trimmedToken) throw new Error('Enter the verification code we emailed you.')

    const { data, error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedToken,
      type: 'signup',
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('expired') || msg.includes('incorrect')) {
        throw new Error('That code is incorrect or has expired.')
      }
      throw new Error(error.message)
    }

    if (!data.session) throw new Error('Verification successful, but session could not be established. Please sign in.')

    const sessionUser = data.session.user
    setNeedsEmailVerification(false)
    setPendingVerificationEmail(null)
    const nextUser = toUser(sessionUser.id, sessionUser.email || trimmedEmail, sessionUser.user_metadata?.full_name as string)
    setUser(nextUser)
    cacheUser(nextUser)
    void fetchProfileName(nextUser.id, nextUser.email)
    try { await syncUserProfileFromAuthMetadata(sessionUser) } catch { /* resilient */ }
  }

  const resendVerification = async (email: string) => {
    const trimmed = email.trim()
    if (!trimmed) throw new Error('Enter your email.')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmed.toLowerCase(),
    })
    if (error) throw new Error(error.message || 'Could not resend verification code.')
    setNeedsEmailVerification(true)
    setPendingVerificationEmail(trimmed.toLowerCase())
  }

  const requestPasswordReset = async (email: string) => {
    const trimmed = email.trim()
    if (!trimmed) throw new Error('Enter your email.')
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed)
    if (error) throw new Error(mapAuthErrorMessage(error.message, 'resetRequest'))
  }

  const confirmPasswordReset = async (email: string, token: string, newPassword: string) => {
    const trimmedEmail = email.trim()
    const trimmedToken = token.trim()
    if (!trimmedEmail || !trimmedToken) throw new Error('Enter the code we emailed you.')

    const { data, error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedToken,
      type: 'recovery',
    })

    if (error) throw new Error(mapAuthErrorMessage(error.message, 'resetVerify'))
    if (!data.session) throw new Error('Could not verify the code. Please try again.')

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) throw new Error(updateError.message || 'Could not update password.')
    setNotice({ kind: 'success', message: 'Password updated.' })

    const sessionUser = data.session.user
    const nextUser = toUser(sessionUser.id, sessionUser.email || trimmedEmail, sessionUser.user_metadata?.full_name as string)
    setUser(nextUser)
    cacheUser(nextUser)
    void fetchProfileName(nextUser.id, nextUser.email)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error && !error.message.includes('Auth session missing')) throw new Error(error.message || 'Sign out failed.')
    setUser(null)
    cacheUser(null)
  }

  const updateProfile = async (preferences: Record<string, unknown>) => {
    const token = await getValidAccessToken(180)
    if (!token) throw new Error('Authentication required to update profile.')

    let data: Record<string, unknown> | null = null
    let invokeError: Error | null = null

    try {
      const result = await supabase.functions.invoke('pro-profile-update', {
        body: { preferences },
        headers: { Authorization: `Bearer ${token}` },
      })
      data = result.data
      invokeError = result.error
    } catch (networkErr) {
      throw new Error("Couldn't reach Relevant. Check your connection and try again.")
    }

    if (invokeError) {
      const msg = (invokeError.message || '').toLowerCase()
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to send'))
        throw new Error("Couldn't reach Relevant. Check your connection and try again.")
      if (msg.includes('rate limit') || msg.includes('too many'))
        throw new Error('Too many updates. Please wait a few minutes and try again.')
      if (msg.includes('non-2xx') || msg.includes('edge function') || msg.includes('boot') || msg.includes('worker'))
        throw new Error("We're having a temporary issue saving your profile. Please try again in a moment.")
      throw new Error('Could not update profile. Please try again.')
    }

    const typed = data as { success?: boolean; message?: string; profile_refresh?: { status?: string } | null } | null
    if (typed?.success === false) throw new Error(typed.message || 'Could not update profile.')

    const { data: userRes } = await supabase.auth.getUser()
    const refreshed = userRes.user
    setNotice({ kind: 'success', message: 'Profile updated.' })

    const nextUser = toUser(
      refreshed?.id || user?.id || '',
      refreshed?.email || user?.email || '',
      typeof refreshed?.user_metadata?.full_name === 'string' ? refreshed.user_metadata.full_name : user?.name
    )
    setUser(nextUser)
    cacheUser(nextUser)
    void fetchProfileName(nextUser.id, nextUser.email)
  }

  const markOnboardingComplete = useCallback(() => setNeedsOnboarding(false), [])
  const clearPendingVerification = useCallback(() => {
    setNeedsEmailVerification(false)
    setPendingVerificationEmail(null)
  }, [])

  const value: AuthContextType = {
    user, isLoading, isAuthenticated: Boolean(user),
    needsOnboarding, markOnboardingComplete,
    needsEmailVerification, pendingVerificationEmail, clearPendingVerification,
    notice, clearNotice: () => setNotice(null),
    signIn, signUp, verifySignUp, resendVerification,
    updateProfile, requestPasswordReset, confirmPasswordReset, signOut,
    isSignalForgeInProgress, setIsSignalForgeInProgress,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
