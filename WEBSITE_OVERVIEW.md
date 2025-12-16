# Relevant App - Website Overview

## Live URL
**https://www.getrelevantapp.com**

---

## Product Description
Relevant is a personalized news feed app that delivers curated content in 5 minutes a day. It focuses on "why it matters" explanations for news, local events, AI tools, learning, and goal tracking.

**Pricing**: $4.99/month with 7-day free trial  
**Contact**: support@getrelevantapp.com  
**Instagram**: https://www.instagram.com/relevant.app/

---

## Website Structure

### Navigation Bar
- **Logo**: Black Relevant logo (40x40px) on left
- **Links**: Pricing, Waitlist, Instagram
- **Style**: Fixed header, semi-transparent black background with blur

### Main Sections (in order):

#### 1. Hero Section
- **Logo**: Large Relevant logo (80x80px) centered above heading
- **Headline**: "Stay Relevant"
- **Subheadings**:
  - "Too much news. Not enough time."
  - "You feel guilty skipping articles. You feel behind."
  - "We built a feed that respects your time and keeps you sharp."
- **CTA**: "Get Early Access" button → links to #waitlist
- **Pricing Info**: "Free 7-day trial at launch • $4.99/month after"
- **Time commitment**: "5 minutes a day. That's it."

#### 2. The Feed Section
**iPhone Mockup**:
- iPhone 17 Pro Max design in silver/titanium
- Shows 3 feed cards in mobile format
- Demonstrates actual app interface

**Feed Cards** (Horizontal Scroll):
6 example feed cards that users can swipe through:

1. **NEWS**
   - Headline: "Major shift in federal housing policy"
   - Summary: Government affordability measures for first-time buyers
   - Why it matters: "If you're under 35, this could affect your mortgage approval process by spring."
   - Image: Real estate/house

2. **LOCAL**
   - Headline: "Toronto Film Festival announces surprise opener"
   - Summary: World premiere confirmed for September
   - Why it matters: "Downtown streets close Sept 7–10. Plan your commute now."
   - Image: Cinema/film

3. **AI TOOL**
   - Headline: "Claude 4 now writes production code"
   - Summary: Anthropic releases model with autonomous debugging
   - Why it matters: "Could cut dev time 30%. Beta waitlist open until Friday."
   - Image: AI/tech

4. **LEARN**
   - Headline: "Word of the day: Zeitgeist"
   - Summary: Definition of zeitgeist
   - Why it matters: "Shows up in business writing 3x more than casual conversation."
   - Image: Books/learning

5. **EVENTS**
   - Headline: "Free startup meetup at MaRS this Thursday"
   - Summary: 6pm, networking + panel on product-market fit
   - Why it matters: "Last event had 3 hiring founders. Bring business cards."
   - Image: Networking/conference

6. **GOALS**
   - Headline: "You're 2 days from your weekly streak"
   - Summary: Current progress towards 7-day reading streak
   - Why it matters: "Hit 7 and unlock your first badge. Keep going."
   - Image: Checklist/goals

**Card Design**:
- Horizontal scrolling (swipeable on mobile)
- 320px width cards with snap-to-scroll
- Each card has: image, category tag, headline, summary, "WHY IT MATTERS" section
- Dark theme with subtle borders

#### 3. What You Get Section
6 feature tiles in grid layout:

1. 📰 **News summaries** - "No fluff. Just what happened and who said what."
2. 💡 **Why it matters** - "Every story explains its relevance to your life and work."
3. 📍 **Local context** - "Events, transit updates, and what's happening in your city."
4. 📚 **Learn daily** - "One word. One insight. Build knowledge without trying."
5. 🤖 **AI tools** - "New tools that actually matter, explained in plain language."
6. 🎯 **Goal tracking** - "Streaks and progress. Stay consistent without pressure."

#### 4. How It Works Section
3-step process:

