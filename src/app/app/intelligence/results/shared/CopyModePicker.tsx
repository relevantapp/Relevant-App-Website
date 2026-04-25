/* ── CopyMode Picker — format-specific brief export ─────── */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Check, ChevronDown, Download, FileDown, Loader2, AlertCircle } from 'lucide-react'
import { toPng } from 'html-to-image'
import type { IntelligenceBrief } from '@/lib/intelligence/contracts'

export type CopyFormat = 'full' | 'founder' | 'sales' | 'memo' | 'linkedin' | 'slack'

const FORMATS: Array<{ value: CopyFormat; label: string; description: string }> = [
  { value: 'full', label: 'Whole Brief', description: 'Everything useful, including sources' },
  { value: 'founder', label: 'Founder Brief', description: 'Executive summary, 3-5 bullets' },
  { value: 'sales', label: 'Sales Brief', description: 'Objections, leverage, next steps' },
  { value: 'memo', label: 'Internal Memo', description: 'Structured analysis for the team' },
  { value: 'linkedin', label: 'LinkedIn Post', description: 'Shareable insight, 150 words' },
  { value: 'slack', label: 'Slack Message', description: 'Quick update, emoji-friendly' },
]

const TRANSPARENT_IMAGE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

interface CopyModePickerProps {
  brief: IntelligenceBrief
  exportRef?: React.RefObject<HTMLDivElement | null>
  pdfRef?: React.RefObject<HTMLDivElement | null>
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not prepare PDF image'))
    image.src = src
  })
}

function shouldIncludeInExport(node: HTMLElement): boolean {
  if (typeof HTMLImageElement === 'undefined' || !(node instanceof HTMLImageElement)) return true

  const src = node.currentSrc || node.src
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return true

  try {
    const url = new URL(src, window.location.href)
    return url.origin === window.location.origin
  } catch {
    return true
  }
}

