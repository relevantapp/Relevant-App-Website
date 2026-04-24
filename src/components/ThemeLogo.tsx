import Image from 'next/image'
import type { CSSProperties } from 'react'

type ThemeLogoProps = {
  alt?: string
  width: number
  height: number
  className?: string
  priority?: boolean
}

export default function ThemeLogo({
  alt = 'Relevant',
  width,
  height,
  className = '',
  priority = false,
}: ThemeLogoProps) {
  return (
    <span
      className={`theme-logo ${className}`}
      role="img"
      aria-label={alt}
      style={{
        '--theme-logo-width': `${width}px`,
        '--theme-logo-height': `${height}px`,
      } as CSSProperties}
    >
      <Image
        src="/relevant-logo-foreground-white-v2.png"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        className="theme-logo__image theme-logo__image--dark"
        priority={priority}
      />
      <Image
        src="/relevant-logo-foreground-dark-v2.png"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        className="theme-logo__image theme-logo__image--light"
        priority={priority}
      />
    </span>
  )
}
