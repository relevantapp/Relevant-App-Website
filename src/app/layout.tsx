import type { Metadata } from 'next'
import { IBM_Plex_Mono, Instrument_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'

const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-mono' })

const themeScript = `
  (function () {
    try {
      var storedTheme = window.localStorage.getItem('relevant-site-theme');
      var resolvedTheme =
        storedTheme === 'light' || storedTheme === 'dark'
          ? storedTheme
          : window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.style.colorScheme = resolvedTheme;
    } catch (error) {}
  })();
`

export const metadata: Metadata = {
  title: 'Relevant | Role-Aware Relevance Engine',
  description:
    'Relevant turns constant noise into signal for your role, goals, and next move with three outputs: what happened, why it matters, and what to do next.',
  keywords: ['relevance engine', 'role-aware intelligence', 'signal feed', 'goal lens', 'what happened why it matters what to do'],
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Relevant | Role-Aware Relevance Engine',
    description:
      'A role-aware relevance engine that filters noise into signal for your work, goals, and next move.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${instrumentSans.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  )
}
