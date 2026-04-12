import Image from 'next/image'

type BentoCardProps = {
  kicker: string
  title: string
  imgSrc: string
  imgAlt: string
  imgWidth: number
  imgHeight: number
  imgClass?: string
  cardClass?: string
}

function BentoCard({
  kicker,
  title,
  imgSrc,
  imgAlt,
  imgWidth,
  imgHeight,
  imgClass,
  cardClass,
}: BentoCardProps) {
  return (
    <article className={`fbu-card reveal-on-scroll${cardClass ? ` ${cardClass}` : ''}`}>
      <div className="fbu-img">
        <Image
          src={imgSrc}
          alt={imgAlt}
          width={imgWidth}
          height={imgHeight}
          className={`fbu-screenshot${imgClass ? ` ${imgClass}` : ''}`}
          priority
          unoptimized
        />
      </div>
      <div className="fbu-text">
        <span className="fbu-kicker">{kicker}</span>
        <h3>{title}</h3>
      </div>
    </article>
  )
}

export default function FeatureBento() {
  return (
    <section id="features" className="section-block">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">USE IT FOR MORE</span>
          <h2>The signal is just the start.</h2>
          <p>
            Ask questions. Watch and listen. Share what matters. Capture thoughts. All without leaving.
          </p>
        </div>

        <div className="fbu-grid reveal-stagger">
          {/* Watch & Listen — focused crop showing the media section, 1 col */}
          <BentoCard
            kicker="WATCH & LISTEN"
            title="Go deeper without leaving."
            imgSrc="/screenshots/watch-listen.png?v=20260412e"
            imgAlt="Watch videos and listen to podcasts tied to this signal"
            imgWidth={1206}
            imgHeight={1200}
            imgClass="fbu-screenshot--media"
          />

          {/* Ask AI — 2 cols wide */}
          <BentoCard
            kicker="ASK AI"
            title="Ask anything about a signal."
            imgSrc="/screenshots/ask-ai.png?v=20260412e"
            imgAlt="Ask AI — deeper analysis, simpler explanations, tailored insights"
            imgWidth={1206}
            imgHeight={1300}
            cardClass="fbu-card--wide"
          />

          {/* Share */}
          <BentoCard
            kicker="SHARE"
            title="Become a voice."
            imgSrc="/screenshots/share-curate.png?v=20260412e"
            imgAlt="Share — draft a cleaner post with AI, then share to your network"
            imgWidth={1206}
            imgHeight={1400}
          />

          {/* Find */}
          <BentoCard
            kicker="FIND"
            title="Follow anything."
            imgSrc="/screenshots/search-explore-bento.png?v=20260412f"
            imgAlt="Search and explore — follow companies, people, and topics"
            imgWidth={1206}
            imgHeight={1400}
          />

          {/* Save */}
          <BentoCard
            kicker="SAVE"
            title="Capture the thought."
            imgSrc="/screenshots/notes-space.png?v=20260412e"
            imgAlt="Notes — save signals and capture quick thoughts"
            imgWidth={1206}
            imgHeight={1400}
          />

          {/* Tune — full width */}
          <BentoCard
            kicker="TUNE"
            title="More signal. Less noise. Your call."
            imgSrc="/screenshots/tune-settings.png?v=20260412f"
            imgAlt="Make Relevant yours — choose what it follows and how it writes"
            imgWidth={1206}
            imgHeight={900}
            cardClass="fbu-card--full"
          />
        </div>
      </div>
    </section>
  )
}

