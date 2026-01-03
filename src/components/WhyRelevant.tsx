const benefits = [
  {
    title: 'No Noise',
    description: 'We filter out the fluff. Every item in your feed is there because it actually matters to your work and interests.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    ),
  },
  {
    title: 'No Doom Scrolling',
    description: 'Your feed has a natural end. Get informed in minutes, then get back to your day. No infinite loops.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: '"Why This Matters" Summaries',
    description: "Every story comes with a clear explanation of why it's relevant to you. No guesswork needed.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
]

export default function WhyRelevant() {
  return (
    <section id="why-relevant" className="section">
      <div className="container">
        {/* Section Header */}
        <h2 className="section-title">Why Relevant?</h2>
        <p className="text-center text-lg opacity-70 max-w-2xl mx-auto mb-12">
          We built Relevant because staying informed shouldn&apos;t feel like a chore—or an addiction.
        </p>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="text-center p-6"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 text-white rounded-full mb-5">
                {benefit.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-white/70">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Quote/Highlight Box */}
        <div className="mt-16 bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <p className="text-xl sm:text-2xl font-medium mb-4 text-white">
            &ldquo;Information is only useful if you can act on it. Everything else is noise.&rdquo;
          </p>
          <p className="text-white/50">
            — The philosophy behind Relevant
          </p>
        </div>
      </div>
    </section>
  )
}
