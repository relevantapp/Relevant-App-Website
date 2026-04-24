import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to Relevant to access role-aware signals, cited intelligence, and clear next moves for your work.',
  openGraph: {
    title: 'Sign In — Relevant',
    description:
      'Sign in to Relevant to access role-aware signals, cited intelligence, and clear next moves for your work.',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
