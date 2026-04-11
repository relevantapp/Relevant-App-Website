import type { Metadata } from 'next'
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
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
  title: 'Relevant | Less Noise. More Clarity.',
  description:
    'Relevant is an AI app that watches the news for your work, then tells you what changed and why it matters to you.',
  keywords: ['ai news app', 'work alerts', 'what happened why it matters', 'personalized work intelligence', 'relevant app'],
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Relevant | Less Noise. More Clarity.',
    description:
      'An AI app that reads the news for your work and tells you what changed, why it matters, and what it means for you.',
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  )
}
