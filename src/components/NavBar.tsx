'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type NavItem = {
  label: string
  href: string
  external?: boolean
  ariaLabel?: string
  icon?: ReactNode
}

type NavBarProps = {
  items: NavItem[]
  logoHref?: string
}

export default function NavBar({ items, logoHref = '/' }: NavBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (!navRef.current) return
      if (!navRef.current.contains(target)) setIsOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isOpen])

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <nav ref={navRef} className="nav" data-open={isOpen ? 'true' : 'false'}>
      <div className="nav-inner">
        <Link href={logoHref} className="nav-logo" aria-label="Relevant home">
          <Image src="/logo-black.svg" alt="Relevant" width={32} height={32} style={{ display: 'block' }} />
          <span className="nav-logo-text">Relevant</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label="Toggle navigation"
          aria-haspopup="menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="nav-toggle-bars" aria-hidden="true">
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </span>
        </button>

        <div className="nav-links" id={menuId}>
          {items.map((item) => {
            const content = item.icon ? (
              <>
                {item.icon}
                <span className="sr-only">{item.label}</span>
              </>
            ) : (
              item.label
            )

            const className = item.icon ? 'nav-link nav-link-icon' : 'nav-link'
            const isHashLink = item.href.startsWith('#')

            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={className}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.ariaLabel || item.label}
                  onClick={handleLinkClick}
                >
                  {content}
                </a>
              )
            }

            if (isHashLink) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={className}
                  aria-label={item.ariaLabel || item.label}
                  onClick={handleLinkClick}
                >
                  {content}
                </a>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={className}
                aria-label={item.ariaLabel || item.label}
                onClick={handleLinkClick}
              >
                {content}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
