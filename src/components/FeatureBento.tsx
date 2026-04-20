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
          <span className="section-kicker">FROM SIGNAL TO NEXT MOVE</span>
          <h2>Relevant does more than brief you.</h2>
          <p>
            Ask follow-up questions, go deeper, track what matters, and keep the thread moving without opening ten more tabs.
          </p>
        </div>

        <div className="fbu-grid reveal-stagger">
          {/* Watch & Listen — focused crop showing the media section, 1 col */}
          <BentoCard
            kicker="WATCH & LISTEN"
            title="Go deeper when a signal deserves it."
            imgSrc="/screenshots/watch-listen.png?v=20260412e"
            imgAlt="Watch videos and listen to podcasts tied to this signal"
            imgWidth={1206}
            imgHeight={1200}
            imgClass="fbu-screenshot--media"
          />

          {/* Ask AI — 2 cols wide */}
          <BentoCard
            kicker="ASK AI"
            title="Pressure-test what the signal means."
            imgSrc="/screenshots/ask-ai.png?v=20260412e"
            imgAlt="Ask AI — deeper analysis, simpler explanations, tailored insights"
            imgWidth={1206}
            imgHeight={1300}
            cardClass="fbu-card--wide"
          />

          {/* Share */}
          <BentoCard
            kicker="SHARE"
            title="Turn a signal into a sharp point of view."
            imgSrc="/screenshots/share-curate.png?v=20260412e"
            imgAlt="Share — draft a cleaner post with AI, then share to your network"
            imgWidth={1206}
            imgHeight={1400}
          />

          {/* Find */}
          <BentoCard
            kicker="FIND"
            title="Track the companies, people, and themes that matter."
            imgSrc="/screenshots/search-explore-bento.png?v=20260412f"
            imgAlt="Search and explore — follow companies, people, and topics"
            imgWidth={1206}
            imgHeight={1400}
          />

          {/* Save */}
          <BentoCard
            kicker="SAVE"
            title="Keep the thread, not just the headline."
            imgSrc="/screenshots/notes-space.png?v=20260412e"
            imgAlt="Notes — save signals and capture quick thoughts"
            imgWidth={1206}
            imgHeight={1400}
          />

          {/* Tune — full width */}
          <BentoCard
            kicker="TUNE"
            title="Tell Relevant what should interrupt your day."
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
