# Website Redesign — Implementation Plan

**Created:** March 7, 2026  
**Status:** Awaiting founder approval before execution  

---

## What this plan does

Takes your detailed feedback on every section of getrelevantapp.com and turns it into a step-by-step execution list. Each section below maps to your exact feedback, explains what changes, and flags anything I need your input on before I build.

---

## Git Status ✅

- Your local change (button link fix in `page.tsx`) is safely preserved
- Remote `main` is fully pulled — we're up to date
- All work will happen on a new branch: `website-redesign-v2`

---

## Section-by-Section Plan

### 1. HERO SECTION

**Your feedback:** The animation doesn't work in light/dark mode. Make it a funnel visual — three streams of text going into an engine, signals coming out. Better headline. Remove jargon like "entry flow, core loop, surface mix."

**What I'll change:**

| Item | Current | New |
|------|---------|-----|
| Hero animation | 14 chaotic floating headlines that converge into 3 signal cards (breaks in light mode) | **Funnel visualization**: 3 labeled input streams (news, reports, updates) flowing into a central "engine" shape, with clean signal cards emerging from the other side. Works in both themes. |
| Headline | "Know what changed before it changes your quarter." | **Options (pick one or I'll choose):** <br> A) "Every satisfying article, none of the noise." <br> B) "Your news. Filtered to what actually matters." <br> C) "Know what matters. Skip what doesn't." |
| Subtitle | Current technical language | Clear human language: what the app does in one sentence a friend would understand |
| Info cards | "Entry Flow / Core Loop / Surface Mix" labels | Replace with human terms: "4 questions to set up" / "Daily signals, not a feed" / "Read in 5 minutes" |
| Light/dark mode | Animation colors hardcoded, breaks in light mode | All colors use CSS variables (`var(--text)`, `var(--surface)`, etc.) so they adapt automatically |

**Questions for you:**
- Do you have a preference on the headline options above, or should I pick the best one?

---

### 2. INTERACTIVE SIGNAL — "Not a Headline, a Signal"

**Your feedback:** Replace the demo cards with REAL signal cards from the app. Connect to Supabase. Show actual current signals so visitors see something real.

**What I'll build:**

1. **New API route** (`/api/public-signals`): 
   - Calls a new Supabase Edge Function `public-signal-showcase` that reads recent signals from a **public showcase table** (not the user's protected `signal_items` table)
   - Returns 6–8 randomized recent signals with: headline, what_happened, why_it_matters, what_to_do, image, sources, impact type
   - Cached for 5 minutes to keep it fast, refreshes with new signals automatically

2. **New `public_signal_showcase` table** in Supabase:
   - A simple table that gets populated by a daily cron from anonymized/redacted recent signals
   - Contains: headline, what_happened, why_it_matters, what_to_do, image_url, sources, impact_type, signal_date
   - No user data, no user IDs — completely safe for public display
   - RLS: public read-only, service-role write-only

3. **Updated signal card design** on the website:
   - Matches the mobile app's card layout: image on top → impact badge → headline → synthesis
   - Tabs for "What Happened" / "Why It Matters" / "What To Do" (exactly like the app)
   - Sticky scroll effect: viewport locks, cards cycle through, then releases

**Questions for you:**
- Are you comfortable with showing anonymized real signals publicly? The signals would be general news (not personalized), so no user data is exposed.
- Should I create the Supabase table and edge function now, or do you want to seed it manually first?

---

### 3. HOW IT WORKS

**Your feedback:** Says "four questions" but only shows three. Add company name. Improve copy. Add privacy reassurance. Add sticky scroll effect.

**What I'll change:**

| Item | Current | New |
|------|---------|-----|
| Step 1 copy | "Four questions. Two minutes." but shows only 3 fields | **"Four questions. Two minutes."** with all 4 fields: Industry, Role, Company, Country |
| Visual | Missing company field | Add Company text input chip alongside the other 3 |
| Privacy note | None | Subtle line: "Your answers stay on your device. We never sell your data — we only use it to find what matters to you." |
| Copy tone | Technical/marketing | Apple-style user-centric: "Tell us what you do. We'll figure out what you need to know." |
| Scroll behavior | Normal scroll | **Sticky scroll**: viewport locks on this section, the 3 steps (setup → processing → your feed) animate through while user "scrolls," then releases to next section |

**Sticky scroll behavior (for sections 2, 3, and 4):**
- As user scrolls into a section, the section fills the viewport and "locks"
- Internal content transitions (cards change, steps advance, etc.) happen as user continues scrolling
- After all internal states are shown, the section "releases" and normal scrolling resumes
- This will use CSS `position: sticky` + Intersection Observer + scroll-linked progress

---

### 4. NOISE TO SIGNAL ANIMATION — "Thousands of articles every day"

**Your feedback:** Great concept, improve animation to match app aesthetic.

**What I'll change:**
- Refine the particle/counter animation to use the app's color palette and typography
- Make the source labels match real RSS source names from the app
- Ensure smooth light/dark mode transitions
- Add a subtle "engine" glow effect that matches the hero funnel visual

---

### 5. PHONE MOCKUP — "Open the app, five minutes, done"

**Your feedback:** Replace with actual app UI. Show real signal cards as they appear in the app.

**What I'll change:**
- Replace the current hand-coded mock feed cards with components that match the real app exactly:
  - Image on top with gradient overlay
  - Impact type badges (Competitive, Financial, Strategic, etc.)
  - Headline in the app's bold style
  - Synthesis preview text
  - Source count + story age metadata
- Use a **real iPhone 16 Pro frame** (proper bezels, Dynamic Island, rounded corners)
- Cards scroll within the phone frame
- Show real screenshots where possible (you have some in `public/` already)

---

### 6. FEATURE BENTO — "Inside the App"

**Your feedback:** Consequence map should match the app. Multi-source visual is unclear. Ask Deeper should use real app components. Replace "You're done, no infinite scroll" with podcasts/YouTube feature.

**What I'll change:**

| Card | Current | New |
|------|---------|-----|
| Consequence Map | Abstract chain animation | Match app's actual `ConsequenceChain` component: Event → Your Dimension → Consequence with real branching paths |
| Multi-Source | 5 overlapping cards (confusing) | Clean visual: show 3 source logos feeding into 1 unified signal card, with "3 sources verified" label |
| Ask Deeper | Generic chat bubbles | Match app's actual chat UI: user question bubble + AI response with the app's styling |
| Your Dimensions | 12 generic chips | Keep but use real dimension examples (e.g., "SaaS pricing trends", "Fed rate policy") |
| Goals | Progress ring | Keep, looks good |
| "You're Done" card | Finite feed checkmark | **REPLACE** with **"Listen & Watch"** card: Show podcast and YouTube icons with copy like "Some signals come with a matching podcast or video. Listen on your commute, watch when you have time. Found automatically — no searching required." |

---

### 7. PHONE SCREENSHOTS — "What it looks like"

**Your feedback:** Use real screenshots. Real iPhone mockup. Scrollable.

**What I'll build:**
- Horizontal carousel of real app screenshots in iPhone frames
- Screenshots needed (I'll use what exists in `public/` + you may need to provide more):
  - Feed view (`relevant-feed-mobile.png` ✅)
  - Signal detail (`relevant-signal-detail-mobile.png` ✅)
  - Goals (`relevant-goals-mobile.png` ✅)
  - Welcome/onboarding (`relevant-welcome.png` ✅)
  - Need: Ask AI chat screenshot, Consequence view screenshot
- Proper iPhone 16 Pro frame around each
- Smooth horizontal scroll with snap

**Question for you:**
- Can you take 2 more screenshots from the app? I need: (1) the Ask AI chat screen, (2) the consequence chain view. Drop them in `public/` and I'll wire them up. Or I can work with what we have.

---

### 8. WHO IT'S FOR

**Your feedback:** Good concept. More diversity and genuineness. Stop repeating the same marketing lines.

**What I'll change:**
- Rewrite all 6 persona cards with real, specific problems people face:
  - **The Student**: "I have 3 exams and a part-time job. I can't read the news for an hour. I need the 5 things that matter this week."
  - **The Founder**: "I missed a competitor's pivot because it was buried in my Twitter feed. Never again."
  - **The Executive**: "My team expects me to know what's happening. I can't admit I haven't read the news in a week."
  - **The Analyst**: "I track 12 sectors. Without filtering, I'd need 4 hours a day just on news."
  - **The Operator**: "Policy changes hit my work before I even hear about them. I need early warning."
  - **The Curious**: "I want to understand the world better, but I don't know where to start each morning."
- Remove generic "no infinite scroll" / "five minutes done" repetition
- Each card ends with what Relevant specifically does for that person

---

### 9. PRICING

**Your feedback:** Fine as-is. Minor copy improvement.

**What I'll change:**
- Keep the $4.99/month, 7-day free trial structure
- Improve the value bullet points to be more specific and human

---

### 10. APP LOGO

**Your feedback:** Logo is not on the website. Must work in light and dark mode.

**What I'll do:**
- The website already has `logo.svg` (white) and `logo-black.svg` in `public/`
- I'll ensure the nav and hero swap between them based on theme
- I'll also check the app's `icon.png` / `app_icon.png` and use the canonical version
- Verify favicon is correct and matches

---

### 11. GLOBAL COPY OVERHAUL

**Your feedback:** Everything should be human, Apple-style, user-centric. No jargon. No marketing fluff.

**Principles I'll follow for all copy:**
1. Write like you're explaining it to a smart friend, not a marketing audience
2. Every sentence must pass the "would a real person say this?" test
3. No buzzwords: no "leverage," no "unlock," no "empower"
4. Specific > vague: "4 questions" not "quick setup"; "7 signals this morning" not "curated feed"
5. If it doesn't help the visitor understand or decide, delete it

---

## Implementation Order

I'll execute in this order to minimize rework:

| Phase | What | Estimated Work |
|-------|------|----------------|
| **Phase 1** | Git branch + Logo + Global copy rewrite in `content.ts` | Small |
| **Phase 2** | Hero section: new funnel animation + headline + info cards | Medium |
| **Phase 3** | Sticky scroll infrastructure (reusable for multiple sections) | Medium |
| **Phase 4** | Interactive Signal: Supabase public table + Edge Function + API route + real cards | Large |
| **Phase 5** | How It Works: add Company field + privacy note + sticky scroll | Medium |
| **Phase 6** | Feature Bento: fix consequence map, multi-source, ask deeper, add podcast card | Medium |
| **Phase 7** | Phone Mockup: real iPhone frame + real card design | Medium |
| **Phase 8** | Screenshots carousel with real iPhone frames | Medium |
| **Phase 9** | Who It's For: rewrite personas | Small |
| **Phase 10** | Noise animation refinement + pricing polish | Small |
| **Phase 11** | Full light/dark mode audit + responsive testing | Medium |

---

## What I Need From You Before Starting

1. **Headline preference** — pick from the 3 options in Section 1, or tell me the vibe you want
2. **Public signals approval** — are you OK showing anonymized real signals on the website?
3. **Screenshots** — can you provide 2 more app screenshots (Ask AI chat + consequence chain)?
4. **Anything else** — any section where my plan doesn't match what you imagined?

---

## Risks

1. **Supabase public signals** — adds a new table and edge function. Low risk since it's read-only and isolated from user data, but it's new infrastructure.
2. **Sticky scroll** — can feel janky on older phones if not tuned carefully. I'll test thoroughly and add a graceful fallback.
3. **Real-time signals** — if the signal pipeline has a bad day and produces no signals, the website would show stale cards. I'll add a 24-hour fallback cache.

---

*In plain English: This plan rewrites every section of the website to feel real, human, and connected to the actual app — not like a marketing template. The biggest change is showing real signals from your backend so visitors see proof that this product works today.*
