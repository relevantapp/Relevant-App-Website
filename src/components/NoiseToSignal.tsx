'use client'

import Image from 'next/image'

const PUBLICATION_STREAM = [
  { name: 'Reuters', domain: 'reuters.com', headline: 'Rate cuts may take longer than markets hoped.' },
  { name: 'Bloomberg', domain: 'bloomberg.com', headline: 'Companies keep pushing harder on AI rollout plans.' },
  { name: 'Financial Times', domain: 'ft.com', headline: 'Enterprise software buyers slow spending on new tools.' },
  { name: 'The Wall Street Journal', domain: 'wsj.com', headline: 'Hiring plans tighten as leadership teams cut budgets.' },
  { name: 'CNBC', domain: 'cnbc.com', headline: 'Cloud providers race to lower prices for business customers.' },
  { name: 'BBC', domain: 'bbc.com', headline: 'Governments debate new rules for consumer AI products.' },
  { name: 'The Verge', domain: 'theverge.com', headline: 'Another wave of AI features lands across work apps.' },
  { name: 'AP', domain: 'apnews.com', headline: 'A major policy move could change cross-border trade costs.' },
]

function getPublicationIconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

export default function NoiseToSignal() {
  return (
    <div className="signal-flow" aria-hidden="true">
      {/* Step 1 — Onboarding */}
      <article className="signal-flow-panel signal-flow-panel--step">
        <div className="signal-flow-step-head">
          <span className="signal-flow-step-number">1</span>
          <div>
            <h3 className="signal-flow-step-title">Tell us about your work.</h3>
          </div>
        </div>

        <p className="signal-flow-step-copy">
          Industry. Role. Company. Country. That&apos;s it.
        </p>

        <div className="signal-flow-shot-shell">
          <div className="signal-flow-shot-frame">
            <Image
              src="/screenshots/onboarding-intro.png?v=20260412e"
              alt="Relevant app onboarding — set your industry, role, company, and country"
              width={500}
              height={888}
              className="signal-flow-shot-image"
              priority
              unoptimized
            />
          </div>
        </div>
      </article>

      {/* Step 2 — News stream */}
      <article className="signal-flow-panel signal-flow-panel--step">
        <div className="signal-flow-step-head">
          <span className="signal-flow-step-number">2</span>
          <div>
            <h3 className="signal-flow-step-title">We filter thousands of articles.</h3>
          </div>
        </div>

        <p className="signal-flow-step-copy">
          One question: could this change a decision you&apos;re about to make?
        </p>

        <div className="signal-flow-stream-window">
          <div className="signal-flow-stream-track">
            {[0, 1].map((loop) => (
              <div className="signal-flow-stream-group" key={loop}>
                {PUBLICATION_STREAM.map((story) => (
                  <div className="signal-flow-stream-item" key={`${loop}-${story.name}-${story.headline}`}>
                    <div className="signal-flow-stream-source">
                      <span className="signal-flow-stream-icon-wrap">
                        <Image
                          src={getPublicationIconUrl(story.domain)}
                          alt=""
                          width={18}
                          height={18}
                          className="signal-flow-stream-icon"
                          unoptimized
                        />
                      </span>
                      <span className="signal-flow-stream-name">{story.name}</span>
                    </div>
                    <p className="signal-flow-stream-headline">{story.headline}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Step 3 — Time saved */}
      <article className="signal-flow-panel signal-flow-panel--step">
        <div className="signal-flow-step-head">
          <span className="signal-flow-step-number">3</span>
          <div>
            <h3 className="signal-flow-step-title">You get hours back. Every week.</h3>
          </div>
        </div>

        <p className="signal-flow-step-copy">
          We track how much reading time you skip — so you can see the value.
        </p>

        <div className="signal-flow-shot-shell">
          <div className="signal-flow-shot-frame">
            <Image
              src="/screenshots/hours-saved.png?v=20260412e"
              alt="Your Relevance Summary — 13.4 hours saved in the last 7 days"
              width={500}
              height={888}
              className="signal-flow-shot-image"
              priority
              unoptimized
            />
          </div>
        </div>
      </article>

      {/* Step 4 — Search & explore */}
      <article className="signal-flow-panel signal-flow-panel--step">
        <div className="signal-flow-step-head">
          <span className="signal-flow-step-number">4</span>
          <div>
            <h3 className="signal-flow-step-title">Search. Follow. Explore.</h3>
          </div>
        </div>

        <p className="signal-flow-step-copy">
          Everything we&apos;ve shown you, searchable. Your signals, your map.
        </p>

        <div className="signal-flow-shot-shell">
          <div className="signal-flow-shot-frame">
            <Image
              src="/screenshots/search-explore.png?v=20260412f"
              alt="Search and explore your signal map — topic cards, search bar, follow new topics"
              width={500}
              height={888}
              className="signal-flow-shot-image"
              priority
              unoptimized
            />
          </div>
        </div>
      </article>
    </div>
  )
}
