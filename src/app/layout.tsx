import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import AuthGuard from '@/components/app/AuthGuard'
import { Analytics } from '@vercel/analytics/next'

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
          : 'dark';
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.style.colorScheme = resolvedTheme;
    } catch (error) {}
  })();
`

export const metadata: Metadata = {
  metadataBase: new URL('https://www.getrelevantapp.com'),
  title: {
    default: "Relevant - The Intelligence Platform for People Who Can't Miss What Changed",
    template: '%s | Relevant',
  },
  description:
    'Relevant is a role-aware relevance engine that turns market noise into cited signals, clear consequence, and next moves for your work.',
  keywords: [
    'relevant app', 'role-aware intelligence', 'relevance engine', 'work intelligence',
    'ai briefing', 'signal detection', 'strategic briefings',
    'what happened why it matters', 'ai relevance engine',
    'professional intelligence', 'business signals', 'decision intelligence',
  ],
  authors: [{ name: 'Relevant' }],
  creator: 'Relevant',
  publisher: 'Relevant',
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '1024x1024' },
      {
        url: '/favicon-light.png',
        type: 'image/png',
        sizes: '1024x1024',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon-dark.png',
        type: 'image/png',
        sizes: '1024x1024',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  },
  openGraph: {
    title: "The intelligence platform for people who can't miss what changed.",
    description:
      'Daily role-aware signals and on-demand intelligence for meetings, competitors, markets, and decisions.',
    url: 'https://www.getrelevantapp.com',
    siteName: 'Relevant',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Relevant — role-aware relevance engine for professionals',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "The intelligence platform for people who can't miss what changed.",
    description:
      'Daily role-aware signals and on-demand intelligence for meetings, competitors, markets, and decisions.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.getrelevantapp.com',
  },
  category: 'technology',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#f7f8fb' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Relevant',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'iOS',
    description:
      'Relevant is a role-aware relevance engine that watches the outside world for your work, then tells you what changed, why it matters, and what to do next.',
    url: 'https://www.getrelevantapp.com',
    image: 'https://www.getrelevantapp.com/og-image.png',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: undefined,
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
