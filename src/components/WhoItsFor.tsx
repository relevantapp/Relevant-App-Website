'use client'

const personas = [
  {
    role: 'THE STUDENT',
    problem: "I have three exams and a part-time job. I can't spend an hour on news every morning. But I want to walk into class and actually know what's going on.",
    fix: "Relevant gives you the 5 things that matter this week — explained in plain language, connected to what you're studying.",
  },
  {
    role: 'THE FOUNDER',
    problem: "Last quarter I missed a competitor's pivot because it was buried in my Twitter feed. By the time I found out, they'd already signed two of my target accounts.",
    fix: 'Relevant watches your competitors, your market, and the regulatory landscape — and tells you the moment something shifts.',
  },
  {
    role: 'THE EXECUTIVE',
    problem: "My team expects me to know what's happening in our industry. I can't admit I haven't properly read the news in two weeks.",
    fix: "Relevant gives you consequence-mapped intelligence every morning. You'll know what happened, what it means for your business, and what to say about it.",
  },
  {
    role: 'THE ANALYST',
    problem: "I track 12 sectors. Without serious filtering, I'd need 4 hours a day just on news. And half of what I find is duplicate coverage of the same story.",
    fix: 'Relevant merges sources, deduplicates, and ranks by relevance to your specific coverage areas. One signal per story, not twelve articles.',
  },
  {
    role: 'THE OPERATOR',
    problem: 'A policy change hit my supply chain before I even heard about it. By the time the news reached me, we\'d already lost a week of lead time.',
    fix: 'Relevant maps regulatory and market changes directly to your operations — so you hear about it before it hits you.',
  },
  {
    role: 'THE CURIOUS',
    problem: "I want to understand the world better, but every morning I open three apps, get overwhelmed, and close them all. I end up knowing nothing.",
    fix: 'Relevant reads the internet for you and shows you only what\'s worth knowing. Start your day with clarity, not chaos.',
  },
]

export default function WhoItsFor() {
  return (
    <section id="who" className="section-block">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">WHO IT&rsquo;S FOR</span>
          <h2>If information affects your decisions, this is for you.</h2>
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
