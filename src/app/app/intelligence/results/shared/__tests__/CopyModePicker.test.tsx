// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CopyModePicker from '../CopyModePicker'
import { meetingPrepFixture } from '../../__fixtures__/meeting-prep.fixture'

const toPngMock = vi.fn().mockResolvedValue('data:image/png;base64,pdf-test')
const pdfMock = vi.hoisted(() => ({
  addImage: vi.fn(),
  save: vi.fn(),
  jsPDF: vi.fn(),
}))

vi.mock('html-to-image', () => ({
  toPng: (...args: unknown[]) => toPngMock(...args),
}))

vi.mock('jspdf', () => ({
  jsPDF: function jsPDF(...args: unknown[]) {
    return pdfMock.jsPDF(...args)
  },
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('CopyModePicker', () => {
  const exportNode = document.createElement('div')
  const pdfNode = document.createElement('div')
  const exportRef = { current: exportNode }
  const pdfRef = { current: pdfNode }

  beforeEach(() => {
    toPngMock.mockClear()
    pdfMock.addImage.mockClear()
    pdfMock.save.mockClear()
    pdfMock.jsPDF.mockClear()
    pdfMock.jsPDF.mockReturnValue({
      internal: {
        pageSize: {
          getWidth: () => 842,
          getHeight: () => 595,
        },
      },
      addImage: pdfMock.addImage,
      save: pdfMock.save,
    })
    vi.stubGlobal('Image', class {
      width = 1200
      height = 630
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        setTimeout(() => this.onload?.(), 0)
      }
    })
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })

  it('opens a print-ready PDF export when a pdf ref is provided', async () => {
    render(<CopyModePicker brief={meetingPrepFixture} exportRef={exportRef} pdfRef={pdfRef} />)

    fireEvent.click(screen.getByRole('button', { name: /copy as/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /export as pdf/i }))

    await waitFor(() => {
      expect(toPngMock).toHaveBeenCalledWith(pdfNode, expect.objectContaining({
        cacheBust: true,
        pixelRatio: 2,
      }))
      expect(pdfMock.addImage).toHaveBeenCalledTimes(1)
      expect(pdfMock.save).toHaveBeenCalledWith(expect.stringMatching(/\.pdf$/))
    })
  })

  it('keeps PDF export visible as a top-level action', async () => {
    render(<CopyModePicker brief={meetingPrepFixture} exportRef={exportRef} pdfRef={pdfRef} />)

    fireEvent.click(screen.getByRole('button', { name: /save pdf/i }))

    await waitFor(() => {
      expect(toPngMock).toHaveBeenCalledWith(pdfNode, expect.objectContaining({
        cacheBust: true,
        pixelRatio: 2,
      }))
      expect(pdfMock.save).toHaveBeenCalledTimes(1)
    })
  })

  it('copies the whole brief from the copy menu', async () => {
    render(<CopyModePicker brief={meetingPrepFixture} exportRef={exportRef} pdfRef={pdfRef} />)

    fireEvent.click(screen.getByRole('button', { name: /copy as/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /whole brief/i }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('## Sources'))
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining(meetingPrepFixture.headline))
    })
  })
})
