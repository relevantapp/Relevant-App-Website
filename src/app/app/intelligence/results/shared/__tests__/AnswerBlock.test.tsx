// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingPrepFixture } from '../../__fixtures__/meeting-prep.fixture'
import AnswerBlock from '../AnswerBlock'

afterEach(() => cleanup())

describe('AnswerBlock', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders the five slots from a complete answer block', () => {
    render(
      <AnswerBlock
        answer={meetingPrepFixture.answer}
        fallback={{
          headline: meetingPrepFixture.headline,
          bottomLine: meetingPrepFixture.bottomLine,
          confidence: meetingPrepFixture.confidence,
          whyItMatters: meetingPrepFixture.whyItMatters,
        }}
        sources={meetingPrepFixture.sources}
      />,
    )

    expect(screen.getByText('Conclusion')).toBeInTheDocument()
    expect(screen.getByText('Why it matters')).toBeInTheDocument()
    expect(screen.getByText('What changed')).toBeInTheDocument()
    expect(screen.getByText('Confidence')).toBeInTheDocument()
    expect(screen.getByText('Recommended next')).toBeInTheDocument()
  })

  it('renders the fallback layout when answer is absent', () => {
    render(
      <AnswerBlock
        answer={undefined}
        fallback={{
          headline: meetingPrepFixture.headline,
          bottomLine: meetingPrepFixture.bottomLine,
          confidence: meetingPrepFixture.confidence,
          whyItMatters: meetingPrepFixture.whyItMatters,
        }}
        sources={meetingPrepFixture.sources}
      />,
    )

    expect(screen.getByText(meetingPrepFixture.headline)).toBeInTheDocument()
    expect(screen.getByText(meetingPrepFixture.bottomLine)).toBeInTheDocument()
  })

  it('uses an accessible confidence label and copies recommended text', () => {
    render(
      <AnswerBlock
        answer={meetingPrepFixture.answer}
        fallback={{
          headline: meetingPrepFixture.headline,
          bottomLine: meetingPrepFixture.bottomLine,
          confidence: meetingPrepFixture.confidence,
          whyItMatters: meetingPrepFixture.whyItMatters,
        }}
        sources={meetingPrepFixture.sources}
      />,
    )

    expect(screen.getByLabelText(/High confidence:/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(meetingPrepFixture.answer?.recommendedNext.copyable)
  })

  it('does not render a what-changed slot when the answer marks it null', () => {
    render(
      <AnswerBlock
        answer={{
          ...meetingPrepFixture.answer!,
          whatChanged: null,
        }}
        fallback={{
          headline: meetingPrepFixture.headline,
          bottomLine: meetingPrepFixture.bottomLine,
          confidence: meetingPrepFixture.confidence,
          whyItMatters: meetingPrepFixture.whyItMatters,
        }}
        sources={meetingPrepFixture.sources}
      />,
    )

    expect(screen.queryByText('What changed')).not.toBeInTheDocument()
  })
})
