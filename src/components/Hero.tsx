import EmailForm from './EmailForm'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-3xl mx-auto text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <Image 
            src="/logo.svg" 
            alt="Relevant Logo" 
            width={80} 
            height={80}
            className="rounded-2xl"
            priority
          />
        </div>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in-up" style={{ background: 'rgba(47, 107, 255, 0.12)', color: 'var(--accent)' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }}></span>
          </span>
          Coming Soon
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up animation-delay-200" style={{ color: 'var(--text-strong)', fontFamily: 'var(--font-display), sans-serif' }}>
          Stay Informed
          <br />
          <span style={{ color: 'var(--accent)' }}>Without the Noise</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-400" style={{ color: 'var(--text-muted)' }}>
          Relevant gives you a personalized feed that cuts through the clutter. 
          No doom scrolling, no algorithm tricks—just what matters to you, 
          with clear summaries of why it&apos;s important.
        </p>

        {/* Email Form */}
        <div className="flex justify-center animate-fade-in-up animation-delay-400">
          <EmailForm />
        </div>

        {/* Trust Text */}
        <p className="mt-6 text-sm animate-fade-in-up animation-delay-400" style={{ color: 'var(--text-soft)' }}>
          Join the waitlist. Be the first to know when we launch.
        </p>
      </div>
    </section>
  )
}
