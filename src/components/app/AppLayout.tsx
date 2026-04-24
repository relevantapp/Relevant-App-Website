'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Newspaper, Search, BookOpen, User, LogOut, Sun, Moon, Briefcase } from 'lucide-react'
import AppLogo from '@/components/AppLogo'

function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (document.documentElement.dataset.theme as 'dark' | 'light') || 'dark'
  })

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    localStorage.setItem('relevant-site-theme', next)
  }

  return { theme, toggleTheme }
}

/** Derive mobile page title from current path */
function getMobileTitle(pathname: string): string | null {
  if (pathname.startsWith('/app/feed')) return 'Feed'
  if (pathname.startsWith('/app/search')) return 'Search'
  if (pathname.startsWith('/app/intelligence')) return 'Intelligence'
  if (pathname.startsWith('/app/meeting-prep')) return 'Intelligence'
  if (pathname.startsWith('/app/journal')) return 'Journal'
  if (pathname.startsWith('/app/profile')) return 'You'
  if (pathname.startsWith('/app/signal')) return 'Signal'
  return null
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const navItems = [
    { href: '/app/feed', label: 'Feed', mobileLabel: 'Feed', icon: Newspaper },
    { href: '/app/search', label: 'Search', mobileLabel: 'Search', icon: Search },
    { href: '/app/intelligence', label: 'Intelligence', mobileLabel: 'Intel', icon: Briefcase },
    { href: '/app/journal', label: 'Journal', mobileLabel: 'Journal', icon: BookOpen },
    { href: '/app/profile', label: 'You', mobileLabel: 'You', icon: User },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const mobileTitle = getMobileTitle(pathname)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 px-3 pb-2 pt-3 md:px-5 md:pb-3 md:pt-4">
        <div className="mx-auto max-w-[1400px] rounded-[1.65rem] border border-[var(--border)] bg-[var(--bg)]/80 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <div className="flex min-h-12 items-center justify-between gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-elevated)]/72 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:min-h-14 md:px-3 lg:px-4">
          {/* Mobile: centered page title with logo left */}
          <Link
            href="/app/feed"
            className="group flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--surface)] active:scale-[0.98] lg:gap-3"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:h-10 md:w-10">
              <AppLogo alt="Relevant app logo" width={24} height={24} className="h-6 w-6 rounded-none" priority />
            </span>
            <span className="min-w-0 truncate font-display text-base font-semibold tracking-[-0.01em] text-[var(--text)] md:text-lg lg:text-xl">
              {mobileTitle && <span className="md:hidden">{mobileTitle}</span>}
              <span className={mobileTitle ? 'hidden md:inline' : ''}>Relevant</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center rounded-full border border-[var(--border)] bg-[var(--bg)]/50 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:flex">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium tracking-[-0.01em] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] lg:px-4 lg:py-2.5 ${
                    active
                      ? 'bg-[var(--text)] text-[var(--bg)] shadow-[0_8px_26px_rgba(0,0,0,0.24)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
                >
                  <item.icon size={16} strokeWidth={1.8} className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]/45 text-[var(--text-muted)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[var(--surface)] hover:text-[var(--text)] active:scale-[0.96] md:h-10 md:w-10"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
            </button>

            {user && (
              <div className="hidden items-center gap-2 md:flex">
                <span className="max-w-[150px] truncate rounded-full border border-[var(--border)] bg-[var(--bg)]/45 px-3 py-2 text-sm text-[var(--text-muted)] lg:max-w-[220px]">{user.name}</span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]/45 text-[var(--text-muted)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[var(--surface)] hover:text-[var(--text)] active:scale-[0.96]"
                  aria-label="Sign out"
                >
                  <LogOut size={17} strokeWidth={1.8} />
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1400px] px-4 py-3 pb-28 md:py-5 md:pb-8 lg:px-8">{children}</main>

      {/* Bottom tab bar — mobile only */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:hidden">
        <div className="mx-auto max-w-[640px] rounded-[1.65rem] border border-[var(--border)] bg-[var(--bg)]/86 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
          <div className="grid grid-cols-5 gap-1 rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-elevated)]/76 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1rem] px-1 py-2 text-[10px] font-semibold tracking-[-0.01em] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                    active
                      ? 'bg-[var(--text)] text-[var(--bg)] shadow-[0_8px_24px_rgba(0,0,0,0.22)]'
                      : 'text-[var(--text-soft)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
                  aria-label={item.label}
                >
                  <item.icon size={17} strokeWidth={1.8} className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5" />
                  <span className="truncate">{item.mobileLabel}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
