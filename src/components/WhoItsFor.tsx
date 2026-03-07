'use client'

const personas = [
  {
    role: 'THE STUDENT',
    problem: 'I want to sound informed in interviews and class discussions without spending hours on news.',
    fix: 'Relevant gives you 3–5 signals daily that make you the most prepared person in the room.',
  },
  {
    role: 'THE FOUNDER',
    problem: "I can't afford to miss a market shift, but I don't have time to read 40 newsletters.",
    fix: 'Relevant watches your market, your competitors, and the regulatory landscape while you build.',
  },
  {
    role: 'THE EXECUTIVE',
    problem: 'I need consequence-mapped intelligence, not headline summaries.',
    fix: 'Relevant tells you what happened, traces the impact to your business, and shows what to watch.',
  },
  {
    role: 'THE ANALYST',
    problem: 'I spend hours building briefings that are outdated by the time I send them.',
    fix: 'Relevant builds multi-source, consequence-mapped briefings continuously — faster and sharper than manual research.',
  },
  {
    role: 'THE OPERATOR',
    problem: 'I need to know when a supply chain disruption, policy shift, or competitive move affects my operation.',
    fix: 'Relevant maps consequences to your specific operation, not your industry in general.',
  },
  {
    role: 'THE CURIOUS',
    problem: "I just want to be well-informed without feeling overwhelmed.",
    fix: 'Relevant reads the internet for you and shows you only what matters. Five minutes. Done.',
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
        <div className="persona-grid reveal-on-scroll">
          {personas.map((p) => (
            <div key={p.role} className="persona-card">
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
