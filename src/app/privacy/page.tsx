'use client'

import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Header */}
      <header className="py-6 px-4 border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
            Relevant
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Effective date: January 3, 2026</p>
        <p className="text-gray-400 mb-12">Contact: <a href="mailto:support@getrelevantapp.com" className="text-blue-400 hover:underline">support@getrelevantapp.com</a></p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p className="text-gray-300 leading-relaxed">
              Relevant provides a personalized feed of summarized news, trends, and insights sourced from licensed APIs and public feeds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              We collect account information, usage data, device information, and website cookies necessary to operate and improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Information We Do Not Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              We do not sell personal data, store payment card information, track users across apps for advertising, or collect precise location data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How We Use Information</h2>
            <p className="text-gray-300 leading-relaxed">
              Information is used to provide the service, personalize content, improve performance, maintain security, and provide support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. News Sources and Storage</h2>
            <p className="text-gray-300 leading-relaxed">
              We store headlines, metadata, and short summaries. Full articles are not stored unless explicitly licensed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. AI Usage</h2>
            <p className="text-gray-300 leading-relaxed">
              AI is used to summarize content, categorize topics, and generate relevance explanations. AI is not trained on identifiable personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
            <p className="text-gray-300 leading-relaxed">
              Cookies are used on our website for session functionality, analytics, and performance optimization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Sharing and Service Providers</h2>
            <p className="text-gray-300 leading-relaxed">
              Data is shared only with service providers for hosting, analytics, payments, and subscriptions under contractual safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              Personal data is retained only for as long as required for active accounts, legal compliance, and security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We use reasonable administrative, technical, and organizational safeguards to protect personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Privacy Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              Users have rights under GDPR, PIPEDA, US state laws, CCPA/CPRA, Quebec Law 25, and Mexico&apos;s LFPDPPP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Quebec Law 25</h2>
            <p className="text-gray-300 leading-relaxed">
              Quebec residents are provided clear notice and express consent where required, including cross-border processing disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. International Data Transfers</h2>
            <p className="text-gray-300 leading-relaxed">
              Data may be processed in Canada, the United States, or other jurisdictions with appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Children&apos;s Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Relevant is not intended for children under the age of 13 and does not knowingly collect their data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">15. Policy Updates</h2>
            <p className="text-gray-300 leading-relaxed">
              Material changes to this policy will be communicated through the app or website.
            </p>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-wrap gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          <a href="mailto:support@getrelevantapp.com" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </main>
  )
}
