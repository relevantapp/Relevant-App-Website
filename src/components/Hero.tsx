import EmailForm from './EmailForm'

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-3xl mx-auto text-center">
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Coming Soon
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up animation-delay-200">
          Stay Informed
          <br />
          <span className="text-blue-600">Without the Noise</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
          Relevant gives you a personalized feed that cuts through the clutter. 
          No doom scrolling, no algorithm tricks—just what matters to you, 
          with clear summaries of why it&apos;s important.
        </p>

        {/* Email Form */}
        <div className="flex justify-center animate-fade-in-up animation-delay-400">
          <EmailForm />
        </div>

        {/* Trust Text */}
        <p className="mt-6 text-sm text-gray-500 animate-fade-in-up animation-delay-400">
          Join the waitlist. Be the first to know when we launch.
        </p>
      </div>
    </section>
  )
}
