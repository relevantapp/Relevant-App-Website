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
  return (
    <Image
      src="/app-icon.png"
      alt={alt}
      width={width}
      height={height}
      className={`theme-aware-logo ${className}`}
      priority={priority}
      style={{ borderRadius: '22%' }}
    />
  )
}
