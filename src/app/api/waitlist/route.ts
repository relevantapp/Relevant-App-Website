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

async function sendNotificationEmail(userEmail: string) {
  // Try to send notification email if Resend is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Relevant Waitlist <onboarding@resend.dev>',
        to: 'support@getrelevantapp.com',
        subject: '🎉 New Waitlist Signup!',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000;">New Waitlist Signup</h2>
            <p style="font-size: 16px; color: #333;">Someone just joined the Relevant waitlist!</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #000;">${userEmail}</p>
            </div>
            <p style="font-size: 14px; color: #666;">Signed up at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      })

      console.log(`✅ Notification email sent for: ${userEmail}`)
      return true
    } catch (error) {
      console.error('Failed to send notification email:', error)
      return false
    }
  }
  return false
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Send notification email to you
    await sendNotificationEmail(email)

    // Try Vercel KV if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const { kv } = await import('@vercel/kv')
        
        // Check if email already exists
        const exists = await kv.sismember('waitlist:emails', email)
        if (exists) {
          return NextResponse.json(
            { message: "You're already on the waitlist!" },
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
          { message: 'Successfully joined the waitlist!' },
          { status: 200 }
        )
      } catch (kvError) {
        console.error('KV error, falling back to console log:', kvError)
      }
    }

    // Fallback: Just log to console (development mode)
    console.log(`📧 Waitlist signup: ${email} at ${new Date().toISOString()}`)
    
    return NextResponse.json(
      { message: 'Successfully joined the waitlist!' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
