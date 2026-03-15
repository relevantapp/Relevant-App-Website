import type { Metadata } from 'next'

import LegalDocument, { type LegalFact, type LegalSection } from '@/components/LegalDocument'
import { siteConfig } from '@/config/content'

export const metadata: Metadata = {
  title: 'Terms of Service | Relevant',
  description: 'Terms governing access to Relevant, the website, the mobile app, public share links, and future paid features.',
}

const SUPPORT_EMAIL = siteConfig.email

const facts: LegalFact[] = [
  {
    label: 'Delete account',
    value: 'Settings & safety → Delete account',
    detail: 'The app supports both scheduled deletion and permanent deletion.',
  },
  {
    label: 'Support',
    value: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>,
    detail: 'Use this email for legal questions, deletion help, or support requests.',
  },
  {
    label: 'Shared links',
    value: 'Public to anyone with the URL',
    detail: 'If you share a signal link, treat that public version as accessible to others who receive it.',
  },
]

const sections: LegalSection[] = [
  {
    id: 'what-relevant-is',
    title: 'What Relevant Is',
    body: (
      <>
        <p>
          Relevant is a work intelligence product that reads third-party news and source material,
          then uses software and AI to explain what may matter to your company, industry, or role.
        </p>
        <p>
          Relevant does not create original journalism and does not replace your own judgment.
          The service is informational and may be incomplete, delayed, or wrong.
        </p>
      </>
    ),
  },
  {
    id: 'accounts-and-eligibility',
    title: 'Accounts and Eligibility',
    body: (
      <>
        <p>
          You must be legally able to use the service in your jurisdiction and provide accurate account information.
          Keep your login credentials secure and do not share your account with others.
        </p>
        <p>
          If you use Relevant for a company or team, you represent that you have authority to do so.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    body: (
      <ul>
        <li>Do not break the law, abuse the service, or interfere with other users.</li>
        <li>Do not scrape, copy, resell, reverse engineer, or build a competing dataset from the service.</li>
        <li>Do not upload or submit content you do not have the right to use.</li>
        <li>Do not misuse public share pages, spam others, or attempt to bypass product safeguards.</li>
      </ul>
    ),
  },
  {
    id: 'ai-and-third-party-content',
    title: 'AI Output and Third-Party Content',
    body: (
      <>
        <p>
          Relevant uses AI to summarize, rank, explain, and answer follow-up questions about third-party content.
          Those outputs are generated automatically and may not always be accurate.
        </p>
        <p>
          Publishers, platforms, and source providers own their original content. If you click through to an article,
          YouTube video, Spotify episode, or another external destination, that provider\'s terms and policies apply.
        </p>
        <p>
          Relevant is not legal, investment, employment, medical, or tax advice. Verify important decisions independently.
        </p>
      </>
    ),
  },
  {
    id: 'your-content-and-shares',
    title: 'Your Content and Shared Links',
    body: (
      <>
        <p>
          You keep ownership of the notes, prompts, and other content you submit, but you give Relevant permission to host,
          process, and use that content to operate and improve the service for you.
        </p>
        <p>
          If you create a shared signal link, the shared version is public to anyone with the URL. Do not share a link if you do not want that public version to be seen.
        </p>
      </>
    ),
  },
  {
    id: 'purchases-and-store-terms',
    title: 'Purchases, Trials, and Store Terms',
    body: (
      <>
        <p>
          Some features may be paid now or in the future. If you purchase through the Apple App Store or Google Play,
          their billing, renewal, cancellation, and refund rules apply to that purchase.
        </p>
        <p>
          Relevant is responsible for the service itself, but Apple and Google are not parties to these terms and are not responsible for maintenance or support.
        </p>
        <p>
          Relevant does not store full payment card numbers when store or third-party billing providers handle the transaction.
        </p>
      </>
    ),
  },
  {
    id: 'deletion-and-termination',
    title: 'Account Deletion, Suspension, and Termination',
    body: (
      <>
        <p>
          You can delete your account in the app by going to Settings & safety → Delete account.
          Relevant currently supports both a scheduled deletion flow and a permanent deletion flow.
        </p>
        <p>
          We may suspend or terminate accounts that violate these terms, create security risk, abuse the product,
          or put the service or other users at risk.
        </p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    body: (
      <>
        <p>
          Relevant owns the software, interface, design, summaries, explanations, and branding that belong to the service.
          Third-party publishers and platforms own their own names, articles, media, and trademarks.
        </p>
        <p>
          These terms do not give you ownership of Relevant\'s software or brand.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimers-and-liability',
    title: 'Disclaimers and Limits of Liability',
    body: (
      <>
        <p>
          The service is provided on an "as is" and "as available" basis. We do not promise uninterrupted access or perfectly accurate output.
        </p>
        <p>
          To the maximum extent allowed by law, Relevant is not liable for indirect, incidental, special, consequential,
          or punitive damages arising from your use of the service or reliance on its content.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law-and-contact',
    title: 'Governing Law, Updates, and Contact',
    body: (
      <>
        <p>
          These terms are governed by the laws of Canada, without regard to conflict-of-law rules,
          except where local consumer law requires otherwise.
        </p>
        <p>
          We may update these terms as the product changes. If we make a material update, we will update the date on this page and,
          where appropriate, notify users in the app or on the website.
        </p>
        <p>
          Questions about these terms can be sent to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </>
    ),
  },
]

export default function TermsAndConditions() {
  return (
    <LegalDocument
      eyebrow="Terms"
      title="Terms of Service"
      intro="These terms govern how you use Relevant across the website, the mobile app, public share pages, and any future paid features."
      effectiveDate="March 14, 2026"
      secondaryHref="/privacy"
      secondaryLabel="Privacy"
      facts={facts}
      calloutTitle="Relevant helps, but your judgment still matters"
      calloutBody={
        <ul>
          <li>Relevant is informational and may be incomplete or wrong.</li>
          <li>Shared signal links are public to anyone who has the URL.</li>
          <li>Store billing, cancellations, and refunds follow the rules of the store you used.</li>
        </ul>
      }
      sections={sections}
    />
  )
}
