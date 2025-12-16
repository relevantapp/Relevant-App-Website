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
          from: 'Relevant Contact Form <onboarding@resend.dev>', // Change to your verified domain
          to: 'support@getrelevantapp.com',
          subject: subject || 'New Contact Form Submission',
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${name || 'Anonymous'} (${email})</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
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
