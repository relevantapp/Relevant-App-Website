'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AppLogo from '@/components/AppLogo'

const FIRST_BRIEF_CONTEXT_KEY = 'relevant_first_brief_context'

type FirstBriefSignupContext = {
  source?: string
  preparation?: string
  role?: string
  companyOrMarket?: string
  email?: string
  createdAt?: string
}

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [firstBriefContext, setFirstBriefContext] = useState<FirstBriefSignupContext | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isFirstBrief = params.get('intent') === 'first-brief'
    const queryEmail = params.get('email')?.trim().toLowerCase() ?? ''

    let storedContext: FirstBriefSignupContext | null = null
    try {
      const raw = localStorage.getItem(FIRST_BRIEF_CONTEXT_KEY)
      storedContext = raw ? JSON.parse(raw) as FirstBriefSignupContext : null
    } catch {
      storedContext = null
    }

    if (queryEmail) setEmail(queryEmail)
    if (isFirstBrief && storedContext) {
      setFirstBriefContext(storedContext)
      if (!queryEmail && storedContext.email) setEmail(storedContext.email)
    }
  }, [])

  const passwordError = password.length > 0 && password.length < 8
    ? 'Password must be at least 8 characters.'
    : confirmPassword.length > 0 && password !== confirmPassword
      ? 'Passwords do not match.'
      : ''

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const preferences = firstBriefContext
        ? {
            profile_kind: 'professional',
            role_raw: firstBriefContext.role,
            company_name_manual: firstBriefContext.companyOrMarket,
            first_brief_preparation: firstBriefContext.preparation,
            first_brief_source: firstBriefContext.source,
            profile_context_note: [
              firstBriefContext.preparation ? `Preparing for: ${firstBriefContext.preparation}.` : '',
              firstBriefContext.companyOrMarket ? `Company or market: ${firstBriefContext.companyOrMarket}.` : '',
            ].filter(Boolean).join(' '),
          }
        : undefined

      await signUp(name, email, password, preferences)
      router.push('/verify-email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
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

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left showcase panel */}
      <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-[#08080a]">
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(168,85,247,0.12) 0%, transparent 60%)',
        }} />
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
        <div className="relative z-10 mt-8 text-center px-8">
          <h2 className="font-display text-xl font-bold text-white">
            Less noise. More clarity.
          </h2>
          <p className="mt-2 text-sm text-white/60 max-w-[280px] mx-auto">
            Role-aware signals for what changed, why it matters, and what to do next.
          </p>
        </div>
        <Link
          href="/"
          className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>

      {/* Right form panel */}
      <div className="flex items-start justify-center bg-[var(--bg)] px-5 py-8 sm:items-center sm:px-6 sm:py-12">
        <motion.div {...fadeIn} className="w-full max-w-[420px] pt-2 sm:pt-0">
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
            <h1 className="font-display text-3xl font-bold text-[var(--text)] sm:text-4xl">
              {firstBriefContext ? 'Finish your first brief setup' : getGreeting()}
            </h1>
            <p className="mt-2 text-base text-[var(--text-muted)]">
              {firstBriefContext
                ? 'Your brief context is attached. Add your name and password to continue.'
                : 'Create your Relevant account'}
            </p>
          </div>

          {firstBriefContext && (
            <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-blue">First brief</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {firstBriefContext.preparation || 'Brief'} for {firstBriefContext.role || 'your role'}
                {firstBriefContext.companyOrMarket ? `, focused on ${firstBriefContext.companyOrMarket}` : ''}.
              </p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Full name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required className={inputClass} />
              </div>
            </div>

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
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} className={inputClassWithToggle} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] transition-colors hover:text-[var(--text-muted)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Confirm password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className={inputClass} />
              </div>
            </div>

            {passwordError && <p className="text-xs text-semantic-error">{passwordError}</p>}

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-semantic-errorMuted px-3 py-2.5 text-sm text-semantic-error">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading || Boolean(passwordError)} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent-blue text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-[var(--text-soft)]">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-accent-blue underline underline-offset-2 hover:opacity-80">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-accent-blue underline underline-offset-2 hover:opacity-80">Privacy Policy</Link>.
          </p>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-accent-blue transition-opacity hover:opacity-80">
              Sign in
            </Link>
          </p>

          <p className="mt-12 text-center text-xs text-[var(--text-soft)]">
            &copy; {new Date().getFullYear()} Relevant. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
