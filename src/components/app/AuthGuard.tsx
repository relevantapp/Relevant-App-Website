'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/verify-email', '/privacy', '/terms', '/signal']

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
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
