import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create your Relevant account. Get AI-powered personalized news briefings for your role, company, and industry.',
  openGraph: {
    title: 'Sign Up — Relevant',
    description:
      'Create your Relevant account. Get AI-powered personalized news briefings for your role, company, and industry.',
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
