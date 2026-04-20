import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Newspaper,
  Search,
  ShieldAlert,
  Sparkles,
  Swords,
} from 'lucide-react'

const WORKFLOWS = [
  {
    title: 'Meeting Prep',
    lede: 'Walk in already knowing what matters.',
    example: 'Anthropic · partnership intro',
    meta: '~1m 45s · 8-12 sources',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Competitive Intel',
    lede: "Where they win. Where they're exposed.",
    example: 'Cursor vs Copilot · positioning',
    meta: '~2m 10s · 12-18 sources',
    icon: Swords,
  },
  {
    title: 'Business Case',
    lede: 'Proof points. Objections. What has to be true.',
    example: 'Launch weekend delivery · East Coast',
    meta: '~2m 30s · 14-20 sources',
    icon: BarChart3,
  },
  {
    title: 'Market Research',
    lede: 'Landscape, demand signals, and motion.',
    example: 'Agent payments · infra category',
    meta: '~2m 15s · 15-22 sources',
    icon: Search,
  },
]

const RESULT_CARDS = [
  {
    title: 'Bottom line',
    copy: 'Anthropic is building a tighter enterprise motion, and a partner conversation now is early enough to matter.',
    icon: Sparkles,
  },
  {
    title: 'What just happened',
    copy: 'Hiring, partnerships, and enterprise packaging all moved in the last 90 days.',
    icon: Newspaper,
  },
  {
    title: 'Landmines',
    copy: 'Expect questions about data quality, enterprise trust, and whether your wedge is durable.',
    icon: ShieldAlert,
  },
]

export default function IntelligenceSpotlight() {
  return (
    <section id="intelligence" className="section-block">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">INTELLIGENCE</span>
          <h2>Decision-grade research for the work in front of you.</h2>
          <p>
            Relevant does not stop at feed alerts. It turns a real question into a structured brief with sourced context,
            competitive signal, and clear next moves.
          </p>
        </div>

        <div className="intelligence-showcase reveal-stagger">
          <div className="intelligence-workflows reveal-on-scroll">
            <div className="intelligence-showcase-head">
              <span className="intelligence-showcase-label">Workflow picker</span>
              <span className="intelligence-showcase-meta">Four workflows. One system.</span>
            </div>

            <div className="intelligence-workflow-grid">
              {WORKFLOWS.map((workflow) => {
                const Icon = workflow.icon
                return (
                  <article key={workflow.title} className="intelligence-workflow-card">
                    <div className="intelligence-workflow-top">
                      <div className="intelligence-workflow-icon">
                        <Icon size={18} />
                      </div>
                      <ArrowRight size={16} />
                    </div>
                    <div>
                      <h3 className="intelligence-workflow-title">{workflow.title}</h3>
                      <p className="intelligence-workflow-copy">{workflow.lede}</p>
                    </div>
                    <div className="intelligence-workflow-footer">
                      <div>
                        <span className="intelligence-workflow-note">Example</span>
                        <span className="intelligence-workflow-example">{workflow.example}</span>
                      </div>
                      <span className="intelligence-workflow-timing">{workflow.meta}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <div className="intelligence-preview reveal-on-scroll">
            <div className="intelligence-showcase-head">
              <span className="intelligence-showcase-label">Result dashboard</span>
              <span className="intelligence-showcase-meta">Meeting prep · grounded in 11 sources</span>
            </div>

            <div className="intelligence-preview-hero">
              <span className="intelligence-preview-eyebrow">Anthropic · partner conversation</span>
              <h3 className="intelligence-preview-title">
                Structured intelligence with a bottom line, landmines, and the next questions to ask.
              </h3>
            </div>

            <div className="intelligence-preview-stats">
              <div>
                <span className="intelligence-preview-stat-label">Run time</span>
                <span className="intelligence-preview-stat-value">1m 47s</span>
              </div>
              <div>
                <span className="intelligence-preview-stat-label">Signals filtered</span>
                <span className="intelligence-preview-stat-value">94%</span>
              </div>
              <div>
                <span className="intelligence-preview-stat-label">Sources</span>
                <span className="intelligence-preview-stat-value">11</span>
              </div>
            </div>

            <div className="intelligence-preview-grid">
              {RESULT_CARDS.map((card) => {
                const Icon = card.icon
                return (
                  <article key={card.title} className="intelligence-preview-card">
                    <div className="intelligence-preview-card-head">
                      <Icon size={14} />
                      <span>{card.title}</span>
                    </div>
                    <p>{card.copy}</p>
                  </article>
                )
              })}
            </div>

            <div className="intelligence-preview-footer">
              <span className="intelligence-preview-source">Reuters</span>
              <span className="intelligence-preview-source">FT</span>
              <span className="intelligence-preview-source">Anthropic</span>
              <span className="intelligence-preview-source">Stratechery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
