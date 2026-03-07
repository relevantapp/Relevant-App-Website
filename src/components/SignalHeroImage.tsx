'use client'

import { useState } from 'react'

type Props = {
  src: string
  alt?: string
}

export default function SignalHeroImage({ src, alt = '' }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="sp-hero-img"
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
