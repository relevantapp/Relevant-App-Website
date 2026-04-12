import Link from 'next/link'
import ThemeLogo from './ThemeLogo'

type BrandMarkProps = {
  href?: string
  ariaLabel?: string
  className?: string
}

export default function BrandMark({ href, ariaLabel = 'Relevant home', className = '' }: BrandMarkProps) {
  const classes = ['brand-lockup', className].filter(Boolean).join(' ')
  const mark = (
    <>
      <ThemeLogo alt="Relevant" width={28} height={28} className="brand-logo" />
      <span className="brand-wordmark">Relevant</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {mark}
      </Link>
    )
  }

  return <div className={classes}>{mark}</div>
}
