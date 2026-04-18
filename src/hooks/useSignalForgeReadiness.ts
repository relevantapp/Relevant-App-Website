'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const POLL_INTERVAL = 5_000

export function useSignalForgeReadiness(userId: string | null, active: boolean) {
  const [isReady, setIsReady] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!userId || !active || isReady) {
      setIsPolling(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    let cancelled = false

    const check = async () => {
      try {
        // Get user's onboarding_completed_at
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed_at')
          .eq('id', userId)
          .maybeSingle()

        const completedAt = profile?.onboarding_completed_at
        if (!completedAt) return

        // Check for signal_items created after onboarding
        const { count } = await supabase
          .from('signal_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', completedAt)

        if (!cancelled && count && count > 0) {
          setIsReady(true)
          setIsPolling(false)
        }
      } catch {
        // Retry on next interval
      }
    }

    setIsPolling(true)
    void check()
    intervalRef.current = setInterval(check, POLL_INTERVAL)

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [userId, active, isReady])

  return { isReady, isPolling }
}
