'use client'

import { useState } from 'react'
import styles from './public-signal.module.css'

type WaitlistStatus = 'idle' | 'loading' | 'success' | 'already' | 'error'
type Platform = 'ios' | 'android' | ''

type Props = {
  signalId: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

export default function PublicSignalClient({ signalId }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<WaitlistStatus>('idle')
  const [message, setMessage] = useState('')
  const [platform, setPlatform] = useState<Platform>('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const cleaned = email.trim().toLowerCase()
    if (!platform) {
      setStatus('error')
      setMessage('Select iOS or Android to continue.')
      return
    }

    if (!cleaned || !EMAIL_REGEX.test(cleaned)) {
      setStatus('error')
      setMessage(platform === 'ios' ? 'Enter the Apple ID email for TestFlight.' : 'Enter the Play Store email.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: cleaned,
          signal_id: signalId,
          source: 'share-web',
          platform,
          ios_apple_id: platform === 'ios' ? cleaned : null,
          android_play_email: platform === 'android' ? cleaned : null,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error('Signup failed')
      }

      const msg = typeof data?.message === 'string' ? data.message : ''
      if (msg.toLowerCase().includes('already')) {
        setStatus('already')
        setMessage('Already requested. We will follow up soon.')
      } else {
        setStatus('success')
        setMessage('Access requested. We will send a direct download link.')
        setEmail('')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Try again in a moment.')
    }
  }

  return (
    <div>
      <h2 className={styles.ctaTitle}>Get access now</h2>
      <p className={styles.ctaBody}>
        This signal was generated inside the Relevant app. Tell us your platform so we can send the
        direct download link.
      </p>

      <form onSubmit={handleSubmit} className={styles.formRow}>
        <div className={styles.formRow}>
          <span className={styles.fieldLabel}>Platform</span>
          <div className={styles.platformRow}>
            <button
              type="button"
              className={`btn btn-outline ${styles.platformButton} ${platform === 'ios' ? styles.platformActive : ''}`}
              onClick={() => {
                setPlatform('ios')
                if (status !== 'idle') {
                  setStatus('idle')
                  setMessage('')
                }
              }}
            >
              iOS
            </button>
            <button
              type="button"
              className={`btn btn-outline ${styles.platformButton} ${platform === 'android' ? styles.platformActive : ''}`}
              onClick={() => {
                setPlatform('android')
                if (status !== 'idle') {
                  setStatus('idle')
                  setMessage('')
                }
              }}
            >
              Android
            </button>
          </div>
        </div>

        <span className={styles.fieldLabel}>
          {platform === 'ios'
            ? 'Apple ID email'
            : platform === 'android'
              ? 'Play Store email'
              : 'Account email'}
        </span>

        <div className="input-group">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (status !== 'idle') {
                setStatus('idle')
                setMessage('')
              }
            }}
            disabled={!platform}
            placeholder={
              platform === 'ios'
                ? 'apple-id@example.com'
                : platform === 'android'
                  ? 'playstore@email.com'
                  : 'Select platform first'
            }
            autoComplete="email"
            aria-label={
              platform === 'ios'
                ? 'Apple ID email'
                : platform === 'android'
                  ? 'Play Store email'
                  : 'Email address'
            }
            required
          />

          <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Requesting...' : 'Send link'}
          </button>
        </div>
      </form>

      <p className={styles.status}>
        {platform === 'android'
          ? 'Android: use the email tied to your Play Store account.'
          : platform === 'ios'
            ? 'iOS: use the Apple ID email for TestFlight access.'
            : 'Choose a platform to see the correct account email.'}
      </p>

      {message ? (
        <p className={`${styles.status} ${status === 'error' ? styles.error : ''}`}>{message}</p>
      ) : null}
    </div>
  )
}
