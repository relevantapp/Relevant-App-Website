import ThemeLogo from './ThemeLogo'

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
    <ThemeLogo
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}
