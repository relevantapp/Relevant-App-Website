# Relevant - Website (Phase 1)

A clean, minimal landing page for Relevant - a personalized news feed app that cuts through the noise.

## 🎯 Purpose

This website is designed to:
- Explain what Relevant is in plain language
- Show the value proposition in seconds
- Collect emails for early access
- Build credibility and validate interest

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Deployment:** Vercel (free tier)
- **Email Collection:** Formspree

## 📋 Prerequisites

Before running this project, make sure you have:
- Node.js 18+ installed
- npm, yarn, or pnpm package manager

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Email Collection (Formspree)

1. Go to [Formspree.io](https://formspree.io) and create a free account
2. Create a new form and copy your form ID
3. Open `src/components/EmailForm.tsx`
4. Replace `YOUR_FORM_ID` on line 17 with your actual Formspree form ID:

```typescript
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
```

### 3. Update Social Links

Open `src/components/Footer.tsx` and update the social media links:
- Twitter/X: Line 39
- LinkedIn: Line 48
- GitHub: Line 57

Replace placeholder URLs with your actual social media profiles.

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📦 Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🎨 Design Philosophy

- **Minimal:** Clean, uncluttered design
- **Calm:** No heavy animations or distractions
- **Text-first:** Focus on clear messaging
- **Fast:** Optimized for performance

## 📄 Pages & Sections

### Home Page
- **Hero:** Main headline, value proposition, email signup
- **How It Works:** 3-step process explanation
- **Why Relevant:** Key benefits (No noise, No doom scrolling, Clear summaries)
- **Footer:** Email signup, social links, copyright

## 🎯 Current Status

- ✅ Domain purchased
- ✅ Website structure complete
- ✅ Vercel-ready
- ⏳ Email collection setup pending
- ⏳ Social links pending
- ⏳ App not public yet

## 📝 Customization

### Update Colors

Edit `tailwind.config.js` to change the color scheme:

```javascript
colors: {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#0f3460',
  highlight: '#e94560',
}
```

### Update Content

- Hero text: `src/components/Hero.tsx`
- How it works steps: `src/components/HowItWorks.tsx`
- Why Relevant benefits: `src/components/WhyRelevant.tsx`
- Footer: `src/components/Footer.tsx`

### Update Metadata

Edit `src/app/layout.tsx` to change SEO metadata:
- Title
- Description
- Keywords
- Open Graph tags

## 🔧 Build for Production

```bash
npm run build
npm run start
```

## 📊 Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout with metadata
│   └── page.tsx         # Home page
└── components/
    ├── EmailForm.tsx    # Email waitlist form
    ├── Hero.tsx         # Hero section
    ├── HowItWorks.tsx   # How it works section
    ├── WhyRelevant.tsx  # Why Relevant section
    └── Footer.tsx       # Footer with social links
```

## 🎯 Next Steps

1. Install Node.js if not already installed
2. Run `npm install` to install dependencies
3. Configure Formspree for email collection
4. Update social media links
5. Customize colors and content as needed
6. Deploy to Vercel
7. Connect your custom domain

## 📞 Support

For questions or issues, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Formspree Documentation](https://help.formspree.io)

## 📜 License

Copyright © 2025 Relevant. All rights reserved.
