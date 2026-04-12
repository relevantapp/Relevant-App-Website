import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import AuthGuard from '@/components/app/AuthGuard'

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
  metadataBase: new URL('https://www.getrelevantapp.com'),
  title: {
    default: 'Relevant — Less Noise. More Clarity.',
    template: '%s | Relevant',
  },
  description:
    'Relevant is an AI app that watches the news for your work, then tells you what changed, why it matters, and what to do next.',
  keywords: [
    'relevant app', 'ai news app', 'personalized news', 'work intelligence',
    'ai briefing', 'news for professionals', 'role-aware news',
    'what happened why it matters', 'ai relevance engine',
    'business intelligence app', 'news monitoring',
  ],
  authors: [{ name: 'Relevant' }],
  creator: 'Relevant',
  publisher: 'Relevant',
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
    icon: '/app-icon.png',
    apple: '/app-icon.png',
  },
  openGraph: {
    title: 'Relevant — Less Noise. More Clarity.',
    description:
      'AI that reads the news for your work and tells you what changed, why it matters, and what it means for you.',
    url: 'https://www.getrelevantapp.com',
    siteName: 'Relevant',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Relevant — AI-powered personalized news feed for professionals',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Relevant — Less Noise. More Clarity.',
    description:
      'AI that reads the news for your work and tells you what changed, why it matters, and what it means for you.',
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
    { media: '(prefers-color-scheme: dark)', color: '#202124' },
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
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
      'Relevant is an AI-powered app that watches the news for your work, then tells you what changed, why it matters, and what to do next. Role-aware, personalized intelligence — not a generic feed.',
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
      </body>
    </html>
  )
}
