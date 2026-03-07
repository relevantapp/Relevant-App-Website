import Link from 'next/link'
import Image from 'next/image'

type BrandMarkProps = {
  href?: string
  ariaLabel?: string
  className?: string
}

export default function BrandMark({ href, ariaLabel = 'Relevant home', className = '' }: BrandMarkProps) {
  const classes = ['brand-lockup', className].filter(Boolean).join(' ')
  const mark = (
    <>
      <Image
        src="/logo.svg"
        alt="Relevant"
        width={28}
        height={28}
        className="brand-logo"
        unoptimized
      />
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
