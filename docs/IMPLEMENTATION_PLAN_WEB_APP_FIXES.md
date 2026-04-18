# Web App Fixes — Detailed Implementation Plan

> **Scope**: Post-sign-in web app experience. NOT the marketing landing page.
> **Goal**: Make the web app as resilient, polished, and feature-complete as the mobile app.

---

## Table of Contents

1. [Workstream A: Auth & Onboarding Resilience](#workstream-a-auth--onboarding-resilience)
2. [Workstream B: Welcome Email](#workstream-b-welcome-email)
3. [Workstream C: Web App Experience Fixes](#workstream-c-web-app-experience-fixes)
4. [Workstream D: Topic Add + Signal Backfill](#workstream-d-topic-add--signal-backfill)
5. [Acceptance Criteria (All)](#acceptance-criteria)
6. [Testing Checklist](#testing-checklist)

---

## Workstream A: Auth & Onboarding Resilience

### A1: Handle Registered-But-Not-Onboarded Users

**Problem**: If a user signs up, verifies email, but closes the browser before completing onboarding, the web app doesn't gracefully resume. The user is stuck or sees wrong screens.

**Root Cause**: `AuthGuard.tsx` checks `needsOnboarding` but the onboarding page (`/onboarding`) doesn't persist step progress. If a user returns, they restart from step 1 — which is acceptable — but the routing must always land them on `/onboarding` if `onboarding_completed_at IS NULL`.

**Files to Change**:
- `src/context/AuthContext.tsx` — Ensure `needsOnboarding` is always checked from DB on bootstrap
- `src/components/app/AuthGuard.tsx` — Ensure routing handles all edge cases
- `src/app/login/page.tsx` — After login, if `needsOnboarding`, route to `/onboarding` not `/app/feed`

**Implementation Steps**:

1. **AuthContext.tsx — Bootstrap improvement**:
   - In the bootstrap `useEffect`, after getting session + confirming email:
     - Query `users` table for `onboarding_completed_at`
     - If `onboarding_completed_at IS NULL`, set `needsOnboarding = true`
     - This already happens in `fetchProfileName()` — verify it runs on every bootstrap path
   - In `signIn()`:
     - After successful sign-in, check `needsOnboarding` before routing
     - Do NOT auto-redirect to `/app/feed` — let AuthGuard handle routing

2. **AuthGuard.tsx — Add missing route case**:
   - Current gap: User logs in → `needsOnboarding = true` → but `signIn()` in login page does `router.push('/app/feed')` before AuthGuard can redirect
   - Fix: Remove `router.push('/app/feed')` from login page's `handleSubmit`. Instead, after successful `signIn()`, just let the auth state update trigger AuthGuard re-evaluation
   - AuthGuard must handle: authenticated + needsOnboarding + not on `/onboarding` → redirect to `/onboarding`

3. **Login page — Remove hard redirect**:
   - In `src/app/login/page.tsx`, after `signIn()` success, don't push to `/app/feed`
   - Instead, set a loading state and let AuthGuard's routing logic take over
   - AuthGuard will send them to `/onboarding` if needed, or `/app/feed` if onboarded

4. **Signup page — Same pattern**:
   - After `signUp()` success, push to `/verify-email` (this is correct already)
   - After `verifySignUp()` in verify-email page, don't push to `/onboarding` directly — let AuthGuard handle it

**Acceptance Criteria**:
- [ ] User signs up, verifies email, closes browser → logs in again → lands on `/onboarding` (not feed)
- [ ] User completes onboarding → logs out → logs in → lands on `/app/feed`
- [ ] User signs up on web, closes mid-onboarding → opens mobile app → mobile shows onboarding
- [ ] User signs up on mobile, completes onboarding → logs in on web → sees feed (not onboarding)

---

### A2: OTP Paste Button

**Problem**: No visible "Paste" button on the OTP verification screen. Users must manually paste or type each digit. The paste handler exists in code (`handlePaste`) but there's no explicit "Paste from clipboard" button.

**Files to Change**:
- `src/app/verify-email/page.tsx`

**Implementation Steps**:

1. **Add a "Paste Code" button** above or below the OTP input fields:
   ```
   [📋 Paste Code]
   ```
2. **Button handler**:
   - Read from clipboard: `navigator.clipboard.readText()`
   - Strip non-digits, take first 8 characters
   - Fill all 8 digit fields
   - Auto-focus the last filled field
   - If clipboard is empty or doesn't contain digits, show a brief tooltip "No code found in clipboard"
3. **Clipboard permission**:
   - Wrap in try-catch — clipboard API requires HTTPS or localhost
   - If `navigator.clipboard` is undefined (old browsers), hide the paste button entirely
   - Handle permission denial gracefully (show "Paste not available" hint)
4. **Styling**:
   - Small, subtle button below the digit inputs
   - Use secondary/ghost button style consistent with the page design
   - Icon: clipboard icon (use inline SVG or existing icon system)

**Acceptance Criteria**:
- [ ] "Paste Code" button is visible on the OTP screen (desktop and mobile)
- [ ] Clicking it reads clipboard content and fills all 8 digit fields
- [ ] If clipboard has no valid code, shows a non-blocking feedback message
- [ ] Button is hidden if clipboard API is unavailable
- [ ] Existing keyboard paste (Ctrl+V / Cmd+V) still works as before

---

### A3: OTP Screen Cutting on Mobile

**Problem**: The OTP verification screen is not fully visible on mobile devices — content is cut off or overflows.

**Files to Change**:
- `src/app/verify-email/page.tsx` (layout/styling)
- Possibly `src/app/globals.css`

**Implementation Steps**:

1. **Diagnose the exact issue**:
   - Open `http://localhost:3000/verify-email` in mobile viewport (375×667, 390×844)
   - Screenshot to identify what's cut off (likely the bottom buttons or the OTP inputs)
   
2. **Likely fixes**:
   - The verify-email page likely uses `min-h-screen` or `h-screen` which doesn't account for mobile browser chrome (address bar, bottom bar)
   - Replace `h-screen` with `min-h-[100dvh]` (dynamic viewport height)
   - Ensure the OTP input row wraps or shrinks on narrow screens (8 inputs at full size may overflow at 375px)
   - Add `overflow-y-auto` to the main container so content scrolls if needed
   - Reduce horizontal padding on mobile
   - Ensure the digit inputs have smaller width on mobile (e.g., `w-10 sm:w-12`)

3. **Test across viewports**:
   - iPhone SE (375×667)
   - iPhone 14 Pro (393×852)
   - Small Android (360×640)
   - Landscape mobile

**Acceptance Criteria**:
- [ ] OTP screen fully visible on iPhone SE (375px wide) without content cut off
- [ ] All 8 digit inputs fit within the viewport without horizontal scroll
- [ ] Submit button and "Resend code" link visible without scrolling on standard phones
- [ ] Page uses `100dvh` for proper mobile viewport handling

---

### A4: Country Selector — US, Canada, India Only

**Problem**: The onboarding country selector shows 20 countries. It should only show US, Canada, and India (matching the mobile app).

**Files to Change**:
- `src/app/onboarding/page.tsx` — The country list is hardcoded in this file

**Implementation Steps**:

1. **Find the country array** in `onboarding/page.tsx` (currently 20 countries)
2. **Replace with 3 countries only**:
   ```ts
   const COUNTRIES = [
     { code: 'US', name: 'United States' },
     { code: 'CA', name: 'Canada' },
     { code: 'IN', name: 'India' },
   ];
   ```
3. **Update the dropdown UI**: With only 3 options, consider switching from a dropdown to radio buttons or a simple button group for faster selection
4. **Verify the ISO code format**: Mobile app uses 2-letter ISO codes (US, CA, IN). Web currently uses 3-letter codes (verify and standardize)

**Acceptance Criteria**:
- [ ] Only US, Canada, India appear in the country selector
- [ ] Selected country code format matches what the backend expects (2-letter ISO)
- [ ] Country step works correctly and passes data to profile update

---

### A5: AI Passage — UX Overhaul

**Problem**: Multiple issues with the AI passage step (Step 5 of onboarding):
1. "Regenerate" is a hidden/secondary action — should be the primary button
2. The generated text quality is poor
3. After regenerating, clicking "Create Account" restarts the entire onboarding flow instead of proceeding
4. Regenerate should only work when the user has written text in the feedback box
5. Need two clear CTAs: "Regenerate" (primary) and "Looks good, sign up" / "Skip and sign up" (secondary)

**Files to Change**:
- `src/app/onboarding/page.tsx` — Step 5 (AI Preview step) UI and logic
- `supabase/functions/pro-passage-preview/index.ts` — Prompt quality (Relevant repo)

**Implementation Steps**:

1. **Restructure the Step 5 buttons**:
   - **Primary button (filled, prominent)**: "✨ Regenerate" — only enabled when the user has written feedback in the text area
   - **Secondary button**: "Looks good, sign up" — always enabled, submits the current passage and profile
   - **Tertiary/link button**: "Skip" — skips the passage entirely and creates the account
   - Layout: Stack vertically on mobile, horizontal on desktop
   - When no text is in the feedback box, the Regenerate button should be visually disabled with a hint like "Write what to change above"

2. **Fix the post-submit redirect bug**:
   - Currently, after "Create Account" is clicked, the onboarding flow restarts
   - Root cause investigation: Check if `markOnboardingComplete()` + `updateProfile()` in the completion handler are both succeeding
   - The completion handler should:
     1. Call `updateProfile()` with all onboarding data including `onboarding_completed_at: new Date().toISOString()`
     2. Wait for success
     3. Transition to a "Creating your account..." animation screen (like mobile's SignalForge)
     4. NOT route back to `/onboarding` step 1

3. **Add SignalForge-style wait screen**:
   - After account creation, show a dedicated animation screen with:
     - "Building your intelligence feed..." heading
     - Animated progress indicator (similar to mobile's SignalForge screen)
     - Informational copy: "We're analyzing your profile and finding signals that matter to you. This usually takes 30-60 seconds."
   - Poll for readiness: Query `signal_items` table for items created after `onboarding_completed_at`
   - When signals are ready, auto-navigate to `/app/feed`
   - If user closes browser during this, they should see this screen again on next login (see A6)

4. **Improve the AI passage prompt** (in `pro-passage-preview/index.ts`):
   - Current prompt asks for 2 sentences, 28-44 words — this is fine structurally
   - Improve the system prompt to produce more engaging, specific output:
     - Include the user's specific industry verticals and role responsibilities
     - Reference concrete market forces and competitive dynamics relevant to their position
     - Make it feel like "this app really gets what I do" not generic
   - Add examples in the prompt for each profile_kind (executive, investor, operator, analyst, general)
   - Ensure the passage references the user's company if provided

5. **Regenerate behavior**:
   - When user types feedback in the text area and clicks Regenerate:
     - Send the feedback as `profile_context_note` to `pro-passage-preview`
     - Show loading spinner on the Regenerate button
     - Stream the new passage (replace old one with animation)
     - Keep the feedback text visible so user can iterate
   - If feedback box is empty, Regenerate button is disabled (greyed out)
   - Limit: Max 3 regenerations per session (prevent abuse)

**Acceptance Criteria**:
- [ ] "Regenerate" is the primary (most prominent) button on the AI passage step
- [ ] "Looks good, sign up" is clearly visible as secondary action
- [ ] "Skip" is available as a text link
- [ ] Regenerate is disabled when the feedback text area is empty
- [ ] Regenerate sends the feedback text to the backend and streams a new passage
- [ ] After clicking "Looks good, sign up", user sees a "Building your feed..." animation screen
- [ ] The animation screen polls for signals and auto-navigates to feed when ready
- [ ] Clicking "Create Account" does NOT restart the onboarding flow
- [ ] Generated passage text is specific to the user's industry, role, and company
- [ ] Max 3 regenerations per onboarding session

---

### A6: Signup Flow Resilience (Browser Close & Cross-Device)

**Problem**: If the user closes the browser during account creation (while influence dimensions are being computed), the state is lost. On the mobile app, this is handled gracefully — the web must match.

**Files to Change**:
- `src/context/AuthContext.tsx` — Add signal forge tracking
- `src/components/app/AuthGuard.tsx` — Add signal-forge-pending route
- New file: `src/app/app/building/page.tsx` — Signal forge wait screen
- New file: `src/hooks/useSignalForgeReadiness.ts` — Polling hook
- New file: `src/lib/signalForgeSession.ts` — localStorage tracking

**Implementation Steps**:

1. **Create signal forge session tracking** (`src/lib/signalForgeSession.ts`):
   - Mirror mobile's `utils/signalForgeSession.ts`
   - Store in localStorage: `@relevant_signal_forge_pending_v1:{userId}`
   - Value: `{ startedAt: ISO timestamp }`
   - Functions: `markSignalForgePending(userId)`, `clearSignalForgePending(userId)`, `isSignalForgePending(userId)`

2. **Create signal forge readiness hook** (`src/hooks/useSignalForgeReadiness.ts`):
   - Mirror mobile's `utils/signalForgeReadiness.ts`
   - Function: `isSignalForgeBackendReady(userId)`:
     - Query `signal_items` for count where `user_id = userId` and `created_at > onboarding_completed_at`
     - If count > 0, return `true`
     - Otherwise return `false`
   - Hook polls every 5 seconds when active
   - Returns: `{ isReady: boolean, isPolling: boolean }`

3. **Create the building/wait screen** (`src/app/app/building/page.tsx`):
   - Shows animated progress (e.g., pulsing brain icon, progress bar, or orbiting dots)
   - Copy: "Building your intelligence feed..." / "We're finding signals that matter to your role."
   - Informational steps showing what's happening:
     - ✓ Profile saved
     - ⏳ Computing your influence dimensions...
     - ⏳ Finding relevant signals...
   - Uses `useSignalForgeReadiness` hook to poll
   - When ready: navigate to `/app/feed` with a success toast
   - If user has been waiting > 3 minutes: Show "This is taking longer than usual. You can close this tab and we'll have your feed ready when you come back."

4. **Update AuthContext bootstrap**:
   - On bootstrap, after getting session + confirming onboarding is complete:
     - Check `isSignalForgePending(userId)` from localStorage
     - If pending: check `isSignalForgeBackendReady(userId)`
       - If ready: clear pending, continue to feed
       - If not ready: set state so AuthGuard routes to `/app/building`
   - New state variable: `isSignalForgeInProgress: boolean`

5. **Update AuthGuard routing**:
   - Add new route rule: If `isSignalForgeInProgress` and not on `/app/building` → redirect to `/app/building`
   - Add `/app/building` to protected paths (requires auth)

6. **Update onboarding completion flow**:
   - After `updateProfile()` succeeds and `markOnboardingComplete()` is called:
     - Call `markSignalForgePending(userId)` to write to localStorage
     - Set `isSignalForgeInProgress = true` in AuthContext
     - Navigate to `/app/building`

7. **Cross-device handling**:
   - If user signs up on web and closes during signal forge:
     - Mobile app: When user logs in, mobile's own `isSignalForgeBackendReady()` check will show the correct state (this already works because it checks the DB, not web localStorage)
   - If user signs up on mobile and logs in on web:
     - Web bootstrap checks `onboarding_completed_at` (not null = onboarded)
     - Then checks if signals exist — if none, shows building screen
     - If signals exist, shows feed
   - Key insight: The source of truth is the DB (`onboarding_completed_at` + `signal_items` count), not localStorage. localStorage is just a faster hint.

**Acceptance Criteria**:
- [ ] After onboarding completion, user sees an animated "building your feed" screen
- [ ] The building screen polls and auto-navigates to feed when signals are ready
- [ ] User closes browser during building → reopens → sees building screen (resumes polling)
- [ ] User closes browser during building → opens mobile app → mobile shows correct state
- [ ] User completes onboarding on mobile → logs in on web → sees feed directly
- [ ] Building screen shows progress feedback (not just a spinner)
- [ ] After 3 minutes of waiting, user sees a reassurance message
- [ ] Signal forge pending state is cleared once signals are detected

---

## Workstream B: Welcome Email

### B1: Welcome Email on Account Creation

**Problem**: No welcome email is sent when a user creates an account. The system has email infrastructure (Resend API, `pro-email-brief`) but no welcome email template.

**Files to Change**:
- New file: `supabase/functions/pro-welcome-email/index.ts` (Relevant repo)
- New file: `supabase/functions/pro-welcome-email/email-template.ts` (Relevant repo)
- Modify: DB trigger or `pro-influence-compute` to call welcome email after signup

**Implementation Steps**:

1. **Create the welcome email edge function** (`supabase/functions/pro-welcome-email/index.ts`):
   - Triggered after `onboarding_completed_at` is set (not on raw signup — we want to email after they've told us about themselves)
   - Input: `{ user_id: string }`
   - Flow:
     1. Fetch user profile from `users` table (name, email, industry, role, company)
     2. Build personalized email using template
     3. Send via Resend API (same pattern as `pro-email-brief`)
   - Auth: Service role (called by system, not user)

2. **Create the email template** (`pro-welcome-email/email-template.ts`):
   - Subject: "Welcome to Relevant — Your intelligence feed is being built"
   - Template structure:
     ```
     [Relevant Logo]
     
     Hi {first_name},
     
     Welcome to Relevant. We've understood your context:
     
     → {role} at {company} in {industry}
     
     Here's what happens next:
     
     1. We're building your influence dimensions — the topics, companies, 
        and forces that affect your specific role.
     2. Your first intelligence brief will be ready within a few minutes.
     3. Every day, we'll surface what changed and why it matters to you.
     
     What to expect:
     • Signals — not news. Each one explains why it matters to YOUR role.
     • Consequence chains — how a change ripples to affect your work.
     • Daily intelligence — the 3-5 things you actually need to know.
     
     Open Relevant → {app_url}
     
     — The Relevant Team
     ```
   - Use the same responsive HTML email structure as `pro-email-brief/email-templates.ts`
   - Dark theme email with brand colors
   - Reuse shared Resend API integration pattern

3. **Trigger the welcome email**:
   - Option A: Add to `pro-influence-compute` — after compute completes, call `pro-welcome-email`
   - Option B (preferred): Add a second DB trigger on `onboarding_completed_at` update → invokes `pro-welcome-email`
   - Use `invoke_edge_function()` pattern (not direct fetch)

4. **Migration** (if using DB trigger approach):
   - Create migration: `supabase/migrations/YYYYMMDDHHMMSS_welcome_email_trigger.sql`
   - Trigger: `AFTER UPDATE OF onboarding_completed_at ON public.users WHEN (OLD.onboarding_completed_at IS NULL AND NEW.onboarding_completed_at IS NOT NULL)`
   - Calls: `invoke_edge_function('pro-welcome-email', jsonb_build_object('user_id', NEW.id::text))`

**Acceptance Criteria**:
- [ ] User completes onboarding → receives welcome email within 60 seconds
- [ ] Email is personalized with user's name, role, company, industry
- [ ] Email has a clear CTA to open the app
- [ ] Email renders correctly on Gmail, Outlook, Apple Mail (mobile + desktop)
- [ ] Email uses Relevant brand styling (dark theme, clean typography)
- [ ] Welcome email is sent exactly once per user (not on profile updates)
- [ ] Email does NOT send on raw signup (only after onboarding completion)

---

## Workstream C: Web App Experience Fixes

### C1: Missing Images on Web

**Problem**: Some signal cards or dimension tiles show no images where they should.

**Files to Change**:
- `src/components/app/SignalCard.tsx` — Add image fallback
- `src/app/app/feed/page.tsx` — Verify image URLs are loaded
- `src/app/app/search/page.tsx` — Dimension tile image fallback

**Implementation Steps**:

1. **Diagnose the issue**:
   - Check if `imageUrl` is null/undefined in the signal data
   - Check if the URL exists but is broken (CORS, expired, 404)
   - Check if images are in the DB but not being selected in the query

2. **Add fallback for missing images** in `SignalCard.tsx`:
   - If `imageUrl` is null/empty: Show a gradient placeholder with the signal's consequence type color
   - If image fails to load (`onError`): Show the same gradient placeholder
   - Placeholder design: Subtle gradient matching the signal type (competitive=coral, opportunity=teal, risk=amber, strategic=violet) with a small icon

3. **Add fallback for search dimension tiles**:
   - If tile has no image: Show a colored background with the dimension type icon
   - Use the same color system as consequence types

4. **Verify image loading**:
   - Ensure the query for `signal_items` includes `image_url` field
   - Check if there's an image proxy or CDN issue
   - Add `loading="lazy"` to all signal card images for performance

**Acceptance Criteria**:
- [ ] Every signal card shows either a real image or a styled placeholder — never a blank/broken space
- [ ] Image load errors are caught and replaced with placeholder
- [ ] Search dimension tiles show visual content even without images
- [ ] Images load lazily for better performance

---

### C2: Line Flicker on Card Hover

**Problem**: When hovering over signal cards on the web, there's a weird visual line flicker.

**Files to Change**:
- `src/components/app/SignalCard.tsx` — Hover animation
- `src/app/globals.css` — GPU hints

**Implementation Steps**:

1. **Identify the flicker source**:
   - The card uses both Framer Motion (`whileHover={{ y: -2 }}`) AND CSS transitions (`hover:shadow-lg`, `group-hover:scale-[1.03]` on image)
   - These two animation systems can fight each other, causing frame drops

2. **Fix approach — unify animation system**:
   - Option A: Remove Framer Motion hover, use pure CSS:
     ```css
     .signal-card {
       transition: transform 200ms ease-out, box-shadow 200ms ease-out;
     }
     .signal-card:hover {
       transform: translateY(-2px);
       box-shadow: 0 8px 30px rgba(0,0,0,0.12);
     }
     ```
   - Option B: Keep Framer Motion but remove CSS `transition-all` (use `transition-shadow` only)
   - **Recommended**: Option A — pure CSS is smoother for simple hover effects

3. **Ensure GPU acceleration**:
   - Add `will-change: transform` to the card element
   - Use `transform: translateZ(0)` as base state to force GPU compositing
   - This prevents the browser from re-laying out on hover

4. **Fix the image zoom**:
   - Use `transform: scale(1.03)` with `transition: transform 500ms ease-out`
   - Ensure the image container has `overflow: hidden` and `will-change: transform`

**Acceptance Criteria**:
- [ ] Hovering over a signal card produces a smooth, flicker-free animation
- [ ] Card lifts slightly and shadow appears without any visual artifacts
- [ ] Hero image zooms smoothly on hover
- [ ] No layout shifts or reflows during hover
- [ ] Works smoothly on 60fps and 120fps displays

---

### C3: Opportunity and Risk Not Working

**Problem**: The Opportunity and Risk filter tabs in the feed don't show results.

**Files to Change**:
- `src/app/app/feed/page.tsx` — Filter logic
- Possibly the data query that fetches signals

**Implementation Steps**:

1. **Diagnose**:
   - Check what filter value is sent for "Opportunity" and "Risk" tabs
   - Check the `signal_items` table structure — how are consequence types stored?
   - Check if the query filters on `consequence_type` or a JSON field
   - Compare with mobile app filter logic

2. **Likely issue**:
   - The consequence type might be stored in a nested JSON structure (e.g., `consequences[].type`)
   - The filter might be looking for a top-level field that doesn't exist
   - Or the field name might differ between what the web expects and what the DB stores

3. **Fix**:
   - Align the web's filter query with how the mobile app queries for opportunity/risk signals
   - The mobile app likely filters on `signal_items.consequences` JSONB array
   - Update the web's Supabase query to match

4. **Verify data exists**:
   - Run a manual query to check if any signals have opportunity/risk consequence types in the DB for the test user
   - If no data: the issue is upstream (signal generation, not filtering)

**Acceptance Criteria**:
- [ ] Clicking "Opportunity" tab shows signals with opportunity consequences
- [ ] Clicking "Risk" tab shows signals with risk consequences
- [ ] Filter counts next to tab labels are accurate
- [ ] Switching between filter tabs is instant (no unnecessary re-fetch)

---

### C4: Stats Card — Too Large, Doesn't Match Mobile

**Problem**: The top stats card on the web feed is oversized and doesn't show the same data or interactions as the mobile app's header.

**Files to Change**:
- `src/app/app/feed/page.tsx` — Stats card section
- `src/components/app/FeedStatsSheet.tsx` — Bottom sheet content
- Possibly new component for compact stats header

**Implementation Steps**:

1. **Redesign the stats header to match mobile**:
   - Mobile pattern: Compact horizontal bar with 3-4 key stats
     - Time saved (hours)
     - Stories (count)
     - Sources (count)
     - Active days indicator
   - Each stat is tappable → opens a bottom sheet with detailed breakdown
   - Web currently: Large card that takes up too much vertical space

2. **Create a compact stats bar**:
   - Single horizontal row with stats as pill-shaped items
   - Height: ~60-80px max (currently much taller)
   - Desktop: All stats in one row
   - Mobile: Scrollable horizontal or stacked 2×2 grid
   - Each stat: icon + value + label (e.g., "⏱ 4.2h saved")

3. **Match the bottom sheet interactions**:
   - Tapping a stat on mobile opens a bottom sheet with:
     - Daily activity chart (bar chart, Mon-Sun)
     - Type breakdown (Escalating, Developing, etc.)
     - Publisher stats
   - The web's `FeedStatsSheet` already has this data — just wire the click handlers
   - Each stat pill should open the relevant section of FeedStatsSheet

4. **Show the same data as mobile**:
   - Verify the stats calculation matches mobile exactly:
     - Time saved = `(sourceCount * 4.5) / 60` hours
     - Stories = unique signal count in 7 days
     - Sources = total source doc count
     - Active days = days with at least 1 signal
   - Verify the data is fetched from the same table with the same query

**Acceptance Criteria**:
- [ ] Stats bar is compact (max 80px tall on desktop)
- [ ] Shows same stats as mobile: time saved, stories, sources
- [ ] Each stat is clickable → opens bottom sheet with details
- [ ] Bottom sheet shows daily activity chart and type breakdown
- [ ] Data matches what the mobile app shows for the same user
- [ ] Responsive: looks good on mobile web and desktop

---

### C5: Share Button on Web

**Problem**: No way to share signals from the web app. Mobile has native share.

**Files to Change**:
- `src/app/app/signal/[id]/page.tsx` — Signal detail page
- `src/components/app/SignalCard.tsx` — Feed card (optional share icon)
- New component: `src/components/app/ShareButton.tsx`

**Implementation Steps**:

1. **Create a ShareButton component**:
   - Uses Web Share API (`navigator.share()`) on mobile browsers
   - Falls back to "Copy link" on desktop browsers
   - Share data:
     - Title: Signal headline
     - Text: Signal synthesis (first 100 chars)
     - URL: `https://www.getrelevantapp.com/signal/{signal_id}` (public share URL)

2. **Add to signal detail page**:
   - Top-right corner or in the header bar
   - Icon: share icon (arrow-up-from-square or similar)
   - On click: trigger share or copy
   - Show confirmation toast: "Link copied!" or "Shared!" 

3. **Add to signal card** (optional, subtle):
   - Small share icon in the meta row (bottom of card)
   - Only visible on hover (desktop) or always visible (mobile)

4. **Copy-to-clipboard fallback**:
   ```ts
   async function shareSignal(signal: Signal) {
     const url = `https://www.getrelevantapp.com/signal/${signal.id}`;
     if (navigator.share) {
       await navigator.share({ title: signal.headline, text: signal.synthesis, url });
     } else {
       await navigator.clipboard.writeText(url);
       showToast('Link copied to clipboard');
     }
   }
   ```

5. **Ensure the public share URL works**:
   - Verify `/signal/[id]` route renders publicly (no auth required)
   - This route already exists in the Website repo — verify it loads signal data for unauthenticated users

**Acceptance Criteria**:
- [ ] Share button visible on signal detail page
- [ ] Mobile web: Uses native share sheet (Web Share API)
- [ ] Desktop: Copies link to clipboard with confirmation toast
- [ ] Shared URL is a valid public link that renders the signal
- [ ] Share button is discoverable but not intrusive

---

## Workstream D: Topic Add + Signal Backfill

### D1: Topic Add with Signal Backfill

**Problem**: When a user adds a topic through the web app's search/explore page, it should genuinely add the topic to their influence dimensions and trigger a backfill to find existing relevant content.

**Files to Change**:
- `src/app/app/search/page.tsx` — Add topic UI
- Backend: `supabase/functions/pro-org-manage/org-actions.ts` or separate endpoint (Relevant repo)
- Backend: Wire topic addition to `pro-influence-compute` or `pro-matcher-backfill`

**Implementation Steps**:

1. **Frontend — Improve the "Add dimension" flow**:
   - When user adds a topic/company/person from the search page:
     - Show a brief animation/toast: "Adding [topic]... Finding relevant signals"
     - Indicate that signals are being searched in the background
     - After a few seconds, show a count: "Found 3 signals related to [topic]" or "No signals yet — we'll find relevant content soon"

2. **Backend — Wire topic add to backfill**:
   - Current: `add_topic` in `pro-org-manage` only upserts to `org_shared_topics`
   - Needed: After upserting the topic, also:
     1. Add/update the topic in `pro_influence_dimensions` for the user (if personal, not org)
     2. Call `pro-matcher-backfill` to re-match recent articles against the new dimension
     3. This ensures signals appear for the new topic within minutes, not at the next cron cycle
   - For personal topics (non-org), create a new endpoint or action that:
     - Adds dimension to `pro_influence_dimensions`
     - Triggers `pro-matcher-backfill` for that specific dimension
     - Returns the count of matched signals

3. **Frontend — Show backfill progress**:
   - After adding a topic, poll for new signals related to that topic
   - Show inline progress in the dimension tile: "Searching..." → "3 signals found"
   - If no signals found: "No signals yet — we'll keep watching"

**Acceptance Criteria**:
- [ ] User can add a topic from the search page
- [ ] After adding, a backfill is triggered on the backend
- [ ] User sees feedback that signals are being searched
- [ ] New signals related to the topic appear within 2-3 minutes
- [ ] If no signals exist, user sees a clear message
- [ ] The new topic appears in the user's dimension list

---

## Acceptance Criteria

### Global Acceptance Criteria (applies to ALL changes)

- [ ] All changes pass TypeScript typecheck (`npx tsc --noEmit`)
- [ ] All changes pass ESLint (`npx eslint .`)
- [ ] No console errors in browser dev tools
- [ ] No regressions in existing functionality
- [ ] Responsive: works on mobile (375px), tablet (768px), and desktop (1440px)
- [ ] Dark and light themes both work correctly
- [ ] Loading states shown for all async operations
- [ ] Error states shown for all failure scenarios
- [ ] No broken links or dead routes

---

## Testing Checklist

### Auth & Onboarding Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Fresh signup complete flow | Sign up → Verify email → Complete onboarding → See building screen → See feed | User lands on feed with signals |
| 2 | Signup then close browser | Sign up → Verify email → Start onboarding → Close browser → Reopen → Login | User lands on onboarding (not feed) |
| 3 | Close during signal build | Complete onboarding → See building screen → Close browser → Reopen → Login | User sees building screen → then feed when ready |
| 4 | Cross-device: web to mobile | Sign up on web → Close during building → Open mobile app → Login | Mobile shows signal forge / building screen |
| 5 | Cross-device: mobile to web | Complete full onboarding on mobile → Login on web | Web shows feed directly |
| 6 | OTP paste | Sign up → Go to verify email → Copy code from email → Click "Paste Code" | All 8 digits filled automatically |
| 7 | OTP mobile viewport | Open verify-email on iPhone SE | All inputs visible, no overflow |
| 8 | Country selector | Open onboarding → reach country step | Only US, Canada, India shown |
| 9 | AI passage regenerate | Reach AI step → Type feedback → Click Regenerate | New passage generated, stays on step 5 |
| 10 | AI passage - empty feedback | Reach AI step → Don't type anything | Regenerate button is disabled |
| 11 | AI passage - create account | Reach AI step → Click "Looks good, sign up" | Proceeds to building screen (NOT restart) |
| 12 | Already onboarded login | User with completed onboarding → Login | Goes directly to feed |

### Web App Experience Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 13 | Missing images | Load feed with signals that have no imageUrl | Gradient placeholder shown, not blank |
| 14 | Card hover | Hover over a signal card in feed | Smooth lift + shadow, no flicker |
| 15 | Opportunity filter | Click "Opportunity" tab in feed | Shows only opportunity signals, correct count |
| 16 | Risk filter | Click "Risk" tab in feed | Shows only risk signals, correct count |
| 17 | Stats card size | Load feed page | Stats bar is compact (~80px), not dominating the page |
| 18 | Stats click | Click on a stat (time saved / stories) | Bottom sheet opens with details |
| 19 | Share - detail page | Open a signal → Click share | Link copied or native share sheet |
| 20 | Share - URL works | Open shared URL in incognito | Signal renders without auth |
| 21 | Topic add | Go to search → Add a new topic | Topic appears, backfill starts, signals found |

### Email Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 22 | Welcome email sent | Complete full onboarding | Email received within 60s |
| 23 | Welcome email content | Open welcome email | Personalized with name, role, company |
| 24 | Welcome email renders | Open in Gmail + Outlook + Apple Mail | Looks correct in all clients |
| 25 | No duplicate emails | Complete onboarding, then update profile | Only 1 welcome email ever sent |

---

## Implementation Priority & Dependencies

### Phase 1 — Critical Path (Do First)
These are the highest-impact, most user-visible fixes:

1. **A1** — Registered-but-not-onboarded handling
2. **A5** — AI passage UX overhaul (includes the restart bug fix)
3. **A6** — Signup flow resilience + building screen
4. **A4** — Country selector (quick fix)
5. **A3** — OTP mobile responsive (quick fix)
6. **A2** — OTP paste button (quick fix)

### Phase 2 — Web App Polish
7. **C4** — Stats card redesign
8. **C2** — Line flicker fix
9. **C1** — Missing images fallback
10. **C3** — Opportunity/Risk filter fix
11. **C5** — Share button

### Phase 3 — Backend & Email
12. **B1** — Welcome email
13. **D1** — Topic add + backfill

### Dependency Graph
```
A1 (routing fix) ← A5 (passage UX) depends on correct routing
A5 (passage UX) ← A6 (resilience) depends on building screen
A6 (resilience) — independent, but best after A1+A5 are done
B1 (welcome email) — independent, can be done in parallel
C1-C5 — all independent, can be done in parallel
D1 (topic backfill) — independent
```

---

## Files Changed Summary

### Website Repo (`/Users/akshitsama/Desktop/Website`)

| File | Action | Workstream |
|------|--------|------------|
| `src/context/AuthContext.tsx` | Modify | A1, A6 |
| `src/components/app/AuthGuard.tsx` | Modify | A1, A6 |
| `src/app/login/page.tsx` | Modify | A1 |
| `src/app/verify-email/page.tsx` | Modify | A2, A3 |
| `src/app/onboarding/page.tsx` | Modify | A4, A5 |
| `src/app/app/building/page.tsx` | **Create** | A6 |
| `src/hooks/useSignalForgeReadiness.ts` | **Create** | A6 |
| `src/lib/signalForgeSession.ts` | **Create** | A6 |
| `src/app/app/feed/page.tsx` | Modify | C3, C4 |
| `src/components/app/SignalCard.tsx` | Modify | C1, C2 |
| `src/components/app/FeedStatsSheet.tsx` | Modify | C4 |
| `src/components/app/ShareButton.tsx` | **Create** | C5 |
| `src/app/app/signal/[id]/page.tsx` | Modify | C5 |
| `src/app/app/search/page.tsx` | Modify | D1 |
| `src/app/globals.css` | Modify | A3, C2 |

### Relevant Repo (`/Users/akshitsama/Desktop/Relevant`)

| File | Action | Workstream |
|------|--------|------------|
| `supabase/functions/pro-welcome-email/index.ts` | **Create** | B1 |
| `supabase/functions/pro-welcome-email/email-template.ts` | **Create** | B1 |
| `supabase/functions/pro-passage-preview/index.ts` | Modify | A5 |
| `supabase/migrations/YYYYMMDDHHMMSS_welcome_email_trigger.sql` | **Create** | B1 |

---

## Notes for AI Agents

1. **Always check the current file content** before editing. Never assume file contents.
2. **Test in the browser** after every change. Run `npm run dev` and verify at `http://localhost:3000`.
3. **Mobile testing**: Use Chrome DevTools device emulation for viewport tests.
4. **AuthGuard is the routing brain** — all auth routing decisions go through it. Don't add `router.push()` in individual pages for auth redirects.
5. **Supabase queries**: Use the existing `supabase` client from `src/lib/supabase.ts`. Never create new clients.
6. **Edge functions**: Follow the patterns in existing functions. Use `invoke_edge_function` for system calls, never direct `fetch`.
7. **CSS**: Use Tailwind classes. Custom CSS goes in `globals.css` only when Tailwind can't express it.
8. **Animations**: Prefer CSS transitions over Framer Motion for simple hover effects. Use Framer Motion for complex choreographed animations.
9. **localStorage keys**: Use the prefix `relevant_` for all keys to avoid conflicts.
10. **Error handling**: Every async operation needs a try-catch with user-facing error message. Use `AuthContext.setNotice()` for auth-related errors.
