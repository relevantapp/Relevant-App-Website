'use client'

import { useState } from 'react'
import type { BriefSource } from '@/lib/intelligence/contracts'

interface SourcesStripProps {
  sources: BriefSource[]
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function SourceRow({ source, isLast }: { source: BriefSource; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const hasSnippet = !!source.snippet
  const visualUrl = source.imageUrl || source.faviconUrl || null

  return (
    <div
      id={`source-${source.id}`}
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: visualUrl ? '24px 34px 1fr auto' : '24px 1fr auto',
          gap: 10,
          alignItems: 'center',
          padding: '10px 18px',
          cursor: hasSnippet ? 'pointer' : 'default',
          transition: 'background 150ms',
        }}
        onClick={() => hasSnippet && setExpanded(!expanded)}
        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface)' }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <span className="mono tnum" style={{ fontSize: 10, color: 'var(--text-soft)' }}>
          [{source.id}]
        </span>
        {visualUrl && (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
            }}
          >
            <img
              src={visualUrl}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: source.imageUrl ? 'cover' : 'contain' }}
            />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {source.title}
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-soft)', marginTop: 2 }}>
            {source.domain}{source.publishedAt ? ` · ${formatDate(source.publishedAt)}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {hasSnippet && (
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-soft)' }}>
              {expanded ? '▾' : '▸'}
            </span>
          )}
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-soft)', textTransform: 'uppercase' }}>
            {source.provider}
          </span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mono"
            style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            ↗
          </a>
        </div>
      </div>
      {expanded && source.snippet && (
        <div
          style={{
            padding: '0 18px 12px 52px',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--text-muted)',
          }}
        >
          {source.snippet}
        </div>
      )}
    </div>
  )
}

export default function SourcesStrip({ sources }: SourcesStripProps) {
  if (!sources.length) return null
  const imageSources = sources.filter((source) => source.imageUrl).slice(0, 5)

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
        <span className="kicker">Sources · {sources.length}</span>
      </div>
      {imageSources.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 8,
            padding: 12,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {imageSources.map((source) => (
            <a
              key={`image-${source.id}`}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                minHeight: 92,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                textDecoration: 'none',
              }}
            >
              <img
                src={source.imageUrl ?? ''}
                alt=""
                loading="lazy"
                style={{ width: '100%', height: 92, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '7px 8px' }}>
                <p style={{ margin: 0, color: 'var(--text)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {source.title}
                </p>
                <p className="mono" style={{ margin: '2px 0 0', color: 'var(--text-soft)', fontSize: 9 }}>
                  {source.domain}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
      <div>
        {sources.map((source, i) => (
          <SourceRow key={source.id} source={source} isLast={i === sources.length - 1} />
        ))}
      </div>
    </div>
  )
}
