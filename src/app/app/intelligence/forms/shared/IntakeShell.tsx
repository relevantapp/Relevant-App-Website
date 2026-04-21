'use client'

import type { ReactNode } from 'react'
import { Kicker } from '../../ui/primitives'

interface DocketItem {
  label: string
  value: string
}

interface IntakeShellProps {
  workflow: string
  title: string
  lede: string
  docket: DocketItem[]
  output: string[]
  estimate: string
  children: ReactNode
  footer: ReactNode
}

export default function IntakeShell({
  workflow,
  title,
  lede,
  docket,
  output,
  estimate,
  children,
  footer,
}: IntakeShellProps) {
  return (
    <div className="intel-intake-layout intel-rise">
      <aside className="intel-docket-rail">
        <Kicker color="var(--amber)">{workflow}</Kicker>
        <h1 className="intel-display intel-intake-title">{title}</h1>
        <p className="intel-intake-lede">{lede}</p>

        <div className="intel-docket-block">
          <Kicker>Active docket</Kicker>
          <div className="intel-docket-table">
            {docket.map((item) => (
              <div key={item.label} className="intel-docket-row">
                <span className="mono">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="intel-docket-block">
          <Kicker>Brief should return</Kicker>
          <ol className="intel-output-list">
            {output.map((item, index) => (
              <li key={item}>
                <span className="mono">{String(index + 1).padStart(2, '0')}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <section className="intel-intake-sheet">
        <div className="intel-sheet-header">
          <Kicker>Input sheet</Kicker>
          <span className="mono">{estimate}</span>
        </div>
        <div className="intel-sheet-body">{children}</div>
        <div className="intel-sheet-footer">{footer}</div>
      </section>
    </div>
  )
}
