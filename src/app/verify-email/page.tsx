'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, MailCheck, RotateCcw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const CODE_LENGTH = 8
const RESEND_COOLDOWN = 60

export default function VerifyEmailPage() {
  const { verifySignUp, resendVerification, pendingVerificationEmail } = useAuth()
  const router = useRouter()

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const email = pendingVerificationEmail || ''

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    const next = [...digits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
  }

  const code = digits.join('')

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length < CODE_LENGTH) {
      setError('Enter the full 8-digit code.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await verifySignUp(email, code)
      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return
    setResendMessage('')
    try {
      await resendVerification(email)
      setResendCooldown(RESEND_COOLDOWN)
      setResendMessage('Code re-sent. Check your email.')
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : 'Could not resend.')
    }
  }

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <motion.div {...fadeIn} className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue/10">
            <MailCheck size={24} className="text-accent-blue" />
          </div>
          <span className="font-display text-xl font-semibold text-[var(--text)]">Check your email</span>
          {email && (
            <p className="text-center text-sm text-[var(--text-muted)]">
              We sent an 8-digit code to <strong className="text-[var(--text)]">{email}</strong>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8">
          <form onSubmit={handleVerify} className="flex flex-col gap-5">
            {/* Code input boxes */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center text-lg font-semibold text-[var(--text)] outline-none transition-colors focus:border-accent-blue sm:h-14 sm:w-10 sm:text-xl"
                />
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-semantic-errorMuted px-3 py-2.5 text-center text-sm text-semantic-error"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || code.length < CODE_LENGTH}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent-blue text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify email'}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 flex flex-col items-center gap-1">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="flex items-center gap-1.5 text-sm text-accent-blue transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              <RotateCcw size={14} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
            {resendMessage && <p className="text-xs text-[var(--text-muted)]">{resendMessage}</p>}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
