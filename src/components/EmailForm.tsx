'use client'

import { useState } from 'react'

export default function EmailForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      // Using Formspree - replace YOUR_FORM_ID with your actual Formspree form ID
      const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setStatus('success')
        setMessage("You're on the list! We'll be in touch soon.")
        setEmail('')
      } else {
        throw new Error('Failed to submit')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-1 px-5 py-3 rounded-full text-base outline-none transition-all"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-8 py-3 font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          style={{
            background: 'var(--accent)',
            color: '#FFFFFF',
            minHeight: '48px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#4F83FF'; e.currentTarget.style.boxShadow = '0 0 20px rgba(47, 107, 255, 0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </button>
      </div>
      {message && (
        <p className={`mt-3 text-sm`} style={{ color: status === 'success' ? 'var(--success)' : '#F87171' }}>
          {message}
        </p>
      )}
    </form>
  )
}
