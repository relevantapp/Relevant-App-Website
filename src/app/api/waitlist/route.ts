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

async function saveToFile(userEmail: string) {
  // Save to file instead of sending email
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const waitlistDir = path.join(process.cwd(), 'waitlist-data')
    const filePath = path.join(waitlistDir, 'emails.txt')
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(waitlistDir, { recursive: true })
    } catch (e) {
      // Directory might already exist
    }
    
    const timestamp = new Date().toISOString()
    const entry = `${timestamp} | ${userEmail}\n`
    
    await fs.appendFile(filePath, entry)
    console.log(`✅ Saved to file: ${userEmail}`)
    return true
  } catch (error) {
    console.error('Failed to save to file:', error)
    return false
  }
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

    // Save to file
    await saveToFile(email)

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
