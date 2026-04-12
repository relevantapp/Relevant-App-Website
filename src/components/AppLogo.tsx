import Image from 'next/image'

type AppLogoProps = {
  alt?: string
  width: number
  height: number
  className?: string
  priority?: boolean
}

export default function AppLogo({
  alt = 'Relevant',
  width,
  height,
  className = '',
  priority = false,
}: AppLogoProps) {
  const classes = ['theme-logo', className].filter(Boolean).join(' ')

  return (
    <span className={classes} style={{ width, height }}>
      <Image
        src="/logo.svg"
        alt={alt}
        width={width}
        height={height}
        className="theme-logo__image theme-logo__image--dark"
        priority={priority}
      />
      <Image
        src="/logo-light.svg"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        className="theme-logo__image theme-logo__image--light"
      />
    </span>
  )
}
