# Relevant — Landing Page Blueprint

> Read BRAND_SYSTEM.md first. This document defines the exact sections, copy, and visual concepts.

---

## The Core Idea

The website should feel like a product experience, not a brochure. Visitors should leave thinking: "If the real app is anything like what I just saw on that website, this is going to change how I consume information."

Every section is visual-first. Text is the last resort. The product — real signals, real consequence maps, real UI — is the hero.

---

## Page Structure

```
┌──────────────────────────────────────────┐
│  NAV                                     │  Fixed. Logo + CTA.
├──────────────────────────────────────────┤
│  §1  THE PROBLEM                         │  Full viewport. Animated. Feel the noise.
├──────────────────────────────────────────┤
│  §2  THE ANSWER — One Signal             │  A single real signal card. Interactive.
├──────────────────────────────────────────┤
│  §3  HOW IT WORKS                        │  3 steps. Mostly visual. Live app UI.
├──────────────────────────────────────────┤
│  §4  WHAT YOU CAN DO                     │  Visual feature cards. Bento grid.
├──────────────────────────────────────────┤
│  §5  SEE THE FEED                        │  Phone mockup. Real feed. Interactive.
├──────────────────────────────────────────┤
│  §6  WHO IT'S FOR                        │  Everyone. Specific examples.
├──────────────────────────────────────────┤
│  §7  GET ACCESS                          │  Waitlist. Pricing. One form.
├──────────────────────────────────────────┤
│  FOOTER                                  │  Minimal.
└──────────────────────────────────────────┘
```

---

## §1 — THE PROBLEM

### Purpose
Don't start with what Relevant is. Start with the problem everyone already feels. Make the visitor nod. Make them think "yeah, that's me." THEN show the fix — as a visual transformation, not a paragraph.

### Copy

**Eyebrow** (IBM Plex Mono, uppercase, small, muted):
```
YOU ALREADY KNOW THIS
```

**Headline** (Space Grotesk, massive):
```
You've been reading the news wrong.
```

**One line below** (Instrument Sans, muted, max 60 characters):
```
Hundreds of articles. Hours of scrolling. Almost zero insight.
```

**After the animation plays, a second line fades in:**
```
What if you only saw what actually matters to you?
```

**CTA button:**
```
Get early access
```

**Micro-copy** (mono, tiny):
```
7-day free trial · $4.99/month · Cancel anytime
```

### Visual Concept: The Transformation

The entire hero section IS the visual. Almost no text.

**Phase 1 — The Noise (first 3-4 seconds):**
The viewport fills with a chaotic stream of headlines. Real-looking article cards/tiles fly in from all directions — semi-transparent, overlapping, blurring past. Some are readable for a split second: financial news, politics, sports, tech, weather — overwhelming. They stack up, pile on each other, become a visual mess. This IS the internet. This IS what reading the news feels like.

The text "600+ articles published per minute" or similar floats in the chaos, almost lost in it.

**Phase 2 — The Engine (next 2 seconds):**
Everything begins to converge toward the center. The chaos compresses. A subtle glow appears — the engine. The noise visually funnels through it. Most articles fade out (filtered away). Only a few pass through.

**Phase 3 — The Signal (holds):**
On the other side of the convergence, 3-4 clean, minimal signal cards emerge. Spaced. Calm. Ordered. Each has a colored edge (impact type). They glow softly against the dark background. This is Relevant.

The headline and CTA appear over/beside this resolved state.

**The animation loops subtly** — articles continue to flow in the background at low opacity, the engine continues to filter, signals continue to appear. Ambient, not distracting.

**On mobile:** The flow runs top-to-bottom instead of left-to-right. Same phases.

### Implementation Notes
- Article tiles in Phase 1: CSS-animated divs with random headlines (can be hardcoded), varying opacity, size, speed, rotation
- Convergence: radial CSS gradient + blur that intensifies toward center
- Signal cards in Phase 3: simple glass rectangles with colored left border, appearing cleanly
- The whole thing is behind the headline at ~40-50% opacity with text in front
- OR the text appears AFTER Phase 3 resolves (more theatrical)
- No canvas needed — pure CSS/SVG animation. Lightweight.

---

## §2 — THE ANSWER: One Signal Card

### Purpose
After the hero shows the problem and hints at the fix, this section shows EXACTLY what you get. One signal. Full detail. Interactive. Built as a real component — identical to the mobile app. The visitor can see the three-part structure: what happened, why it matters to you, what to do.

