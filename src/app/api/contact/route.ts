import { NextRequest, NextResponse } from 'next/server'

/**
 * Contact API Route
 * 
 * Environment Variable (optional):
 * - RESEND_API_KEY: Your Resend API key for sending emails
 * 
 * Fallback: Returns mailto link if RESEND_API_KEY not set
 * This ensures the site never breaks - frontend can handle mailto as backup
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, message, subject } = body

    // Validate inputs
    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      )
    }

    // If Resend API key is available, send email
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: 'Relevant Contact Form <onboarding@resend.dev>',
          to: ['support@getrelevantapp.com'],
          subject: subject || 'New Contact Form Submission',
          replyTo: email,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #000;">New Contact Form Message</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${name || 'Anonymous'}</p>
                <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <div style="background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-weight: 600;">Message:</p>
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
          `,
        })

        console.log(`✅ Contact email sent from ${email}`)
        
        return NextResponse.json(
          { message: 'Message sent successfully!' },
          { status: 200 }
        )
      } catch (resendError) {
        console.error('Resend error:', resendError)
        // Fall through to mailto fallback
      }
    }

    // Fallback: Return mailto instruction
    // Frontend will handle opening email client
    console.log(`📧 Contact form submission (no Resend): ${email} - ${message}`)
    
    return NextResponse.json(
      { 
        fallback: 'mailto',
        mailto: `mailto:support@getrelevantapp.com?subject=${encodeURIComponent(subject || 'Relevant Support')}&body=${encodeURIComponent(message)}`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
