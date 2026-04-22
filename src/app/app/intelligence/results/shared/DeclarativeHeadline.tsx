'use client'

import { useEffect } from 'react'

const DECLARATIVE_VERB_REGEX = /\b(is|was|are|grew|leads|lags|doubled|fell|rose|sits|shifts)\b/i

interface DeclarativeHeadlineProps {
  headline: string
}

export default function DeclarativeHeadline({ headline }: DeclarativeHeadlineProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (DECLARATIVE_VERB_REGEX.test(headline)) return
    console.warn(`DeclarativeHeadline: headline should make a claim. Received "${headline}".`)
  }, [headline])

  return (
    <h3 className="display text-[22px] font-normal leading-tight tracking-tight text-[var(--text)] sm:text-[26px]">
      {headline}
    </h3>
  )
}

export { DECLARATIVE_VERB_REGEX }
