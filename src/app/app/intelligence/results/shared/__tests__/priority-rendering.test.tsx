// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { TrendingUp } from 'lucide-react'
import { afterEach, describe, expect, it } from 'vitest'
import { BentoSection } from '../../MeetingPrepPanels'
import BalanceView from '../BalanceView'
import InsightSection from '../InsightSection'

afterEach(() => {
  cleanup()
})

describe('priority rendering', () => {
  it('uses explicit bullet priority in InsightSection', () => {
    render(
      <InsightSection
        title="Signals"
        icon={<TrendingUp className="h-4 w-4" />}
        bullets={[
          { text: 'This is background context.', sourceIds: ['s1'], tag: 'fact', priority: 'fyi' },
        ]}
      />,
    )

    expect(screen.getByLabelText('Priority fyi')).toBeInTheDocument()
  })

  it('falls back to index-based priority when legacy bullets have no priority', () => {
    render(
      <BalanceView
        leftTitle="Support"
        rightTitle="Risks"
        leftItems={[
          { text: 'Top support point.', sourceIds: ['s1'], tag: 'fact' },
        ]}
        rightItems={[]}
      />,
    )

    expect(screen.getByLabelText('Priority must')).toBeInTheDocument()
  })

  it('uses explicit bullet priority in meeting-prep bento sections', () => {
    render(
      <BentoSection
        title="Talking points"
        icon={<TrendingUp className="h-4 w-4" />}
        bullets={[
          { text: 'Important but not primary.', sourceIds: ['s1'], tag: 'inference', priority: 'should' },
        ]}
        variant="talking"
        onSourceClick={() => undefined}
      />,
    )

    expect(screen.getByLabelText('Priority should')).toBeInTheDocument()
  })
})
