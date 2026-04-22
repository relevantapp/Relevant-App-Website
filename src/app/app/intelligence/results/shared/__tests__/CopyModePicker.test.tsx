// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CopyModePicker from '../CopyModePicker'
import { meetingPrepFixture } from '../../__fixtures__/meeting-prep.fixture'

const toPngMock = vi.fn().mockResolvedValue('data:image/png;base64,pdf-test')

vi.mock('html-to-image', () => ({
  toPng: (...args: unknown[]) => toPngMock(...args),
}))

afterEach(() => cleanup())

describe('CopyModePicker', () => {
  const exportNode = document.createElement('div')
  const pdfNode = document.createElement('div')
  const exportRef = { current: exportNode }
  const pdfRef = { current: pdfNode }
  let openSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    toPngMock.mockClear()
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => ({
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    }) as unknown as Window)
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })

  it('opens a print-ready PDF export when a pdf ref is provided', async () => {
    render(<CopyModePicker brief={meetingPrepFixture} exportRef={exportRef} pdfRef={pdfRef} />)

    fireEvent.click(screen.getByRole('button', { name: /copy as/i }))
    fireEvent.click(screen.getByRole('button', { name: /export as pdf/i }))

    await waitFor(() => {
      expect(toPngMock).toHaveBeenCalledWith(pdfNode, expect.objectContaining({
        cacheBust: true,
        pixelRatio: 2,
      }))
      expect(openSpy).toHaveBeenCalledTimes(1)
    })

    const popup = openSpy.mock.results[0]?.value
    expect(popup.document.write).toHaveBeenCalledWith(expect.stringContaining('@page { size: landscape; margin: 12mm; }'))
    expect(popup.document.write).toHaveBeenCalledWith(expect.stringContaining('data:image/png;base64,pdf-test'))
  })
})
