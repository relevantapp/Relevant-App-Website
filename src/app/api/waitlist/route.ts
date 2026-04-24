import { NextRequest, NextResponse } from 'next/server'

/**
 * Waitlist API Route
 * 
 * Environment Variables (optional):
 * - KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN: Vercel KV for production storage
 * - RESEND_API_KEY: To send notification emails (get free key at resend.com)
 * 
 * Fallback: Logs to console in development
 */

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

type WaitlistContext = {
  source?: string
  preparation?: string
  role?: string
  companyOrMarket?: string
}

async function sendWaitlistNotification(userEmail: string, context: WaitlistContext = {}) {
  // Send notification email
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Relevant <onboarding@resend.dev>',
        to: ['support@getrelevantapp.com'],
        subject: 'New Relevant website request',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000;">New Relevant Website Request</h2>
            <p style="font-size: 16px; color: #333;">Someone requested Relevant from the website.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #000;">${userEmail}</p>
            </div>
            <div style="background: #fafafa; padding: 16px; border-radius: 8px; margin: 20px 0; color: #333;">
              <p><strong>Source:</strong> ${context.source || 'homepage'}</p>
              <p><strong>Preparing for:</strong> ${context.preparation || 'n/a'}</p>
              <p><strong>Role:</strong> ${context.role || 'n/a'}</p>
              <p><strong>Company or market:</strong> ${context.companyOrMarket || 'n/a'}</p>
            </div>
            <p style="font-size: 14px; color: #666;">Signed up at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      })

      console.log(`✅ Relevant website notification sent for: ${userEmail}`)
      return true
    } catch (error) {
      console.error('Failed to send Relevant notification:', error)
      return false
    }
  }
  return false
}

function cleanOptionalField(value: unknown, maxLength = 180): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    const source = cleanOptionalField(body.source, 80)
    const preparation = cleanOptionalField(body.preparation, 80)
    const role = cleanOptionalField(body.role, 120)
    const companyOrMarket = cleanOptionalField(body.companyOrMarket, 160)

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Enter your email address.' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 }
      )
    }

    const context = {
      source: source || 'homepage',
      preparation,
      role,
      companyOrMarket,
    }

    // Send notification email
    await sendWaitlistNotification(email, context)
    console.log('📌 Waitlist context:', {
      source: context.source,
      preparation: context.preparation,
      role: context.role,
      companyOrMarket: context.companyOrMarket,
    })

    // Try Vercel KV if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const { kv } = await import('@vercel/kv')
        
        // Check if email already exists
        const exists = await kv.sismember('waitlist:emails', email)
        if (exists) {
          return NextResponse.json(
            { message: 'We already have your email.' },
            { status: 200 }
          )
        }

        // Add to waitlist
        await kv.sadd('waitlist:emails', email)
        await kv.zadd('waitlist:timestamps', {
          score: Date.now(),
          member: email
        })

        console.log(`✅ Added to KV waitlist: ${email}`)
        
        return NextResponse.json(
          { message: 'Thanks. We will follow up shortly.' },
          { status: 200 }
        )
      } catch (kvError) {
        console.error('KV error, falling back to console log:', kvError)
      }
    }

    // Fallback: Just log to console (development mode)
    console.log(`📧 Waitlist signup: ${email} at ${new Date().toISOString()}`)
    
    return NextResponse.json(
      { message: 'Thanks. We will follow up shortly.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
