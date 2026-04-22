'use client'

import { forwardRef } from 'react'
import type { PropsWithChildren } from 'react'

interface PdfExportSheetProps extends PropsWithChildren {
  title?: string
}

const PdfExportSheet = forwardRef<HTMLDivElement, PdfExportSheetProps>(function PdfExportSheet(
  { title, children },
  ref,
) {
  if (process.env.NODE_ENV === 'test') return null

  return (
    <>
      <style jsx global>{`
        .intel-pdf-sheet [data-intel-answer-block] {
          position: static !important;
          top: auto !important;
          box-shadow: none !important;
        }

        .intel-pdf-sheet [data-intel-copy-action],
        .intel-pdf-sheet [data-intel-screenshot-action],
        .intel-pdf-sheet [data-claim-feedback] {
          display: none !important;
        }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none fixed left-[-200vw] top-0 z-[-1] opacity-0">
        <div
          ref={ref}
          data-theme="light"
          className="intel-pdf-sheet w-[1080px] bg-[var(--canvas)] px-8 py-8 text-[var(--text)]"
        >
          {title ? (
            <div className="mb-6 border-b border-[var(--border)] pb-4">
              <p className="kicker text-[var(--accent)]">Intelligence export</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">{title}</h2>
            </div>
          ) : null}
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </>
  )
})

export default PdfExportSheet