export default function CopyModePicker({ brief, exportRef, pdfRef }: CopyModePickerProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<CopyFormat | null>(null)
  const [exporting, setExporting] = useState(false)
  const [printingPdf, setPrintingPdf] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formatBrief = (format: CopyFormat): string => {
    const b = brief
    const headline = b.headline || 'Intelligence Brief'
    const bottomLine = b.bottomLine || ''

    switch (format) {
      case 'full':
        return formatFullBrief(b)

      case 'founder':
        return [
          `# ${headline}`,
          '',
          bottomLine,
          '',
          ...extractBullets(b).slice(0, 5).map((s) => `• ${s}`),
          '',
          `Confidence: ${b.confidence}`,
        ].join('\n')

      case 'sales':
        return [
          `**${headline}**`,
          '',
          `Bottom line: ${bottomLine}`,
          '',
          '**Key talking points:**',
          ...extractBullets(b).slice(0, 4).map((s) => `- ${s}`),
          '',
          `Sources: ${b.sources?.length ?? 0} verified`,
        ].join('\n')

      case 'memo':
        return [
          `## ${headline}`,
          '',
          `**Summary:** ${bottomLine}`,
          '',
          '### Key Findings',
          ...extractBullets(b).map((s) => `- ${s}`),
          '',
          `### Sources (${b.sources?.length ?? 0})`,
          ...(b.sources ?? []).slice(0, 5).map((s) => `- [${s.title}](${s.url})`),
          '',
          `_Confidence: ${b.confidence} | Generated ${new Date().toLocaleDateString()}_`,
        ].join('\n')

      case 'linkedin':
        return [
          headline,
          '',
          bottomLine,
          '',
          ...extractBullets(b).slice(0, 3).map((s) => `→ ${s}`),
          '',
          '#intelligence #research',
        ].join('\n')

      case 'slack':
        return [
          `:bulb: *${headline}*`,
          '',
          `> ${bottomLine}`,
          '',
          ...extractBullets(b).slice(0, 3).map((s) => `• ${s}`),
        ].join('\n')
    }
  }

  const handleCopy = async (format: CopyFormat) => {
    const text = formatBrief(format)
    await navigator.clipboard.writeText(text)
    setCopied(format)
    setOpen(false)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleExportImage = async () => {
    if (!exportRef?.current) return
    setExporting(true)
    setExportError(null)
    try {
      const dataUrl = await toPng(exportRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
        filter: shouldIncludeInExport,
        imagePlaceholder: TRANSPARENT_IMAGE_PLACEHOLDER,
      })
      const link = document.createElement('a')
      link.download = `intelligence-brief-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      setOpen(false)
    } catch (err) {
      console.error('[CopyMode] Export failed:', err)
      setExportError('Export failed')
      setTimeout(() => setExportError(null), 2500)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    if (!pdfRef?.current) return

    setPrintingPdf(true)
    setExportError(null)

    try {
      const dataUrl = await toPng(pdfRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8f9fa',
        filter: shouldIncludeInExport,
        imagePlaceholder: TRANSPARENT_IMAGE_PLACEHOLDER,
      })

      const [{ jsPDF }, image] = await Promise.all([
        import('jspdf'),
        loadImage(dataUrl),
      ])
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 24
      const availableWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - margin * 2
      const scale = Math.min(availableWidth / image.width, availableHeight / image.height)
      const width = image.width * scale
      const height = image.height * scale
      const x = (pageWidth - width) / 2
      const y = (pageHeight - height) / 2

      pdf.addImage(dataUrl, 'PNG', x, y, width, height, undefined, 'FAST')
      pdf.save(`${slugify(brief.headline || 'intelligence-brief') || 'intelligence-brief'}.pdf`)
      setOpen(false)
    } catch (err) {
      console.error('[CopyMode] PDF export failed:', err)
      setExportError('PDF failed')
      setTimeout(() => setExportError(null), 2500)
    } finally {
      setPrintingPdf(false)
    }
  }

  return (
    <div ref={menuRef} className="copy-mode-actions">
      {pdfRef && (
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={printingPdf}
          aria-label="Save PDF"
          className="copy-mode-button copy-mode-button--primary"
          title={exportError ?? 'Save as PDF'}
        >
          {printingPdf ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : exportError ? (
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span className="copy-mode-button-label">
            {printingPdf ? 'Preparing...' : exportError ?? 'Save PDF'}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="copy-mode-button"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy as…
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            width: 'min(240px, calc(100vw - 2rem))',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface-strong)',
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 50,
          }}
          role="menu"
        >
          {FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              type="button"
              onClick={() => handleCopy(fmt.value)}
              role="menuitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderRadius: 6,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {copied === fmt.value ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-teal)]" />
              ) : (
                <Copy className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
              )}
              <div>
                <div style={{ fontWeight: 500 }}>{fmt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt.description}</div>
              </div>
            </button>
          ))}

          {exportRef && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={handleExportImage}
                disabled={exporting}
                role="menuitem"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: 13,
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderRadius: 6,
                  color: 'var(--text)',
                  cursor: exporting ? 'default' : 'pointer',
                  opacity: exporting ? 0.5 : 1,
                }}
              >
                <Download className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                  <div>
                    <div style={{ fontWeight: 500 }}>{exporting ? 'Exporting…' : 'Export as Image'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>1200×630 PNG</div>
                  </div>
                </button>
            </>
          )}

          {pdfRef && (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={printingPdf}
              role="menuitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderRadius: 6,
                color: 'var(--text)',
                cursor: printingPdf ? 'default' : 'pointer',
                opacity: printingPdf ? 0.5 : 1,
              }}
            >
              <Download className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
              <div>
                <div style={{ fontWeight: 500 }}>{printingPdf ? 'Preparing PDF…' : 'Export as PDF'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Print-ready one-page layout</div>
              </div>
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .copy-mode-actions {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .copy-mode-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 30px;
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 9999px;
          background: var(--surface);
          color: var(--text);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .copy-mode-button--primary {
          color: #fff;
          border-color: color-mix(in oklch, var(--accent), transparent 35%);
          background: var(--accent);
        }
        .copy-mode-button:hover:not(:disabled) {
          border-color: var(--accent);
        }
        .copy-mode-button:disabled {
          cursor: default;
          opacity: 0.65;
        }
        @media (max-width: 640px) {
          .copy-mode-button-label {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

function extractBullets(brief: IntelligenceBrief): string[] {
  const bullets: string[] = []
  if ('sections' in brief && brief.sections) {
    const sections = brief.sections as Record<string, unknown>
    for (const val of Object.values(sections)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
            bullets.push(item.text)
          }
        }
      }
    }
  }
  return bullets
}

function formatFullBrief(brief: IntelligenceBrief): string {
  const lines: string[] = [
    `# ${brief.headline || 'Intelligence Brief'}`,
    '',
    `Bottom line: ${brief.bottomLine || 'Not provided.'}`,
  ]

  if (brief.whyItMatters) {
    lines.push('', `Why it matters: ${brief.whyItMatters}`)
  }

  if (brief.answer) {
    lines.push(
      '',
      '## Answer',
      '',
      `Conclusion: ${brief.answer.conclusion.text}`,
      '',
      `Why it matters: ${brief.answer.whyItMatters.text}`,
    )

    if (brief.answer.whatChanged?.text) {
      lines.push('', `What changed: ${brief.answer.whatChanged.text}`)
    }

    lines.push(
      '',
      `Recommended next: ${brief.answer.recommendedNext.text}`,
      '',
      `Confidence: ${brief.answer.confidence.level} - ${brief.answer.confidence.driver}`,
    )
  }

  const sections = 'sections' in brief && brief.sections
    ? brief.sections as Record<string, unknown>
    : null

  if (sections) {
    lines.push('', '## Sections')
    for (const [key, value] of Object.entries(sections)) {
      if (!Array.isArray(value) || value.length === 0) continue
      lines.push('', `### ${formatSectionTitle(key)}`)
      for (const item of value) {
        if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
          lines.push(`- ${item.text}`)
        }
      }
    }
  }

  if (brief.sources?.length) {
    lines.push('', `## Sources (${brief.sources.length})`)
    for (const source of brief.sources) {
      lines.push(`- ${source.title} (${source.domain}) - ${source.url}`)
    }
  }

  lines.push('', `Generated: ${new Date(brief.generatedAt).toLocaleString()}`)
  return lines.join('\n')
}

function formatSectionTitle(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