1. **Choose your goals** - Career growth, stay local, learn daily
2. **Choose your city and interests** - Toronto tech? Miami founder? We tailor the feed
3. **Daily feed + progress** - Read. Learn. Track streaks. Stay consistent.

#### 5. Why Relevant Exists Section
Personal story from founder:
- "I got tired of feeling behind. Every group chat had a topic I missed."
- "Reading more didn't help. I just felt overwhelmed and guilty."
- "So I built this. A feed that assumes you're busy."
- "No guilt. No FOMO. Just relevance."

#### 6. Pricing Section
- **Price**: $4.99/month
- **Trial**: 7 days free
- Includes: Daily feed, Why it matters, Learn words, Local news, AI tool updates, Goal tracking
- **CTA**: "Join Waitlist" button

#### 7. Waitlist Section
- Email input form
- Submit button
- Success/error feedback messages
- Clean, minimal design

#### 8. Contact Section
- Name input
- Email input
- Message textarea
- Submit button
- Used for general inquiries

#### 9. Footer
- Copyright notice
- Email: support@getrelevantapp.com
- Instagram link

---

## Design System

### Colors
- **Background**: #0a0a0a (soft black, not pure black)
- **Text**: #ffffff (white)
- **Borders**: rgba(255, 255, 255, 0.12) (subtle white)
- **Cards**: rgba(255, 255, 255, 0.04) background
- **Hover states**: Slightly lighter backgrounds

### Typography
- **Font Stack**: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif
- **Hero H1**: 48-96px (responsive)
- **Section Titles**: 32-48px (responsive)
- **Body Text**: 15-18px
- **Letter Spacing**: Tight (-0.01em to -0.04em for headings)

### Spacing
- **Section Padding**: 50px vertical
- **Container Max Width**: 980px (desktop)
- **Card Gaps**: 24px
- **Border Radius**: 12-16px

### Interactive Elements
- **Buttons**: 16px padding, rounded corners, smooth transitions
- **Hover Effects**: Opacity changes, subtle transforms
- **Focus States**: 2px white outline with 4px offset
- **Scroll Behavior**: Smooth with snap points

---

## Technical Stack

### Framework
- **Next.js 14.2.35** - App Router
- **React 18** - UI library
- **TypeScript 5.0** - Type safety

### Styling
- **Tailwind CSS 3.4** - Utility classes
- **Custom CSS** - Extensive custom styling in globals.css
- **Responsive Design** - Mobile-first approach

### Deployment
- **Vercel** - Hosting and deployment
- **Git Repository**: github.com/relevantapp/Relevant-App-Website.git
- **Domain**: www.getrelevantapp.com

### APIs & Services
- **Resend** - Email notifications (configured with RESEND_API_KEY)
- **Vercel KV** - Optional database for production email storage

---

## API Endpoints

### POST /api/waitlist
**Purpose**: Capture waitlist signups and send notification emails

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
- Success: `{ "message": "Successfully joined the waitlist!" }`
- Error: `{ "error": "Invalid email format" }`

**Behavior**:
- Validates email format
- Sends notification to support@getrelevantapp.com via Resend
- Uses Vercel KV if available for permanent storage
- Falls back to console logging in development

