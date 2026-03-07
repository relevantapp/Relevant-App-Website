import Link from 'next/link'

type BrandMarkProps = {
  href?: string
  ariaLabel?: string
  className?: string
}

export default function BrandMark({ href, ariaLabel = 'Relevant home', className = '' }: BrandMarkProps) {
  const classes = ['brand-lockup', className].filter(Boolean).join(' ')
  const mark = (
    <>
      <span className="brand-dot" />
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
