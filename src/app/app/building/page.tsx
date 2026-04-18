'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSignalForgeReadiness } from '@/hooks/useSignalForgeReadiness'
import { clearSignalForgePending } from '@/lib/signalForgeSession'

const SLOW_TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

export default function BuildingPage() {
  const { user, setIsSignalForgeInProgress } = useAuth()
  const router = useRouter()
  const { isReady } = useSignalForgeReadiness(user?.id ?? null, true)
  const [showSlowMessage, setShowSlowMessage] = useState(false)

  // Navigate when ready
  useEffect(() => {
    if (!isReady || !user) return
    clearSignalForgePending(user.id)
    setIsSignalForgeInProgress(false)
    router.push('/app/feed')
  }, [isReady, user, router, setIsSignalForgeInProgress])

  // Show reassurance after 3 minutes
  useEffect(() => {
    const timer = setTimeout(() => setShowSlowMessage(true), SLOW_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        {/* Pulsing icon */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-8"
        >
          <Sparkles className="h-12 w-12 text-accent-blue" />
        </motion.div>

        <h1 className="mb-2 text-2xl font-semibold text-[var(--text)]">
          Building your intelligence feed&hellip;
        </h1>
        <p className="mb-10 text-sm text-[var(--text-muted)]">
          This usually takes 30–60 seconds.
        </p>

        {/* Progress steps */}
        <div className="flex flex-col items-start gap-4 text-left text-sm">
          <StepRow done label="Profile saved" />
          <StepRow spinning label="Computing your influence dimensions…" />
          <StepRow spinning label="Finding relevant signals…" />
        </div>

        {/* Slow message */}
        {showSlowMessage && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 max-w-sm text-xs text-[var(--text-soft)]"
          >
            This is taking longer than usual. You can close this tab and
            we&rsquo;ll have your feed ready when you come back.
          </motion.p>
        )}
      </div>
    </div>
  )
}

function StepRow({ done, spinning, label }: { done?: boolean; spinning?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : spinning ? (
        <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
      ) : (
        <div className="h-4 w-4" />
      )}
      <span className={done ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>{label}</span>
    </div>
  )
}
