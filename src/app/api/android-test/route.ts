import { type NextRequest, NextResponse } from 'next/server'

type AndroidTesterContext = {
  source?: string
}

const GROUP_URL = 'https://groups.google.com/g/relevant-app/'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.relevant.news'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function cleanField(value: unknown, maxLength = 100): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function notifyAndroidTester(email: string, context: AndroidTesterContext) {
  if (!process.env.RESEND_API_KEY) return false

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const safeEmail = escapeHtml(email)
    const safeSource = escapeHtml(context.source || 'homepage')

    await resend.emails.send({
      from: 'Relevant <onboarding@resend.dev>',
      to: ['support@getrelevantapp.com'],
      subject: 'New Relevant Android closed-test request',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">New Android Closed-Test Request</h2>
          <p style="font-size: 16px; color: #333;">Someone asked for Android test access from the website.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #000;">${safeEmail}</p>
          </div>
          <div style="background: #fafafa; padding: 16px; border-radius: 8px; margin: 20px 0; color: #333;">
            <p><strong>Source:</strong> ${safeSource}</p>
            <p><strong>Google Group:</strong> <a href="${GROUP_URL}">${GROUP_URL}</a></p>
            <p><strong>Play Store:</strong> <a href="${PLAY_STORE_URL}">${PLAY_STORE_URL}</a></p>
          </div>
          <p style="font-size: 14px; color: #666;">Submitted at: ${new Date().toISOString()}</p>
        </div>
      `,
    })

    return true
  } catch (error) {
    console.error('Android tester notification failed:', error)
    return false
  }
}

async function storeAndroidTester(email: string, context: AndroidTesterContext) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return false

  try {
    const { kv } = await import('@vercel/kv')
    const member = JSON.stringify({
      email,
      source: context.source || 'homepage',
      createdAt: new Date().toISOString(),
    })

    await kv.sadd('android-test:emails', email)
    await kv.zadd('android-test:requests', {
      score: Date.now(),
      member,
    })

    return true
  } catch (error) {
    console.error('Android tester KV storage failed:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const context = {
      source: cleanField(body.source, 80) || 'homepage',
    }

    if (!email) {
      return NextResponse.json({ error: 'Enter your Google email.' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid Google email.' }, { status: 400 })
    }

    await Promise.all([
      notifyAndroidTester(email, context),
      storeAndroidTester(email, context),
    ])

    console.log('Android closed-test request:', {
      email,
      source: context.source,
      submittedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      message: 'Email saved. Use the same Google account for both steps.',
      groupUrl: GROUP_URL,
      playStoreUrl: PLAY_STORE_URL,
    })
  } catch (error) {
    console.error('Android tester API error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
