import type { Metadata } from 'next'

import LegalDocument, { type LegalFact, type LegalSection } from '@/components/LegalDocument'
import { siteConfig } from '@/config/content'

export const metadata: Metadata = {
  title: 'Privacy Policy | Relevant',
  description: 'How Relevant collects, uses, retains, and deletes data across the website, iOS app, Android app, and public share pages.',
}

const SUPPORT_EMAIL = siteConfig.email

const facts: LegalFact[] = [
  {
    label: 'Delete account',
    value: 'In the app',
    detail: 'Open Settings & safety → Delete account. You can choose a 15-day scheduled delete or a permanent delete now.',
  },
  {
    label: 'Privacy contact',
    value: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>,
    detail: 'Use this email for access, correction, deletion help, or privacy questions.',
  },
  {
    label: 'Scope',
    value: 'Website, iOS, Android, and public share links',
    detail: 'Also covers website requests, contact messages, and public signal pages.',
  },
]

const sections: LegalSection[] = [
  {
    id: 'who-this-covers',
    title: 'Who This Policy Covers',
    body: (
      <>
        <p>
          Relevant is a work intelligence product. This policy applies to our website,
          the iOS app, the Android app, and public share pages hosted by Relevant.
        </p>
        <p>
          It explains what we collect, why we collect it, how we use AI and service
          providers, how account deletion works, and what choices you have.
        </p>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: 'Data We Collect',
    body: (
      <>
        <p>Depending on how you use Relevant, we may collect:</p>
        <ul>
          <li>
            <strong>Account and profile data:</strong> email address, authentication records,
            and the work context you give us, such as your company, industry, role, and country.
          </li>
          <li>
            <strong>Product data:</strong> signals you open, saved items, notes, feedback,
            follows, onboarding answers, settings, and notification preferences.
          </li>
          <li>
            <strong>Device and app data:</strong> push token, platform, timezone, app version,
            and basic product events like signal opens, source clicks, share actions, and app diagnostics.
          </li>
          <li>
            <strong>Optional voice input:</strong> if you use voice-to-text features, the audio you
            submit for transcription and the text result generated from it.
          </li>
          <li>
            <strong>Website form data:</strong> emails you submit, contact form details, and normal web request data needed to operate the site.
          </li>
          <li>
            <strong>Location context:</strong> your country if you enter it manually, or a best-guess
            country if you choose an onboarding shortcut that uses device location once to infer country.
            Relevant does not require continuous precise background location tracking.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-data',
    title: 'How We Use Data',
    body: (
      <ul>
        <li>Operate and secure your account.</li>
        <li>Personalize signals based on your work context.</li>
        <li>Send in-app, push, and email communications you request or allow.</li>
        <li>Power features like follow-up questions, notes, shared signals, and optional transcription.</li>
        <li>Improve relevance quality, reliability, abuse prevention, and support.</li>
        <li>Comply with legal obligations and enforce our terms.</li>
      </ul>
    ),
  },
  {
    id: 'ai-processing',
    title: 'AI Processing',
    body: (
      <>
        <p>
          Relevant uses AI to classify content, explain why a change matters, power follow-up questions,
          and transcribe optional voice input for notes.
        </p>
        <p>
          We send the minimum content needed for the feature to our model providers. If you use voice
          transcription, the audio you submit is sent for transcription so the app can return text.
          Please avoid putting highly sensitive personal information into notes, prompts, or voice recordings.
        </p>
      </>
    ),
  },
  {
    id: 'sharing-and-providers',
    title: 'When We Share Data',
    body: (
      <>
        <p>
          We do not sell personal data or use cross-app tracking for third-party advertising.
          We do share data with service providers that help us run the product.
        </p>
        <ul>
          <li>
            <strong>Infrastructure and account services:</strong> providers such as Supabase and Vercel
            to host the app, store account and product data, and run backend jobs.
          </li>
          <li>
            <strong>Email and communication:</strong> services such as Supabase Auth email delivery and Resend
            for verification emails, requested updates, and support workflows.
          </li>
          <li>
            <strong>Mobile delivery:</strong> Expo, Apple, and Google to deliver push notifications and app-store infrastructure.
          </li>
          <li>
            <strong>Diagnostics:</strong> crash and performance tools such as Sentry when enabled.
          </li>
          <li>
            <strong>AI providers:</strong> model providers used to generate relevance explanations and optional transcription.
          </li>
        </ul>
        <p>
          If you open a publisher article, YouTube video, Spotify episode, or another third-party link,
          that provider receives the usual request data directly from your device and their own policies apply.
        </p>
      </>
    ),
  },
  {
    id: 'notifications-and-sharing',
    title: 'Notifications, Emails, and Public Share Links',
    body: (
      <>
        <p>
          Relevant stores push tokens and notification preferences so we can send product alerts you have enabled.
          You can manage notifications from device settings and inside the app.
        </p>
        <p>
          If you ask for a brief or use the contact form on the website, we use the information you submit
          to respond.
        </p>
        <p>
          If you create or open a shared signal link, the shared payload on that public page may be viewable by
          anyone who has the URL. Do not share a signal link if you do not want that public version to be accessible.
        </p>
      </>
    ),
  },
  {
    id: 'retention-and-deletion',
    title: 'Retention and Account Deletion',
    body: (
      <>
        <p>
          We keep personal data for as long as your account is active and for as long as we reasonably need it to run,
          secure, and support the service.
        </p>
        <ul>
          <li>
            <strong>In-app deletion:</strong> open Settings & safety → Delete account.
          </li>
          <li>
            <strong>Scheduled deletion:</strong> you can choose a temporary delete with a 15-day recovery window.
            If you sign back in during that period, you can cancel the deletion.
          </li>
          <li>
            <strong>Permanent deletion:</strong> you can also choose the permanent path if you want the account closed immediately.
          </li>
          <li>
            <strong>Limited retention:</strong> we may keep minimal records where needed for legal compliance,
            fraud prevention, security, store obligations, or dispute handling.
          </li>
        </ul>
        <p>
          If you cannot access the app but want your data deleted, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Choices and Rights',
    body: (
      <>
        <p>Depending on where you live, you may have rights to access, correct, delete, or appeal decisions about your data.</p>
        <ul>
          <li>Edit core profile and notification settings inside the app.</li>
          <li>Delete your account inside the app or request help by email.</li>
          <li>Ask for a copy of the data we hold about you, subject to legal exceptions.</li>
          <li>Manage device permissions such as notifications or location through your device settings.</li>
          <li>Manage any future subscriptions through the store or payment method you used.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'international-transfers',
    title: 'International Transfers and Legal Bases',
    body: (
      <>
        <p>
          Relevant and its providers may process data in Canada, the United States, and other countries where our infrastructure or vendors operate.
        </p>
        <p>
          Where local law requires it, we rely on legal bases such as contract performance,
          legitimate interests, consent, and legal obligations.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children\'s Privacy',
    body: (
      <p>
        Relevant is built for work use and is not directed to children. We do not knowingly collect personal data from children.
        If you believe a child has provided personal data to us, contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    ),
  },
  {
    id: 'changes-and-contact',
    title: 'Changes and Contact',
    body: (
      <>
        <p>
          We may update this policy as the product changes. If we make a material change, we will update the date on this page and,
          where appropriate, notify users in the app or on the website.
        </p>
        <p>
          For privacy questions, requests, or complaints, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </>
    ),
  },
]

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This policy explains what Relevant collects, how it uses that data, how account deletion works, and how we handle website forms, notifications, AI features, and public share links."
      effectiveDate="March 14, 2026"
      secondaryHref="/terms"
      secondaryLabel="Terms"
      facts={facts}
      calloutTitle="Delete, request, and share with care"
      calloutBody={
        <ul>
          <li>You can delete your account from inside the app.</li>
          <li>Shared signal links are public to anyone who has the URL.</li>
          <li>We do not sell personal data or use third-party ad tracking across apps.</li>
        </ul>
      }
      sections={sections}
    />
  )
}
