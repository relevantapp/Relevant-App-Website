/* ── CopyMode Picker — format-specific brief export ─────── */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Check, ChevronDown, Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import type { IntelligenceBrief } from '@/lib/intelligence/contracts'

export type CopyFormat = 'founder' | 'sales' | 'memo' | 'linkedin' | 'slack'

const FORMATS: Array<{ value: CopyFormat; label: string; description: string }> = [
  { value: 'founder', label: 'Founder Brief', description: 'Executive summary, 3-5 bullets' },
  { value: 'sales', label: 'Sales Brief', description: 'Objections, leverage, next steps' },
  { value: 'memo', label: 'Internal Memo', description: 'Structured analysis for the team' },
  { value: 'linkedin', label: 'LinkedIn Post', description: 'Shareable insight, 150 words' },
  { value: 'slack', label: 'Slack Message', description: 'Quick update, emoji-friendly' },
]

interface CopyModePickerProps {
  brief: IntelligenceBrief
  exportRef?: React.RefObject<HTMLDivElement | null>
  pdfRef?: React.RefObject<HTMLDivElement | null>
}

export default function CopyModePicker({ brief, exportRef, pdfRef }: CopyModePickerProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<CopyFormat | null>(null)
  const [exporting, setExporting] = useState(false)
  const [printingPdf, setPrintingPdf] = useState(false)
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
    try {
      const dataUrl = await toPng(exportRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
      })
      const link = document.createElement('a')
      link.download = `intelligence-brief-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      setOpen(false)
    } catch (err) {
      console.error('[CopyMode] Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    if (!pdfRef?.current) return

    setPrintingPdf(true)

    try {
      const dataUrl = await toPng(pdfRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f6f1e6',
      })

      const printWindow = window.open('', '_blank', 'width=1200,height=900')
      if (!printWindow) throw new Error('Print window unavailable')

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Intelligence brief export</title>
            <style>
              @page { size: landscape; margin: 12mm; }
              html, body { margin: 0; padding: 0; background: #f6f1e6; }
              body {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: ui-sans-serif, system-ui, sans-serif;
              }
              img {
                width: 100%;
                max-width: 1280px;
                height: auto;
                display: block;
                border-radius: 20px;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Intelligence brief export" />
            <script>
              window.addEventListener('load', () => {
                window.focus();
                window.print();
                window.setTimeout(() => window.close(), 250);
              });
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
      setOpen(false)
    } catch (err) {
      console.error('[CopyMode] PDF export failed:', err)
    } finally {
      setPrintingPdf(false)
    }
  }

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 500,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text)',
          cursor: 'pointer',
        }}
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
        >
          {FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              type="button"
              onClick={() => handleCopy(fmt.value)}
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
