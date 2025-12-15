import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Relevant - Stay Informed Without the Noise',
  description: 'Get a personalized news feed that cuts through the clutter. No doom scrolling, no noise—just what matters to you.',
  keywords: ['news', 'personalized feed', 'relevant news', 'no doom scrolling', 'curated content'],
  openGraph: {
    title: 'Relevant - Stay Informed Without the Noise',
    description: 'Get a personalized news feed that cuts through the clutter. No doom scrolling, no noise—just what matters to you.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
