import type { Metadata } from 'next'

import LegalDocument, { type LegalSection } from '@/components/LegalDocument'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Relevant',
  description: 'Terms governing access to Relevant, its website, and its role-aware relevance engine.',
}

const sections: LegalSection[] = [
  {
    title: '1. Service Description',
    body:
      'Relevant provides summarized news, trends, and informational content sourced from third-party providers. We do not create original journalism.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 13 years old and use the service for personal, non-commercial purposes only.',
  },
  {
    title: '3. Accounts and Access',
    body:
      'You are responsible for maintaining the confidentiality of your account credentials. We may suspend access if misuse is detected.',
  },
  {
    title: '4. Subscriptions and Billing',
    body:
      'Paid features are billed through third-party platforms such as Apple, Google, or Stripe. We do not store payment card details.',
  },
  {
    title: '5. Content Ownership',
    body:
      'All third-party news content belongs to its original publishers. Relevant owns its summaries, explanations, and app interface.',
  },
  {
    title: '6. Acceptable Use',
    body: 'You may not copy, redistribute, scrape, resell, or reverse-engineer the service or its content.',
  },
  {
    title: '7. Accuracy Disclaimer',
    body: 'Content is provided for informational purposes only and may contain errors or omissions.',
  },
  {
    title: '8. Bias Labels',
    body:
      'Any political or ideological labels are algorithmic and opinion-based, not statements of fact.',
  },
  {
    title: '9. Third-Party Links',
    body:
      'We are not responsible for external websites or third-party content linked through the service.',
  },
  {
    title: '10. Availability',
    body: 'We may modify or discontinue features at any time without notice.',
  },
  {
    title: '11. Termination',
    body: 'We may suspend or terminate accounts that violate these terms or applicable laws.',
  },
  {
    title: '12. Limitation of Liability',
    body: 'The service is provided "as is." Relevant is not liable for indirect damages or decisions made based on content.',
  },
  {
    title: '13. Governing Law',
    body: 'These terms are governed by the laws of Canada.',
  },
  {
    title: '14. Contact',
    body: (
      <>
        For questions about these terms, contact{' '}
        <a href="mailto:support@getrelevantapp.com">support@getrelevantapp.com</a>.
      </>
    ),
  },
]

export default function TermsAndConditions() {
  return (
    <LegalDocument
      eyebrow="Terms"
      title="Terms & Conditions"
      intro="These terms govern access to Relevant, the relevance engine that ranks what changed, why it matters, and what to do next."
      effectiveDate="January 3, 2026"
      secondaryHref="/privacy"
      secondaryLabel="Privacy"
      sections={sections}
    />
  )
}
