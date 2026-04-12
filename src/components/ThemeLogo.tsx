import Image from 'next/image'

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
