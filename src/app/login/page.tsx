'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AppLogo from '@/components/AppLogo'

type ResetStep = 'idle' | 'request' | 'verify'

export default function LoginPage() {
  const { signIn, requestPasswordReset, confirmPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [resetStep, setResetStep] = useState<ResetStep>('idle')
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      // AuthGuard handles routing (to /app/feed or /onboarding based on state)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)
    try {
      await requestPasswordReset(resetEmail)
      setResetStep('verify')
      setResetSuccess('Check your email for the reset code.')
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Could not send reset code.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault()
    setResetError('')
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.')
      return
    }
    setResetLoading(true)
    try {
      await confirmPasswordReset(resetEmail, resetCode, newPassword)
      setResetSuccess('Password updated. You can now sign in.')
      setResetStep('idle')
      setPassword('')
      setEmail(resetEmail)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Could not reset password.')
    } finally {
      setResetLoading(false)
    }
  }

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  }

  const inputClass = "h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text)] placeholder-[var(--text-soft)] outline-none transition-colors focus:border-accent-blue"
  const inputClassWithToggle = "h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-10 text-sm text-[var(--text)] placeholder-[var(--text-soft)] outline-none transition-colors focus:border-accent-blue"

  function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  /* ── Left showcase panel ── */
  const showcasePanel = (
    <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-[#08080a]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(168,85,247,0.12) 0%, transparent 60%)',
      }} />
      {/* Phone mockup */}
      <div className="relative z-10 w-[260px] drop-shadow-2xl">
        <Image
          src="/relevant-feed-mobile.png"
          alt="Relevant app feed"
          width={520}
          height={1040}
          priority
          className="rounded-[2rem] border border-white/10"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      {/* Tagline */}
      <div className="relative z-10 mt-8 text-center px-8">
        <h2 className="font-display text-xl font-bold text-white">
          Less noise. More clarity.
        </h2>
        <p className="mt-2 text-sm text-white/60 max-w-[280px] mx-auto">
          Role-aware signals for what changed, why it matters, and what to do next.
        </p>
      </div>
      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/80"
      >
        <ArrowLeft size={16} /> Back to home
      </Link>
    </div>
  )

  /* ── Forgot password flow ── */
  if (resetStep !== 'idle') {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        {showcasePanel}
        <div className="flex items-start justify-center bg-[var(--bg)] px-5 py-8 sm:items-center sm:px-6 sm:py-12">
          <motion.div {...fadeIn} className="w-full max-w-[420px] pt-2 sm:pt-0">
            <div className="mb-8">
              <Link href="/" className="mb-6 flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)] lg:hidden">
                <ArrowLeft size={16} /> Back to home
              </Link>
              <h1 className="font-display text-2xl font-bold text-[var(--text)]">Reset password</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {resetStep === 'request' ? "Enter your email and we'll send a reset code." : 'Enter the code and choose a new password.'}
              </p>
            </div>

            <button
              onClick={() => { setResetStep('idle'); setResetError(''); setResetSuccess('') }}
              className="mb-5 flex items-center gap-1 text-sm text-accent-blue transition-opacity hover:opacity-80"
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>

            {resetStep === 'request' && (
              <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Email address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
                  </div>
                </div>
                {resetError && <p className="text-sm text-semantic-error">{resetError}</p>}
                {resetSuccess && <p className="text-sm text-semantic-success">{resetSuccess}</p>}
                <button type="submit" disabled={resetLoading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                  {resetLoading ? <Loader2 size={18} className="animate-spin" /> : 'Send reset code'}
                </button>
              </form>
            )}

            {resetStep === 'verify' && (
              <form onSubmit={handleConfirmReset} className="flex flex-col gap-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Code sent to <strong className="text-[var(--text)]">{resetEmail}</strong>
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">8-digit code</label>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                    <input type="text" inputMode="numeric" value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000000" required className={`${inputClass} tracking-[0.3em]`} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">New password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Confirm password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Re-enter password" required className={inputClass} />
                  </div>
                </div>
                {resetError && <p className="text-sm text-semantic-error">{resetError}</p>}
                {resetSuccess && <p className="text-sm text-semantic-success">{resetSuccess}</p>}
                <button type="submit" disabled={resetLoading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                  {resetLoading ? <Loader2 size={18} className="animate-spin" /> : 'Update password'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  /* ── Main sign-in ── */
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {showcasePanel}

      <div className="flex items-start justify-center bg-[var(--bg)] px-5 py-8 sm:items-center sm:px-6 sm:py-12">
        <motion.div {...fadeIn} className="w-full max-w-[420px] pt-2 sm:pt-0">
          {/* Mobile-only back link */}
          <Link href="/" className="mb-6 flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)] lg:hidden">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="mb-6 flex items-center gap-2.5">
            <span className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5">
              <AppLogo alt="Relevant app logo" width={34} height={34} className="rounded-lg" priority />
            </span>
            <span className="font-display text-xl font-semibold text-[var(--text)]">Relevant</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-[var(--text)] sm:text-4xl">{getGreeting()}</h1>
            <p className="mt-2 text-base text-[var(--text-muted)]">Sign in to your Relevant feed</p>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-soft)]">Continue with email</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className={inputClassWithToggle} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] transition-colors hover:text-[var(--text-muted)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => { setResetStep('request'); setResetEmail(email); setResetError(''); setResetSuccess('') }} className="text-sm text-accent-blue transition-opacity hover:opacity-80">
                Forgot password?
              </button>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-semantic-errorMuted px-3 py-2.5 text-sm text-semantic-error">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-accent-blue transition-opacity hover:opacity-80">
              Sign up
            </Link>
          </p>

          {/* Footer */}
          <p className="mt-12 text-center text-xs text-[var(--text-soft)]">
            &copy; {new Date().getFullYear()} Relevant. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
