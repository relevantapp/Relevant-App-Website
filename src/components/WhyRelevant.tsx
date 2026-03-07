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
    <section id="why-relevant" className="section relative overflow-hidden py-24">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-20 animate-fade-in-up">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Information you can use.<br />
            <span className="text-white/40">Noise you can ignore.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/60">
            Staying informed shouldn&apos;t feel like a chore—or an addiction.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* Bento Item 1 - Large Span */}
          <div className="md:col-span-2 group relative overflow-hidden bg-[#121212] border border-white/10 rounded-[24px] p-8 md:p-12 transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-white mb-4">No Noise</h3>
                <p className="text-white/60 text-lg leading-relaxed max-w-md">
                  We filter out the fluff. Every item in your feed is there because it actually matters to your work and interests.
                </p>
              </div>
            </div>
          </div>

          {/* Bento Item 2 - Tall Block */}
          <div className="md:row-span-2 group relative overflow-hidden bg-[#121212] border border-white/10 rounded-[24px] p-8 transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mt-auto">
                <h3 className="font-display text-2xl font-bold text-white mb-4">No Doom Scrolling</h3>
                <p className="text-white/60 leading-relaxed">
                  Your feed has a natural end. Get informed in 5 minutes, then get back to your day. No infinite loops.
                </p>
              </div>
            </div>
          </div>

          {/* Bento Item 3 - Standard Block */}
          <div className="group relative overflow-hidden bg-[#121212] border border-white/10 rounded-[24px] p-8 transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-3">Context Built-in</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Every story explains why it&apos;s relevant to you. No guesswork needed.
              </p>
            </div>
          </div>

          {/* Bento Item 4 - Quote Block (Spans 1 col but fits beautifully with row-span-2) */}
          <div className="group relative overflow-hidden bg-[#0A0A0A] border border-white/5 rounded-[24px] p-8 flex items-center transition-all duration-500 hover:border-white/10 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="relative z-10 w-full">
              <p className="font-display text-xl font-medium leading-snug text-white mb-4">
                &ldquo;Information is only useful if you can act on it.&rdquo;
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-white/40">
                The Relevant Philosophy
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
