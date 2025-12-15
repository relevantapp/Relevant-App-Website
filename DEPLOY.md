# DEPLOY TO VERCEL - Simple 3-Step Guide

Your website is ready to deploy! Follow these steps:

## Step 1: Push to GitHub

1. Go to https://github.com/new
2. Create a new repository (name it "relevant-website")
3. **Don't** initialize with README (you already have one)
4. Click "Create repository"

Then run these commands in Terminal:

```bash
cd /Users/akshitsama/Desktop/Website
git init
git add .
git commit -m "Initial commit - Relevant landing page"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/relevant-website.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy to Vercel

1. Go to https://vercel.com/signup
2. Sign up/login with GitHub
3. Click "Add New..." → "Project"
4. Import your `relevant-website` repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"

**That's it!** Vercel will build and deploy your site in ~2 minutes.

## Step 3: Set Up Email Collection (After Deploy)

1. Go to https://formspree.io/register
2. Create a free account
3. Click "New Form"
4. Name it "Relevant Waitlist"
5. Copy your Form ID (looks like: `xyzabc123`)
6. In your GitHub repository, edit `src/components/EmailForm.tsx`
7. On line 17, replace `YOUR_FORM_ID` with your actual ID
8. Commit and push - Vercel will auto-redeploy

## Optional: Add Custom Domain

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow Vercel's DNS instructions

---

## Quick Reference

- **Your code:** /Users/akshitsama/Desktop/Website
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Formspree:** https://formspree.io
- **GitHub:** https://github.com

Need help? The README.md file has more detailed instructions.
