'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Newspaper, Search, BookOpen, User, LogOut, Menu, X, Sun, Moon, Briefcase } from 'lucide-react'
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const navItems = [
    { href: '/app/feed', label: 'Feed', mobileLabel: 'Feed', icon: Newspaper },
    { href: '/app/search', label: 'Search', mobileLabel: 'Search', icon: Search },
    { href: '/app/meeting-prep', label: 'Meeting Prep', mobileLabel: 'Prep', icon: Briefcase },
    { href: '/app/journal', label: 'Journal', mobileLabel: 'Journal', icon: BookOpen },
    { href: '/app/profile', label: 'You', mobileLabel: 'You', icon: User },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-[1400px] items-center justify-between gap-3 px-4 py-2 lg:min-h-16 lg:px-8 xl:px-12">
          <Link href="/app/feed" className="flex items-center gap-2 lg:gap-3">
            <span className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5 lg:rounded-2xl lg:p-1">
              <AppLogo alt="Relevant app logo" width={30} height={30} className="rounded-lg lg:h-9 lg:w-9" priority />
            </span>
            <span className="hidden font-display text-lg font-semibold text-[var(--text)] sm:inline lg:text-xl">Relevant</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 md:flex lg:gap-3">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:px-4 lg:py-2.5 ${
                    active
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user && (
              <div className="hidden items-center gap-3 md:flex">
                <span className="text-sm text-[var(--text-muted)]">{user.name}</span>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-accent-coral"
                  aria-label="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[var(--text-muted)] md:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--bg)] p-4 md:hidden">
            {user && (
              <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Signed in</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{user.name || user.email}</p>
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                      active
                        ? 'bg-accent-blue/10 text-accent-blue'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                )
              })}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-accent-coral hover:bg-[var(--surface)]"
                >
                  <LogOut size={20} />
                  Sign out
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 pb-24 md:pb-6 lg:px-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg)]/92 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-[640px] grid-cols-5 gap-1 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors ${
                  active
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-[var(--text-soft)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                }`}
                aria-label={item.label}
              >
                <item.icon size={18} />
                <span className="truncate">{item.mobileLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
