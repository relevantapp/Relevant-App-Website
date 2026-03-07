import type { Metadata } from 'next'

import LegalDocument, { type LegalSection } from '@/components/LegalDocument'

export const metadata: Metadata = {
  title: 'Privacy Policy | Relevant',
  description: 'How Relevant collects, uses, and protects data across the website and product.',
}

const sections: LegalSection[] = [
  {
    title: '1. Overview',
    body:
      'Relevant provides a personalized feed of summarized news, trends, and insights sourced from licensed APIs and public feeds.',
  },
  {
    title: '2. Information We Collect',
    body:
      'We collect account information, usage data, device information, and website cookies necessary to operate and improve the service.',
  },
  {
    title: '3. Information We Do Not Collect',
    body:
      'We do not sell personal data, store payment card information, track users across apps for advertising, or collect precise location data.',
  },
  {
    title: '4. How We Use Information',
    body:
      'Information is used to provide the service, personalize content, improve performance, maintain security, and provide support.',
  },
  {
    title: '5. News Sources and Storage',
    body: 'We store headlines, metadata, and short summaries. Full articles are not stored unless explicitly licensed.',
  },
  {
    title: '6. AI Usage',
    body:
      'AI is used to summarize content, categorize topics, and generate relevance explanations. AI is not trained on identifiable personal data.',
  },
  {
    title: '7. Cookies',
    body: 'Cookies are used on our website for session functionality, analytics, and performance optimization.',
  },
  {
    title: '8. Sharing and Service Providers',
    body:
      'Data is shared only with service providers for hosting, analytics, payments, and subscriptions under contractual safeguards.',
  },
  {
    title: '9. Data Retention',
    body:
      'Personal data is retained only for as long as required for active accounts, legal compliance, and security.',
  },
  {
    title: '10. Security',
    body:
      'We use reasonable administrative, technical, and organizational safeguards to protect personal information.',
  },
  {
    title: '11. Privacy Rights',
    body:
      'Users have rights under GDPR, PIPEDA, US state laws, CCPA/CPRA, Quebec Law 25, and Mexico\'s LFPDPPP.',
  },
  {
    title: '12. Quebec Law 25',
    body:
      'Quebec residents are provided clear notice and express consent where required, including cross-border processing disclosure.',
  },
  {
    title: '13. International Data Transfers',
    body:
      'Data may be processed in Canada, the United States, or other jurisdictions with appropriate safeguards.',
  },
  {
    title: "14. Children's Privacy",
    body:
      'Relevant is not intended for children under the age of 13 and does not knowingly collect their data.',
  },
  {
    title: '15. Policy Updates',
    body: 'Material changes to this policy will be communicated through the app or website.',
  },
]

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This policy explains what Relevant collects, what it does with that data, and the boundaries we keep in place while the system turns noise into signal."
      effectiveDate="January 3, 2026"
      secondaryHref="/terms"
      secondaryLabel="Terms"
      sections={sections}
    />
  )
}
