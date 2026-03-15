import Image from 'next/image'

type FeatureCardProps = {
  kicker: string
  title: string
  description: string
  children: React.ReactNode
  className?: string
}

function FeatureCard({ kicker, title, description, children, className }: FeatureCardProps) {
  return (
    <article className={`feature-spotlight-card reveal-on-scroll${className ? ` ${className}` : ''}`}>
      <div className="feature-spotlight-visual">{children}</div>
      <div className="feature-spotlight-copy">
        <span className="feature-spotlight-kicker">{kicker}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  )
}

export default function FeatureBento() {
  return (
    <section id="features" className="section-block">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">INSIDE THE APP</span>
          <h2>The signal is just the start.</h2>
          <p>
            Once something important shows up, you can ask a follow-up question, save a note,
            track companies or industries, or open a deeper explainer without leaving the app.
          </p>
        </div>

        {/* Row 1: two compact non-screenshot cards */}
        <div className="feature-spotlight-row-half">
          <FeatureCard
            kicker="ASK A QUESTION"
            title="Ask what it means for you."
            description="Open any signal and ask how it affects your job, plans, or next move."
          >
            <div className="feature-visual-chat">
              <div className="feature-visual-chat-bubble feature-visual-chat-bubble--user">
                How does this affect my team?
              </div>
              <div className="feature-visual-chat-bubble feature-visual-chat-bubble--ai">
                Hiring may stay slower for another quarter, so it&apos;s safer to plan around current headcount.
              </div>
              <div className="feature-visual-chat-input">Ask a follow-up about this signal…</div>
            </div>
          </FeatureCard>

          <FeatureCard
            kicker="GO DEEPER"
            title="Open a podcast or video when you want more."
            description="Some signals come with a useful episode or video, so you can keep learning without searching around."
          >
            <div className="feature-visual-media">
              <div className="feature-visual-media-row">
                <span className="feature-visual-media-icon feature-visual-media-icon--spotify">S</span>
                <div>
                  <strong>Spotify match</strong>
                  <p>15-minute explainer for your commute</p>
                </div>
              </div>
              <div className="feature-visual-media-row">
                <span className="feature-visual-media-icon feature-visual-media-icon--youtube">Y</span>
                <div>
                  <strong>YouTube match</strong>
                  <p>Short breakdown if you want more context</p>
                </div>
              </div>
            </div>
          </FeatureCard>
        </div>

        {/* Row 2: three screenshot cards — equal height */}
        <div className="feature-spotlight-row-screenshots">
          <FeatureCard
            kicker="YOUR THINKING SPACE"
            title="Save signals and capture thoughts."
            description="Save a signal, record a voice note, or write freely. Notes is your private thinking space inside Relevant."
            className="feature-spotlight-card--screenshot"
          >
            <div className="feature-visual-screenshot">
              <div className="feature-visual-screenshot-wrap">
                <Image
                  src="/screenshots/notes-space.png"
                  alt="Notes tab — save signals and capture quick thoughts"
                  width={375}
                  height={812}
                  className="feature-visual-screenshot-img"
                  unoptimized
                />
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            kicker="FOLLOW TOPICS"
            title="Search and explore your signal map."
            description="Search across your delivered signals, follow new companies or topics, and explore a visual topic map of everything Relevant tracks for you."
            className="feature-spotlight-card--screenshot"
          >
            <div className="feature-visual-screenshot">
              <div className="feature-visual-screenshot-wrap">
                <Image
                  src="/screenshots/search-topics.png"
                  alt="Search and topic map — follow companies, people, and topics"
                  width={375}
                  height={812}
                  className="feature-visual-screenshot-img"
                  unoptimized
                />
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            kicker="TUNE YOUR FEED"
            title="Control what shows up."
            description="Adjust signal strictness, see what topics and companies drive your signals, and fine-tune anytime."
            className="feature-spotlight-card--screenshot"
          >
            <div className="feature-visual-screenshot">
              <div className="feature-visual-screenshot-wrap">
                <Image
                  src="/screenshots/tune-feed.png"
                  alt="Tune your feed — adjust signal strictness and see what drives your signals"
                  width={375}
                  height={812}
                  className="feature-visual-screenshot-img"
                  unoptimized
                />
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}
