'use client'

import { useAuth } from '@/context/AuthContext'
import { marketingSeoPages } from '@/lib/marketingSeoPages'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/privacy',
  '/terms',
  '/signal',
  ...marketingSeoPages.map((page) => `/${page.slug}`),
]

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, needsEmailVerification, needsOnboarding, pendingVerificationEmail, isSignalForgeInProgress } = useAuth()
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/signal/'))

  useEffect(() => {
    if (isLoading) return

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/verify-email'
    const isAppPage = pathname.startsWith('/app')
    const isOnboarding = pathname === '/onboarding'

    // Already authenticated user on auth pages → redirect to feed
    if (isAuthenticated && isAuthPage && !needsOnboarding) {
      router.replace('/app/feed')
      return
    }

    // Needs email verification → redirect to verify page
    if (needsEmailVerification && pendingVerificationEmail && pathname !== '/verify-email') {
      router.replace('/verify-email')
      return
    }

    // Needs onboarding → redirect to onboarding
    if (isAuthenticated && needsOnboarding && !isOnboarding) {
      router.replace('/onboarding')
      return
    }

    // Signal forge in progress → redirect to building screen
    if (isAuthenticated && isSignalForgeInProgress && !pathname.startsWith('/app/building')) {
      router.replace('/app/building')
      return
    }

    // Not authenticated trying to access app pages → redirect to login
    if (!isAuthenticated && isAppPage) {
      router.replace('/login')
      return
    }
  }, [isAuthenticated, isLoading, needsEmailVerification, needsOnboarding, pendingVerificationEmail, isSignalForgeInProgress, isPublic, pathname, router])

  if (isLoading) {
    if (isPublic) {
      return <>{children}</>
    }

    return (
      <div className="min-h-screen bg-[var(--bg)] px-3 pt-3 md:px-5 md:pt-4">
        <div className="mx-auto max-w-[1400px] rounded-[1.65rem] border border-[var(--border)] bg-[var(--bg)]/80 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <div className="flex min-h-12 items-center justify-between rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-elevated)]/72 px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--surface)]" />
              <div className="h-5 w-24 animate-pulse rounded bg-[var(--surface)]" />
            </div>
            <div className="hidden gap-2 md:flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-[var(--surface)]" />
              ))}
            </div>
            <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--surface)]" />
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-[1400px] px-1 md:px-3">
          <div className="mb-6 max-w-[680px]">
            <div className="mb-4 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface)]" />
              <div className="h-9 w-36 animate-pulse rounded bg-[var(--surface)]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-h-[154px] animate-pulse rounded-xl bg-[var(--text)]/85" />
              <div className="grid min-h-[154px] gap-3">
                <div className="animate-pulse rounded-xl bg-[var(--surface)]" />
                <div className="animate-pulse rounded-xl bg-[var(--surface)]" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