### Copy

**Section label** (mono, uppercase):
```
WHAT YOU GET
```

**Headline:**
```
Not a headline. A signal.
```

**One line** (appears below the card, not above):
```
Every signal answers three questions. That's it.
```

### Visual Concept

**A single, large signal card dominates the viewport.** It's the actual app UI — faithfully recreated in React for the web. Not a screenshot. A real, interactive component.

**The card shows:**

**Surface State (what the visitor sees first):**
- Hero image (from signal data)
- Impact badge row: e.g., "FINANCIAL" "STRATEGIC" — colored pills
- Headline: e.g., "Federal Reserve Signals Accelerated Rate Cuts"
- Synthesis line: e.g., "The rate trajectory just shifted. If you hold variable debt or manage cash reserves, this changes your math this quarter."
- Source count: "4 sources · 2 days active"

**Expanded State (visitor clicks/taps to reveal):**
Three tabs appear below, mimicking the app exactly:

**Tab 1 — WHAT HAPPENED**
- 3-5 bullet points. Plain facts. Numbers. Quotes.
- e.g., "Fed Chair indicated 75bps of cuts before year-end, up from previous 50bps guidance"
- e.g., "Bond market priced in December cut at 94% probability"

**Tab 2 — WHY IT MATTERS TO YOU**
- Role-contextual consequence explanation
- Shows the consequence chain: Event → Impact on [user's dimension] → What it means
- e.g., "As a founder managing a Series A runway, cheaper debt means your bridge round might be 12-18 months away instead of 6"

**Tab 3 — WHAT TO DO**
- Watchpoints: dates, decisions, metrics to track
- e.g., "Watch: November CPI print (Dec 12). If core inflation drops below 3.2%, expect accelerated timeline."
- e.g., "Action window: Refinancing terms will shift within 60 days of first cut."

**The card auto-cycles through 3-4 example signals** (use the existing signal data from the codebase):
- A financial/economic signal
- An industry/operational signal
- A regulatory/policy signal
- A competitive/strategic signal

Each transition crossfades smoothly. The impact badge colors change with each signal. Small dots below indicate which signal is showing. Visitor can click dots to jump.

**Three callout labels** point to sections of the card:

```
① What happened     ② Why it matters to you     ③ What to do about it
```

These pulse/highlight in sequence as the card cycles, drawing attention.

### Implementation Notes
- Build as `<WebSignalCard />` — a web-native version of the app's `SignalCard` + `SignalDetailTabs`
- Use the mobile app's actual data structures (ProBriefItem type) for signal data
- Tabs: CSS-only tab switching (no routing needed)
- Auto-advance: setInterval 7 seconds, pauses on hover/interaction
- The card uses the same border-radius (20px), glass treatment, and typography from the app
- On mobile: card is full-width. Tabs stack naturally.

---

## §3 — HOW IT WORKS

### Purpose
Three steps. Minimal text. Maximum visual. Each step shows actual product UI — not icons, not illustrations. Real screens from the app, recreated as interactive web components.

### Copy

**Section label** (mono, uppercase):
```
HOW IT WORKS
```

**Headline:**
```
Three steps. That's the whole product.
```

### The Three Steps

---

**STEP 1 — TELL US ABOUT YOU**

```
Label: 01
Headline: Two minutes. Four questions.
Copy: Your industry. Your role. Your company. Your country. That's all we need.
```

**Visual:** A recreation of the onboarding "Your Lens" screen. Four selection fields displayed as clean, interactive selectors:

- **Industry** — a dropdown/chip selector showing options like Technology, Finance, Healthcare, Energy, Manufacturing, etc.
- **Role** — CEO, VP Engineering, Analyst, Product Manager, Student, etc.
- **Company** — text input with example: "Acme Corp"
- **Country** — auto-detected with flag, e.g., 🇨🇦 Canada

The visitor can actually interact with the selectors — clicking industries, roles — they highlight and respond. It's playful but purposeful. It shows "this is how simple setup is."

Below the selectors, a subtle animation: as the visitor fills in fields, small labels appear around the card showing influence dimensions being computed: "Federal Reserve rates," "Canadian housing policy," "Series A fundraising conditions," "AI infrastructure spend" — these represent what Relevant now understands about this person.

---

**STEP 2 — WE READ EVERYTHING**

```
Label: 02
Headline: Thousands of articles. Every day. For you.
Copy: We scan the internet continuously and match every article against your influence dimensions.
```

**Visual:** An animated ingestion visualization. Think of it as a simplified version of the NeuralSphere from the app's loading screen.

- Source type labels drift inward from the edges: "Reuters," "Financial Times," "SEC Filings," "Industry Reports," "Global Trade Data," "Tech Publications," "Government Releases," "Market Data"
- They converge toward a central glowing point
- A counter ticks: "2,847 articles scanned" (number increments)
- Below the counter: "7 matched your influence dimensions" (this is the punchline — out of thousands, only a handful actually matter to you)

The contrast between the big number (articles scanned) and small number (matches) IS the visual message. No paragraph needed.

---

**STEP 3 — YOU READ WHAT MATTERS**

```
Label: 03
Headline: Open the app. You're done in five minutes.
Copy: A few signals. Each one consequence-mapped. Each one actionable. That's your whole day.
```

**Visual:** A mini feed showing 4-5 signal cards stacked vertically — recreated from the app's actual feed UI. Each card shows:
- Impact badge (colored)
- Headline
- One-line synthesis
- Source count

The cards stagger in with a subtle animation (like the app's list animation — 80ms delay between each). A progress indicator at the bottom: "5/5 signals read · You're caught up" — reinforcing the finite feed concept.

### Layout
**Desktop:** Three columns, each step side by side. Steps connected by a subtle flowing line.
**Mobile:** Stacked vertically. Each step reveals on scroll (intersection observer fade-in).

### Implementation Notes
- Step 1: `<OnboardingDemo />` with interactive chip selectors (using real taxonomy from constants/)
- Step 2: CSS/SVG animation. Source labels as absolutely positioned, animated elements. Counter uses requestAnimationFrame.
- Step 3: `<MiniFeed />` component with staggered card entry animation
- Each step's visual is ~60-70% of the step's height. Text is compact below.

---

## §4 — WHAT YOU CAN DO (Features)

### Purpose
Show the capabilities — not as a feature list, but as visual demonstrations. Each card contains a miniature, working version of the feature. Less text than any other section.

### Copy

**Section label** (mono, uppercase):
```
INSIDE THE APP
```

**Headline:**
```
More than a feed.
```

### The Six Cards (Bento Grid)

Asymmetric grid — not uniform boxes. The layout itself is visual interest.

---

**Card 1 — CONSEQUENCE CHAIN** (large card, most prominent)
```
Label: CONSEQUENCE MAP
One line: We don't just tell you what happened. We trace what it means for you.
```
**Visual:** A miniature, animated consequence chain — directly from the app's ConsequenceChain component. Shows:
- Event node → "Fed signals rate cuts"
- Arrow →
- Dimension node → "Your Series A runway" (colored: Financial, amber)
- Arrow →
- Consequence → "Bridge round timeline extends 6-12 months"
- Branch: "If CPI drops below 3.2% → accelerated timeline (74% likely)"

Use the actual node + arrow + branch visual from the mobile app. Colored accent bars on each node matching impact type.

---

**Card 2 — MULTI-SOURCE** (medium card)
```
Label: MULTI-SOURCE
One line: Same story. Eight publishers. One signal.
```
**Visual:** A fan of 5-6 semi-transparent article cards stacking/collapsing into a single signal card. The animation loops: spread out (multiple articles) → collapse into one (signal). Shows source logos or publication names on the fanning cards.

---

**Card 3 — ASK AI** (medium card)
```
Label: ASK DEEPER
One line: Read the signal. Then ask it anything.
```
**Visual:** A mini chat interface — signal summary at top, then:
- User message: "How does this affect my Q2 hiring plan?"
- AI response: "If rate cuts proceed as signaled, your cost of capital drops ~40bps. That frees approximately $180K in your Q2 budget — enough for 1.5 additional headcount at your target comp band."
The chat bubbles are styled like the app's AskAI section.

---

**Card 4 — INFLUENCE DIMENSIONS** (medium card)
```
Label: YOUR DIMENSIONS
One line: 150+ things that can affect you. Computed from who you are.
```
**Visual:** A grid of small colored chips/tags — each one an influence dimension: "Federal Reserve policy," "Canadian housing market," "Series A conditions," "Cloud infrastructure pricing," "AI regulation," "Competitor: [Company]," "Supply chain disruption risk," etc. They subtly pulse or shimmer.

On hover, one chip highlights and a tooltip shows: "Matched 14 signals this month."

---

**Card 5 — GOAL COACH** (medium card)
```
Label: GOALS
One line: Don't just know things. Use them.
```
**Visual:** A miniature goal dashboard — progress ring (SVG, like MomentumBar), streak count, weekly module preview. Shows: "Career Growth · Week 4 · 87/100 score · 🔥 4-week streak."

Below: a tiny signal card with a goal alignment badge: "Affects your career growth →" — showing how signals connect to goals.

---

**Card 6 — FINITE FEED** (small card)
```
Label: YOU'RE DONE
One line: No infinite scroll. When you've read everything, we tell you.
```
**Visual:** A mini feed with a "You're caught up" state — a clean checkmark or completion message. Simple. The most powerful feature expressed in the fewest pixels.

---

### Layout
**Desktop:** 3-column bento grid. Card 1 spans 2 columns. Others fit the remaining 4 slots.
**Tablet:** 2-column. Card 1 spans full width.
**Mobile:** Single column stack.

### Implementation Notes
- Each card: glass border, subtle hover lift (2px), inner visual animates on viewport entry
- Card 1 (consequence chain): recreate the node + arrow + branch visual from `ConsequenceChainNodes.tsx`
- Card 2 (multi-source): CSS keyframe animation of cards fanning/collapsing
- Card 3 (ask AI): static chat mock, no real AI needed
- Card 4 (dimensions): real dimension names from the codebase influence data
- Card 5 (goals): simplified SVG ring + text from MomentumBar
- Card 6 (finite): simplest card — just a completion state visual

---

## §5 — SEE THE FEED

### Purpose
The "money section." A full phone mockup with an interactive, scrollable feed inside it. The visitor can browse real signals, tap to expand, and experience what the daily use of Relevant feels like. This is the section that makes people say "I need this."

### Copy

**Section label** (mono, uppercase):
```
THE FEED
```

**Headline:**
```
This is what it looks like.
```

**One line:**
```
Real signals. Scroll through them. Tap any card.
```

### Visual Concept

**A phone frame (CSS-only, not an image) centered on the page.** Inside it: a scrollable, interactive feed.

**The phone frame:**
- Rounded corners (44px), subtle border, dark bezel area
- Notch/dynamic island at top (CSS shape)
- Status bar with time + battery icon (decorative)
- Home indicator bar at bottom

**Inside the phone:**

A list of 5-6 signal cards, each showing:
- Impact type badge (colored)
- Headline
- One-line synthesis
- Source count + recency
- Hero image (if available)

The visitor can:
1. **Scroll** within the phone frame (contained overflow)
2. **Tap/click a card** to expand it — the card smoothly grows to show the three-part detail (what happened, why it matters, what to do)
3. **Tap again** to collapse
4. **See the "You're caught up" state** at the end of the list

**Desktop annotations** (floating labels pointing to UI elements):
- "Impact type" → pointing to a colored badge
- "Multi-source" → pointing to "4 sources" label
- "Tap to expand" → pointing to a card
- "That's everything" → pointing to the completion state

These annotations float outside the phone frame on desktop, connected by thin lines. Hidden on mobile.

**On mobile:** The phone frame is removed. The feed renders natively at full width — the visitor's actual phone IS the frame.

### Implementation Notes
- `<PhoneMockup />` — pure CSS device frame
- `<InteractiveFeed />` — list of `<WebSignalCard />` components (reuse from §2)
- Cards expand/collapse with CSS height transition + opacity
- Scroll: `overflow-y: auto` inside the phone container, styled scrollbar (thin, subtle)
- Signal data: same 4-6 examples used throughout the page
- Annotations: absolutely positioned with CSS connector lines, `display: none` on mobile

---

## §6 — WHO IT'S FOR

### Purpose
Relevant is for everyone — but "everyone" means nothing unless you show people they specifically belong. This section uses short, specific scenarios that let different visitors see themselves.

### Copy

**Section label** (mono, uppercase):
```
WHO IT'S FOR
```

**Headline:**
```
If information affects your decisions, this is for you.
```

### Visual Concept

**A grid of persona cards.** Each card is minimal — a role title, one sentence about their specific problem, and one sentence about how Relevant fixes it.

**The cards:**

```
THE STUDENT
"I want to sound informed in interviews and class discussions without spending hours on news."
→ Relevant gives you 3-5 signals daily that make you the most prepared person in the room.

THE FOUNDER
"I can't afford to miss a market shift, but I don't have time to read 40 newsletters."
→ Relevant watches your market, your competitors, and the regulatory landscape while you build.

THE EXECUTIVE
"I need consequence-mapped intelligence, not headline summaries."
→ Relevant tells you what happened, traces the impact to your business, and shows what to watch.

THE ANALYST
"I spend hours building briefings that are outdated by the time I send them."
→ Relevant builds multi-source, consequence-mapped briefings continuously — faster and sharper than manual research.

THE OPERATOR
"I need to know when a supply chain disruption, policy shift, or competitive move affects my operation."
→ Relevant maps consequences to your specific operation, not your industry in general.

THE CURIOUS
"I just want to be well-informed without feeling overwhelmed."
→ Relevant reads the internet for you and shows you only what matters. Five minutes. Done.
```

**Layout:** 3×2 grid on desktop. 2×3 on tablet. Stacked on mobile.
**Styling:** Each card has the same glass treatment. The role title is in Space Grotesk (bold). The problem is in muted text. The fix is in brighter text.
**Interaction:** Subtle hover lift. No complex animation needed — the text does the work here.

### The B2B Teaser (Optional)

Below the persona grid, a single wide card:

```
COMING SOON — RELEVANT FOR TEAMS
Shared signal across your organization. Role-aware feeds for every seat.
Same engine. Built for teams.
[Join the team waitlist →]
```

Styling: slightly muted compared to the main grid. A "Coming Soon" badge. This plants the seed without distracting from the main product.

---

## §7 — GET ACCESS

### Purpose
Convert. One form. Total transparency. No pressure. After all the visual proof above, this section is simple and calm. A breath.

### Copy

**Section label** (mono, uppercase):
```
EARLY ACCESS
```

**Headline:**
```
Information you should read. Not information you could read.
```

**Sub-line:**
```
Relevant is in early access. Join the waitlist.
```

**Pricing block:**
```
$4.99 / month
Free 7-day trial · Cancel anytime · No credit card to join
```

**Form:**
```
[Your email]  [Get early access]
```

**Below form** (mono, tiny):
```
No spam. Just your invite when it's ready.
```

**Success state (replaces the form):**
```
You're in.
We'll send your invite when it's your turn.
```

### Visual Concept
Clean. Centered. Maximum whitespace. A soft atmospheric glow behind the pricing card. The visual contrast with the dense product sections above is intentional — it signals "this is the end, here's what to do."

### Implementation Notes
- Reuse/evolve the existing `<EmailForm />` component
- POST to existing /api/waitlist endpoint
- The pricing block is a standalone card (glass treatment but lighter than feature cards)
- Success state: animate form away, fade in confirmation text

---

## FOOTER

```
Relevant
The information you should read.

Privacy · Terms · Contact

Twitter/X · Instagram · LinkedIn

© 2026 Relevant
```

Minimal. One level. No columns. Centered.

---

## Responsive Summary

| Element | Desktop | Mobile |
|---------|---------|--------|
| Hero animation | Left→Right flow | Top→Bottom flow |
| Signal card (§2) | Centered, ~500px | Full width |
| How it works (§3) | 3 columns | Stacked, scroll-reveal |
| Feature grid (§4) | 3-col bento | Single column stack |
| Phone feed (§5) | Phone mockup + annotations | No frame, native full-width |
| Who it's for (§6) | 3×2 grid | Stacked |
| Access (§7) | Centered, ~560px | Full width |

---

## Implementation Priority

1. **§2 Signal card component** — the core reusable piece. Used in §2, §5, §6 mockups.
2. **§1 Hero animation** — sets the entire tone. Everything flows from this.
3. **§5 Phone feed** — the "wow" section. Depends on signal card.
4. **§3 How it works** — three visual panels. Depends on signal card + onboarding demo.
5. **§4 Feature bento** — six independent cards. Can be built in parallel.
6. **§6 Who it's for** — straightforward grid. Mostly copy.
7. **§7 Access** — evolution of existing waitlist section.

---

## Content Notes

**Signal data:** Use the 4 existing signal examples already in the codebase (freight disruption, trade policy, infrastructure, reshoring). These are production-quality. Add 1-2 more for variety if time permits.

**Taxonomy data:** The onboarding demo (§3 Step 1) should use real industry/role options from the app's constants/ directory.

**Dimension examples:** Card 4 in the feature grid should use realistic dimension names based on what the engine actually generates.

**No screenshots needed.** Everything is built as web components, directly from the app's data structures and visual language.
