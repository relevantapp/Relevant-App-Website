import EmailForm from './EmailForm'
import ThemeLogo from './ThemeLogo'

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-3xl mx-auto text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <span className="inline-flex rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
            <ThemeLogo alt="Relevant Logo" width={76} height={76} className="rounded-xl" priority />
          </span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in-up" style={{ background: 'rgba(47, 107, 255, 0.12)', color: 'var(--accent)' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }}></span>
          </span>
          Now Live
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up animation-delay-200" style={{ color: 'var(--text-strong)', fontFamily: 'var(--font-display), sans-serif' }}>
          Stay Informed
          <br />
          <span style={{ color: 'var(--accent)' }}>Without the Noise</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-400" style={{ color: 'var(--text-muted)' }}>
          Relevant turns market noise into a few role-aware signals, with the event, the impact, and the next move made clear.
        </p>

        {/* Email Form */}
        <div className="flex justify-center animate-fade-in-up animation-delay-400">
          <EmailForm />
        </div>

        {/* Trust Text */}
        <p className="mt-6 text-sm animate-fade-in-up animation-delay-400" style={{ color: 'var(--text-soft)' }}>
          The app is live. Get Relevant from the App Store.
        </p>
      </div>
    </section>
  )
}
