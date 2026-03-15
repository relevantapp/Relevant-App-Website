'use client'

const personas = [
  {
    role: 'PRODUCT MANAGERS',
    problem: "I have three feature launches and a roadmap to manage. I can't spend an hour on news every morning. But I want to walk into standup and actually know what's going on.",
    fix: "Relevant gives you the 5 things that matter this week — explained in plain language, connected to your product strategy.",
  },
  {
    role: 'FOUNDERS',
    problem: "Last quarter I missed a competitor's pivot because it was buried in my Twitter feed. By the time I found out, they'd already signed two of my target accounts.",
    fix: 'Relevant watches your competitors, your market, and the regulatory landscape — and tells you the moment something shifts.',
  },
  {
    role: 'ACCOUNT MANAGERS',
    problem: "My clients expect me to know what's happening in our industry. I can't admit I haven't properly read the news in two weeks.",
    fix: "Relevant gives you consequence-mapped intelligence every morning. You'll know what happened, what it means for your business, and what to say about it.",
  },
  {
    role: 'ANALYSTS',
    problem: "I track 12 sectors. Without serious filtering, I'd need 4 hours a day just on news. And half of what I find is duplicate coverage of the same story.",
    fix: 'Relevant merges sources, deduplicates, and ranks by relevance to your specific coverage areas. One signal per story, not twelve articles.',
  },
  {
    role: 'OPERATORS',
    problem: 'A policy change hit my supply chain before I even heard about it. By the time the news reached me, we\'d already lost a week of lead time.',
    fix: 'Relevant maps regulatory and market changes directly to your operations — so you hear about it before it hits you.',
  },
  {
    role: 'THE PREPARED',
    problem: "I want to understand the world better, but every morning I open three apps, get overwhelmed, and close them all. I end up feeling one step behind.",
    fix: 'If you like being the prepared person in the room, you\'ll like Relevant. Start your day with clarity, not chaos.',
  },
]

export default function WhoItsFor() {
  return (
    <section id="who" className="section-block">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">WHO IT IS FOR</span>
          <h2>For people who want an edge at work.</h2>
          <p>Anyone tired of feeling one step behind.</p>
        </div>
        <div className="persona-grid reveal-stagger">
          {personas.map((p) => (
            <div key={p.role} className="persona-card reveal-on-scroll">
              <span className="persona-role">{p.role}</span>
              <p className="persona-problem">&ldquo;{p.problem}&rdquo;</p>
              <p className="persona-fix">{p.fix}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
