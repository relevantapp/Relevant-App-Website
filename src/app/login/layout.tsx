import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your Relevant account to access your personalized intelligence feed.',
  openGraph: {
    title: 'Sign In — Relevant',
    description:
      'Sign in to your Relevant account to access your personalized intelligence feed.',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
