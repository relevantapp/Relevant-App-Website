'use client'

import Link from 'next/link'

export default function TermsAndConditions() {
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
        <h1 className="text-4xl font-bold text-white mb-2">Terms & Conditions</h1>
        <p className="text-gray-400 mb-8">Effective date: January 3, 2026</p>
        <p className="text-gray-400 mb-12">Contact: <a href="mailto:support@getrelevantapp.com" className="text-blue-400 hover:underline">support@getrelevantapp.com</a></p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Service Description</h2>
            <p className="text-gray-300 leading-relaxed">
              Relevant provides summarized news, trends, and informational content sourced from third-party providers. We do not create original journalism.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Eligibility</h2>
            <p className="text-gray-300 leading-relaxed">
              You must be at least 13 years old and use the service for personal, non-commercial purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Accounts and Access</h2>
            <p className="text-gray-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. We may suspend access if misuse is detected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscriptions and Billing</h2>
            <p className="text-gray-300 leading-relaxed">
              Paid features are billed through third-party platforms such as Apple, Google, or Stripe. We do not store payment card details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Content Ownership</h2>
            <p className="text-gray-300 leading-relaxed">
              All third-party news content belongs to its original publishers. Relevant owns its summaries, explanations, and app interface.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Acceptable Use</h2>
            <p className="text-gray-300 leading-relaxed">
              You may not copy, redistribute, scrape, resell, or reverse-engineer the service or its content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Accuracy Disclaimer</h2>
            <p className="text-gray-300 leading-relaxed">
              Content is provided for informational purposes only and may contain errors or omissions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Bias Labels</h2>
            <p className="text-gray-300 leading-relaxed">
              Any political or ideological labels are algorithmic and opinion-based, not statements of fact.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Third-Party Links</h2>
            <p className="text-gray-300 leading-relaxed">
              We are not responsible for external websites or third-party content linked through the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Availability</h2>
            <p className="text-gray-300 leading-relaxed">
              We may modify or discontinue features at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We may suspend or terminate accounts that violate these terms or applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              The service is provided &quot;as is.&quot; Relevant is not liable for indirect damages or decisions made based on content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These terms are governed by the laws of Canada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these Terms, contact <a href="mailto:support@getrelevantapp.com" className="text-blue-400 hover:underline">support@getrelevantapp.com</a>.
            </p>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-wrap gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <a href="mailto:support@getrelevantapp.com" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </main>
  )
}