### POST /api/contact
**Purpose**: Handle contact form submissions

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "message": "Your message here",
  "subject": "Contact Form Subject"
}
```

**Response**:
- Success: `{ "message": "Message sent successfully!" }`
- Error: `{ "error": "Email and message are required" }`

**Behavior**:
- Sends email to support@getrelevantapp.com via Resend
- Includes reply_to field for easy responses
- Falls back to mailto link if Resend unavailable

---

## Environment Variables

### Required for Email Functionality
```
RESEND_API_KEY=your_resend_api_key_here
```

### Optional (Production)
```
KV_URL=your_vercel_kv_url
KV_REST_API_URL=your_vercel_kv_rest_api_url
KV_REST_API_TOKEN=your_vercel_kv_token
```

---

## Key Features

### 1. Horizontal Scrolling Feed
- Cards scroll horizontally (desktop and mobile)
- Smooth scroll with snap-to-card behavior
- Touch-friendly on mobile
- Hidden scrollbar for clean look

### 2. Responsive iPhone Mockup
- Shows actual app interface
- iPhone 17 Pro Max design
- Silver/titanium gradient styling
- Displays first 3 feed cards

### 3. Email Notifications
- Waitlist signups → Email to support@getrelevantapp.com
- Contact form → Email to support@getrelevantapp.com
- Powered by Resend API
- Verified sender: support@getrelevantapp.com in Resend Audiences

### 4. Accessibility
- Semantic HTML structure
- Focus states for keyboard navigation
- Alt text on images
- ARIA labels where needed

### 5. Performance
- Next.js Image optimization
- Static generation where possible
- Minimal JavaScript bundle
- Fast load times

---

## Content Strategy

### Tone & Voice
- **Confident, not arrogant**: "We built a feed that respects your time"
- **Problem-aware**: Acknowledges feeling behind, overwhelmed
- **Solution-focused**: Clear value props, no fluff
- **Personal**: Founder story creates connection
- **Time-conscious**: Emphasizes "5 minutes a day"

### Key Messages
1. **You're busy** - We respect your time
2. **News is overwhelming** - We make it digestible
3. **Context matters** - Every story explains why it's relevant
4. **No guilt** - Stay informed without FOMO
5. **Consistent habits** - Build knowledge daily

### Call-to-Actions
- Primary: "Get Early Access" / "Join Waitlist"
- Secondary: Pricing info, Instagram follow
- Tertiary: Contact form

---

## File Structure

```
/Users/akshitsama/Desktop/Website/
├── public/
│   ├── logo.svg (white logo, older version)
│   └── logo-black.svg (current black logo)
├── src/
│   ├── app/
│   │   ├── globals.css (main styles)
│   │   ├── layout.tsx (root layout)
│   │   ├── page.tsx (homepage component)
│   │   └── api/
│   │       ├── contact/
│   │       │   └── route.ts (contact form handler)
│   │       └── waitlist/
│   │           └── route.ts (waitlist handler)
├── .env.local (environment variables)
├── next.config.js (Next.js config)
├── tailwind.config.js (Tailwind config)
├── package.json (dependencies)
└── README.md (project docs)
```

---

## Known Issues & Limitations

### Email Delivery
- Using Resend sandbox domain (onboarding@resend.dev)
- Requires recipient email verification in Resend dashboard
- Microsoft 365 may delay/block sandbox emails
- Solution: Add custom domain (getrelevantapp.com) to Resend

### Waitlist Storage
- Currently uses email notifications only
- Optional Vercel KV integration available but not required
- No built-in waitlist management UI

### Mobile Optimization
- Feed cards optimized for horizontal scroll
- Phone mockup scales down on mobile (0.85x)
- All sections fully responsive

---

## Future Improvements to Consider

1. **Add custom domain to Resend** for reliable email delivery
2. **Waitlist management dashboard** to view/export signups
3. **Analytics integration** (Google Analytics, Vercel Analytics)
4. **A/B testing** for CTA copy and placement
5. **Testimonials section** once beta users are onboarded
6. **FAQ section** for common questions
7. **Blog/Resources** for SEO and content marketing
8. **Social proof** (signup count, user testimonials)
9. **Video demo** of the app in action
10. **Multi-language support** if expanding internationally

---

## Development Commands

```bash
# Install dependencies
npm install

# Run local dev server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod

# Push to GitHub
git add -A
git commit -m "Your message"
git push origin main
```

---

## Contact & Support
- **Email**: support@getrelevantapp.com
- **Instagram**: @relevant.app
- **Website**: https://www.getrelevantapp.com

---

*Last Updated: December 15, 2025*
