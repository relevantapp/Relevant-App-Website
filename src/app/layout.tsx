import type { Metadata, Viewport } from 'next'
import { Fraunces, IBM_Plex_Mono, Instrument_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import AuthGuard from '@/components/app/AuthGuard'

const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' })
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
    default: 'Relevant — Role-Aware Work Signals',
    template: '%s | Relevant',
  },
  description:
    'Relevant turns external change into a few clear work signals: what changed, why it matters to you, and what to do next.',
  keywords: [
    'relevant app', 'role-aware work signals', 'work radar', 'professional awareness',
    'ai work signals', 'role-aware relevance engine', 'business radar',
    'what changed why it matters', 'competitive monitoring',
    'market signals', 'personalized business intelligence',
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
    title: 'Relevant — Role-Aware Work Signals',
    description:
      'Relevant is your role-aware work radar for what changed, why it matters to you, and what to do next.',
    url: 'https://www.getrelevantapp.com',
    siteName: 'Relevant',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Relevant — role-aware work signals for professionals',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Relevant — Role-Aware Work Signals',
    description:
      'Relevant is your role-aware work radar for what changed, why it matters to you, and what to do next.',
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
    { media: '(prefers-color-scheme: dark)', color: '#07090c' },
    { media: '(prefers-color-scheme: light)', color: '#fbfaf7' },
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
      'Relevant is a role-aware relevance engine that turns external change into a few clear work signals: what changed, why it matters to you, and what to do next.',
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
      <body className={`${instrumentSans.variable} ${fraunces.variable} ${ibmPlexMono.variable} antialiased`}>
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
