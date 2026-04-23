'use client'

import { AlertCircle } from 'lucide-react'
import { Card, Kicker } from './ui/primitives'

interface ProviderStatus {
  key: string
  label: string
  purpose: string
  configured: boolean
}

interface IntelligenceSetupNoticeProps {
  providers: ProviderStatus[]
}

export default function IntelligenceSetupNotice({ providers }: IntelligenceSetupNoticeProps) {
  const missingProviders = providers.filter((provider) => !provider.configured)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card bg="rgba(12, 16, 20, 0.92)" pad={0} rounded={16}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle className="h-4 w-4" style={{ color: 'var(--amber)' }} />
            <Kicker color="var(--amber)">Local setup required</Kicker>
          </div>
          <h1
            className="intel-display"
            style={{
              marginTop: 12,
              fontSize: 'clamp(30px, 5vw, 46px)',
              lineHeight: 1.02,
              color: 'var(--ink)',
            }}
          >
            Intelligence needs its search and AI providers before it can run.
          </h1>
          <p
            style={{
              marginTop: 14,
              maxWidth: 680,
              color: 'var(--ink-muted)',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            The page shell is healthy. What is missing in this local build are the services that fetch live web evidence
            and write the final brief, so running Intelligence right now would only produce misleading partial output.
          </p>
        </div>

        <div style={{ padding: '6px 20px 0' }}>
          {missingProviders.map((provider, index) => (
            <div
              key={provider.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '132px minmax(0, 1fr)',
                gap: 14,
                alignItems: 'start',
                padding: '14px 0',
                borderBottom: index === missingProviders.length - 1 ? 'none' : '1px solid var(--border)',
              }}
            >
              <span className="mono" style={{ fontSize: 11, color: 'var(--amber)', textTransform: 'uppercase' }}>
                {provider.label}
              </span>
              <div>
                <p style={{ margin: 0, color: 'var(--ink)', fontSize: 13, fontWeight: 500 }}>
                  {provider.purpose}
                </p>
                <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: 12, lineHeight: 1.45 }}>
                  Missing env key: {provider.key}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '14px 20px 18px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--ink-muted)',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Once those provider keys are present locally, restart the dev server and this page will unlock automatically.
        </div>
      </Card>
    </div>
  )
}
