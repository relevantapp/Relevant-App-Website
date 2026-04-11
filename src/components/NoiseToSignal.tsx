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
            <span className="signal-flow-panel-kicker">Tell us about you</span>
            <h3 className="signal-flow-step-title">Tell us your company, industry, and role.</h3>
          </div>
        </div>

        <p className="signal-flow-step-copy">
          Those three answers are enough for Relevant to understand what could affect you at work.
        </p>

        <div className="signal-flow-shot-shell">
          <span className="signal-flow-shot-kicker">Actual onboarding screen</span>
          <div className="signal-flow-shot-frame">
            <Image
              src="/screenshots/onboarding-form.png"
              alt="Relevant app onboarding — set your industry, role, company, and country"
              width={500}
              height={888}
              className="signal-flow-shot-image"
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
            <span className="signal-flow-panel-kicker">We filter the noise</span>
            <h3 className="signal-flow-step-title">AI reads the news and keeps what affects your work.</h3>
          </div>
        </div>

        <p className="signal-flow-step-copy">
          Relevant reads thousands of articles every day, figures out what could influence your work,
          and drops the rest.
        </p>

        <div className="signal-flow-stream-meta">
          <span className="signal-flow-stream-stat">Thousands of articles scanned every day</span>
          <p className="signal-flow-stream-copy">
            From publishers like Reuters, Bloomberg, the Financial Times, the Wall Street Journal,
            CNBC, BBC, and more.
          </p>
        </div>

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

        <p className="signal-flow-filter-note">
          It looks for changes that could help you, hurt you, or change the decisions you need to make.
        </p>
      </article>

      {/* Step 3 — Time saved */}
      <article className="signal-flow-panel signal-flow-panel--step">
        <div className="signal-flow-step-head">
          <span className="signal-flow-step-number">3</span>
          <div>
            <span className="signal-flow-panel-kicker">See the time you save</span>
            <h3 className="signal-flow-step-title">Hours back in your week, automatically.</h3>
          </div>
        </div>

        <p className="signal-flow-step-copy">
          Relevant tracks how much reading time it saves you. No more scanning dozens of sources — just the signals that matter.
        </p>

        <div className="signal-flow-shot-shell">
          <span className="signal-flow-shot-kicker">Your weekly time saved</span>
          <div className="signal-flow-shot-frame">
            <Image
              src="/screenshots/time-saved.png"
              alt="Time Saved — 11 hours back in your week, 30 stories processed"
              width={500}
              height={888}
              className="signal-flow-shot-image"
              unoptimized
            />
          </div>
          <p className="signal-flow-shot-note">
            11 hours saved. 30 stories delivered. All the signal, none of the noise.
          </p>
        </div>
      </article>

      {/* Step 4 — Search & explore */}
      <article className="signal-flow-panel signal-flow-panel--step">
        <div className="signal-flow-step-head">
          <span className="signal-flow-step-number">4</span>
          <div>
            <span className="signal-flow-panel-kicker">Search and explore</span>
            <h3 className="signal-flow-step-title">Explore your signal map anytime.</h3>
          </div>
        </div>

        <p className="signal-flow-step-copy">
          Search across every story Relevant has delivered. Browse your topic map, follow new companies, and dig deeper when you need to.
        </p>

        <div className="signal-flow-shot-shell">
          <span className="signal-flow-shot-kicker">Your signal map</span>
          <div className="signal-flow-shot-frame">
            <Image
              src="/screenshots/search-explore.png"
              alt="Search and explore your signal map — topic cards, search bar, follow new topics"
              width={500}
              height={888}
              className="signal-flow-shot-image"
              unoptimized
            />
          </div>

          <p className="signal-flow-shot-note">
            Every topic, every story, searchable and organized — your personal signal map.
          </p>
        </div>
      </article>
    </div>
  )
}
