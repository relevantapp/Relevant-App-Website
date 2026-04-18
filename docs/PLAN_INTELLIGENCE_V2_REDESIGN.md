# Intelligence V2 — UI/UX Redesign & LLM Fix

> Depends on: `PLAN_INTELLIGENCE_V2.md` (original implementation — complete)
> Status: Ready to build
> Priority: P0 (LLM synthesis broken in production)

---

## 0. Current Problems

| # | Problem | Severity | User Impact |
|---|---------|----------|-------------|
| 1 | **LLM synthesis failing** — returns "Unable to generate full analysis" | P0 | Feature is broken — users get empty results |
| 2 | **Landing page text too small** — "The mobile app is coming" at 0.78rem | P1 | Hard to read, looks like fine print |
| 3 | **Form UX confusing** — no field explanations, unclear purpose | P1 | Users don't know what to enter or why |
| 4 | **Results layout flat** — stacked collapsibles, no visual hierarchy | P1 | Feels like a document, not a product |
| 5 | **Sources in sidebar** — cramped, disconnected from content | P2 | Source references feel disconnected |

---

## 1. Phase 1 — Fix LLM Synthesis (P0)

### The Problem

The `synthesize.ts` module calls OpenRouter with model `anthropic/claude-sonnet-4`. The catch block returns a degraded fallback with headline "Unable to generate full analysis" and empty sections. This means Exa + Tavily searches succeed (14 sources found) but the AI analysis step fails silently.

### Root Cause Investigation

1. **Model ID may be wrong** — OpenRouter uses specific model identifiers. `anthropic/claude-sonnet-4` may need to be `anthropic/claude-sonnet-4-20250514` or similar.
2. **API key issue** — `OPENROUTER_API_KEY` may be invalid or have insufficient credits.
3. **30s timeout too aggressive** — Large evidence payloads may take longer to synthesize.
4. **JSON parsing failure** — Model may return markdown-fenced JSON that `JSON.parse` rejects.

### Implementation Steps

#### Step 1.1: Add detailed error logging

**File:** `src/lib/intelligence/synthesize.ts`

Add structured error logging before the catch fallback:

```ts
// Before the existing catch block, enhance error capture:
if (!res.ok) {
  const errText = await res.text()
  console.error('[synthesize] OpenRouter error:', {
    status: res.status,
    statusText: res.statusText,
    body: errText.slice(0, 500),
    model: SYNTHESIS_MODEL,
  })
  throw new Error(`Synthesis failed: ${res.status} — ${errText.slice(0, 200)}`)
}
```

#### Step 1.2: Fix model ID and add fallback chain

**File:** `src/lib/intelligence/synthesize.ts`

```ts
// Replace single model with ordered fallback list
const SYNTHESIS_MODELS = [
  'anthropic/claude-sonnet-4-20250514',
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o-mini',
] as const

// Try each model in order until one succeeds
```

Logic:
- Attempt primary model
- If 404 or 429, try next model
- If all fail, return degraded result
- Log which model succeeded for monitoring

#### Step 1.3: Strip markdown fences from response

**File:** `src/lib/intelligence/synthesize.ts`

```ts
// After getting content string, strip markdown fences if present
let cleanContent = content.trim()
if (cleanContent.startsWith('```')) {
  cleanContent = cleanContent
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
}
const parsed = JSON.parse(cleanContent)
```

#### Step 1.4: Increase timeout

**File:** `src/lib/intelligence/synthesize.ts`

```ts
const SYNTHESIS_TIMEOUT = 45_000  // Was 30_000 — large evidence payloads need more time
```

#### Step 1.5: Add model used to status response

**File:** `src/lib/intelligence/types.ts`

```ts
// Add to status object in IntelligenceBrief
status: {
  // ... existing fields
  synthesisModel: string | null  // Which model actually produced the result
}
```

### Acceptance Criteria

- [ ] LLM synthesis returns structured JSON for valid inputs
- [ ] If primary model fails, fallback model is tried automatically
- [ ] Error logs show exact OpenRouter response (status, body, model)
- [ ] Markdown-fenced JSON responses are handled
- [ ] Status response includes which model was used
- [ ] Degraded mode only triggers after all models fail

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| OpenRouter returns 404 (bad model) | Try next model in chain |
| OpenRouter returns 429 (rate limit) | Try next model in chain |
| OpenRouter returns 500 | Try next model in chain |
| All 3 models fail | Return degraded result with empty sections |
| Response is valid JSON but wrong schema | Parse what we can, fill defaults for missing fields |
| Response is markdown-fenced JSON | Strip fences, parse inner JSON |
| Response is empty string | Throw, trigger fallback model |
| Timeout at 45s | Abort, try next model with fresh timeout |
| API key missing | Throw immediately (no retry) |
| API key invalid (401) | Throw immediately (no retry — all models share key) |

### Test Commands

```bash
# Test with real request (after fix)
curl -X POST http://localhost:3000/api/intelligence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"accountName":"Stripe","meetingType":"sales","goal":"Sell analytics"}'

# Verify response has non-empty sections
# Verify status.synthesisModel shows which model was used
```

---

## 2. Phase 2 — Fix Landing Page Text Size

### The Problem

`.hero-waitlist-label` uses `font-size: 0.78rem` (~12.5px). This makes "The mobile app is coming. Be first in line." look like legal fine print.

### Implementation

**File:** `src/app/globals.css`

```css
/* Before */
.hero-waitlist-label {
  font-size: 0.78rem;
}

/* After */
.hero-waitlist-label {
  font-size: 0.95rem;
}
```

### Acceptance Criteria

- [ ] Text is clearly readable at both mobile and desktop sizes
- [ ] No layout shift in the hero section
- [ ] Visually balanced with the email input below it

---

## 3. Phase 3 — Redesign Intelligence Form

### The Problem

Current form has no context for any field:
- "Meeting type" — user doesn't know what this changes
- "Goal" — user doesn't know this shapes talking points
- "Attendees" — user doesn't know the system searches their profiles
- "Website" — user doesn't know this triggers content extraction
- Fields are in wrong priority order

### New Field Order (by importance)

1. **Account name** (required) — "Who are you meeting with?"
2. **Goal** (required) — "What's your goal for this meeting?"
3. **Meeting type** (required) — chip selector with subtitle
4. **Website** (optional) — "Their website"
5. **Attendees** (optional) — "Key people in the room"
6. **Advanced** (collapsed) — Notes + Competitors

### Implementation Steps

#### Step 3.1: Add helper text to every field

**File:** `src/app/app/intelligence/IntelligenceForm.tsx`

Each field gets a 1-line description below the label explaining what the system does with the input:

| Field | Helper Text |
|-------|-------------|
| Account name | "We'll pull their company profile, recent news, and key people" |
| Goal | "This shapes which insights we prioritize for you" |
| Meeting type | "Adjusts the analysis lens — sales focuses on objections & leverage, investor on traction & metrics" |
| Website | "We'll extract recent content directly from their site" |
| Attendees | "We search LinkedIn and public profiles for background on each person" |
| Notes | "Context you already have — we'll factor this into the analysis" |
| Competitors | "We'll pull comparison data and competitive positioning" |

#### Step 3.2: Dynamic goal placeholders by meeting type

**File:** `src/app/app/intelligence/IntelligenceForm.tsx`

```ts
const GOAL_PLACEHOLDERS: Record<MeetingType, string> = {
  sales: 'e.g., Close the deal, Get to next meeting, Understand their needs',
  client: 'e.g., Quarterly business review, Upsell new feature, Resolve issue',
  partner: 'e.g., Explore integration, Negotiate terms, Align on roadmap',
  investor: 'e.g., Raise Series A, Share traction update, Get follow-on',
  board: 'e.g., Present quarterly results, Get approval for new initiative',
  hiring: 'e.g., Evaluate for VP Engineering, Sell the role, Assess culture fit',
  general: 'e.g., Exploratory conversation, Build relationship, Learn about them',
}
```

When meeting type changes, goal input placeholder updates to show relevant examples.

#### Step 3.3: Meeting type chip descriptions

**File:** `src/app/app/intelligence/IntelligenceForm.tsx`

Each chip shows a short subtitle when selected:

```ts
const MEETING_TYPE_DETAILS: Record<MeetingType, string> = {
  sales: 'Focuses on objections, leverage points, and deal signals',
  client: 'Focuses on relationship health, renewal risks, and growth opportunities',
  partner: 'Focuses on strategic fit, mutual value, and integration points',
  investor: 'Focuses on traction metrics, market position, and growth story',
  board: 'Focuses on performance data, strategic decisions, and risk factors',
  hiring: 'Focuses on candidate background, culture signals, and role fit',
  general: 'Balanced analysis across all dimensions',
}
```

Show the description below the chip row when a type is selected.

#### Step 3.4: Reorder fields

**File:** `src/app/app/intelligence/IntelligenceForm.tsx`

Current order: Account → Type → Goal → Website → Attendees → Advanced
New order: Account → Goal → Type → Website → Attendees → Advanced

Goal moves up because it's the second most important input. Meeting type moves below goal because it modifies how the goal is interpreted.

#### Step 3.5: Style helper text

**File:** `src/app/globals.css`

```css
.intel-field-helper {
  font-size: 0.78rem;
  color: var(--text-soft);
  margin-top: 4px;
  line-height: 1.4;
  opacity: 0.7;
}

.intel-type-description {
  font-size: 0.78rem;
  color: var(--accent);
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(47, 107, 255, 0.06);
  border-radius: 6px;
  line-height: 1.4;
}
```

### Acceptance Criteria

- [ ] Every field has a helper text line explaining what the system does with the input
- [ ] Meeting type selection shows a description of what that lens focuses on
- [ ] Goal placeholder updates dynamically when meeting type changes
- [ ] Field order is: Account → Goal → Type → Website → Attendees → Advanced
- [ ] Form is still completable in under 30 seconds
- [ ] No visual clutter — helper text is subtle (muted color, small size)
- [ ] Mobile: form fits without horizontal scroll

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| User changes meeting type after typing goal | Placeholder updates but typed text stays |
| User hasn't selected meeting type | Goal shows generic placeholder |
| Helper text on small screens | Text wraps gracefully, doesn't overlap |
| 5 attendees added (max) | Add button disabled, helper still visible |

---

## 4. Phase 4 — Redesign Results: Bento Grid Layout

### The Problem

Current layout is vertical collapsible sections with a source sidebar. It reads like a document, not a dashboard. No visual hierarchy — headline, company snapshot, and bullet sections all have the same weight.

### New Layout: Bento Grid

```
┌─────────────────────────────────────────────────────────────────┐
│  ← New Search            ● High Confidence            📋 Copy  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HEADLINE (large, accent-tinted background)                     │
│  "Canadian Tire is expanding into Hudson's Bay retail..."       │
│                                                                 │
│  BOTTOM LINE (medium text, distinct visual)                     │
│  "They're in acquisition mode. Position your pitch around       │
│   operational efficiency post-merger..."                        │
│                                                                 │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│  🏢 COMPANY SNAPSHOT       │  👥 KEY PEOPLE                     │
│                            │                                    │
│  Industry   Retail         │  ┌─────────────────────────┐      │
│  HQ         Toronto, ON   │  │ Ken Koffin               │      │
│  Size       50,000+       │  │ VP Sales · LinkedIn ↗    │      │
│  Funding    Public (TSX)  │  │ "15yr retail experience" │      │
│  CEO        Greg Hicks    │  └─────────────────────────┘      │
│                            │  ┌─────────────────────────┐      │
│  Recent milestone:         │  │ Sarah Lee                │      │
│  "Acquired 67 HBC          │  │ Director Ops · LinkedIn  │      │
│   locations in Q4"         │  └─────────────────────────┘      │
│                            │                                    │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│  📰 WHAT JUST HAPPENED     │  💬 TALKING POINTS                 │
│                            │                                    │
│  • CTC launched HBC        │  • Mention their Triangle          │
│    collection [s1]   fact  │    Rewards expansion [s3]   infer  │
│  • Q1 revenue up 4.2%     │  • Reference the new summer        │
│    [s2]              fact  │    product line [s5]          fact  │
│  • Expanded pickup         │  • Ask about supply chain          │
│    points [s4]       fact  │    for new stores [s6]      infer  │
│                            │                                    │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│  ⚠️ LANDMINES              │  ❓ QUESTIONS TO ASK               │
│                            │                                    │
│  • HBC integration risks   │  • How is the Triangle             │
│    [s3]              fact  │    integration going? [s7]         │
│  • Competitor pressure     │  • What's the store count          │
│    from Walmart [s5] fact  │    target for 2026? [s8]           │
│  • Employee sentiment     │  • Are you evaluating              │
│    post-merger [s7]  infer │    analytics vendors? [s9]         │
│                            │                                    │
├────────────────────────────┴────────────────────────────────────┤
│                                                                 │
│  🆚 COMPETITOR CONTEXT (only if competitors provided)           │
│  • Walmart expanding same-day delivery [s9]                     │
│  • Loblaw investing in digital checkout [s10]                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📚 SOURCES (14)                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ s1     │ │ s2     │ │ s3     │ │ s4     │ │ s5     │      │
│  │CTV News│ │Yahoo   │ │NatPost │ │RetailW │ │CP24    │      │
│  │Apr 12  │ │Apr 10  │ │Apr 8   │ │Apr 5   │ │Apr 3   │      │
│  │ exa    │ │ exa    │ │tavily  │ │ exa    │ │tavily  │      │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
│  ← scroll →                                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ⏱ 4.2s · 14 sources · Exa ✓  Tavily ✓  AI: claude-sonnet ✓  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 4.1: Create bento grid container

**File:** `src/app/app/intelligence/IntelligenceResults.tsx`

Replace current stacked layout with CSS Grid:

```tsx
<div className="intel-results">
  {/* Toolbar */}
  <div className="intel-toolbar">...</div>

  {/* Hero: Headline + Bottom Line */}
  <div className="intel-hero">...</div>

  {/* Bento Grid */}
  <div className="intel-bento">
    {/* Row 1: Snapshot + People */}
    {snapshot && <div className="intel-card intel-snapshot">...</div>}
    {attendeeProfiles.length > 0 && <div className="intel-card intel-people">...</div>}

    {/* Row 2: What Happened + Talking Points */}
    <div className="intel-card intel-happened">...</div>
    <div className="intel-card intel-talking">...</div>

    {/* Row 3: Landmines + Questions */}
    <div className="intel-card intel-landmines">...</div>
    <div className="intel-card intel-questions">...</div>
  </div>

  {/* Full width: Competitors */}
  {competitorContext.length > 0 && <div className="intel-card intel-competitors">...</div>}

  {/* Sources */}
  <div className="intel-sources-row">...</div>

  {/* Status bar */}
  <div className="intel-status-bar">...</div>
</div>
```

#### Step 4.2: Bento grid CSS

**File:** `src/app/globals.css`

```css
.intel-bento {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .intel-bento {
    grid-template-columns: 1fr;
  }
}

.intel-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.intel-hero {
  background: linear-gradient(135deg, rgba(47, 107, 255, 0.08), rgba(45, 181, 163, 0.06));
  border: 1px solid rgba(47, 107, 255, 0.15);
  border-radius: 14px;
  padding: 24px;
  margin-top: 16px;
}
```

#### Step 4.3: Redesign headline + bottom line

**File:** `src/app/app/intelligence/IntelligenceResults.tsx`

```tsx
<div className="intel-hero">
  <h2 className="intel-headline">{brief.summary.headline}</h2>
  <p className="intel-bottom-line">{brief.summary.bottomLine}</p>
</div>
```

Headline: large, bold, white text.
Bottom line: medium, softer color, below headline.
Both inside a subtle gradient card.

#### Step 4.4: Redesign company snapshot card

**File:** `src/app/app/intelligence/IntelligenceResults.tsx`

Replace the current `SnapshotCard` with a cleaner layout:

```tsx
<div className="intel-card intel-snapshot">
  <h3 className="intel-card-title">
    <Building2 size={16} /> Company Snapshot
  </h3>
  <div className="intel-snapshot-grid">
    {facts.map(([label, value]) => (
      <div key={label} className="intel-snapshot-fact">
        <span className="intel-fact-label">{label}</span>
        <span className="intel-fact-value">{value}</span>
      </div>
    ))}
  </div>
  {snapshot.recentMilestone && (
    <div className="intel-milestone">
      <span className="intel-milestone-label">Recent</span>
      <span>{snapshot.recentMilestone}</span>
    </div>
  )}
</div>
```

Grid: 2-column fact pairs (label | value), clean and scannable.

#### Step 4.5: Redesign attendee cards

**File:** `src/app/app/intelligence/IntelligenceResults.tsx`

```tsx
<div className="intel-card intel-people">
  <h3 className="intel-card-title">
    <Users size={16} /> Key People
  </h3>
  {attendeeProfiles.map((person) => (
    <div key={person.name} className="intel-person-card">
      <div className="intel-person-name">{person.name}</div>
      <div className="intel-person-role">
        {person.title} · {person.company}
      </div>
      {person.background && (
        <div className="intel-person-bg">{person.background}</div>
      )}
      {person.linkedinUrl && (
        <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer"
           className="intel-person-link">LinkedIn ↗</a>
      )}
    </div>
  ))}
</div>
```

#### Step 4.6: Redesign bullet section cards

**File:** `src/app/app/intelligence/IntelligenceResults.tsx`

Replace collapsible sections with always-visible bento cards:

```tsx
function BentoSection({ title, icon, bullets, variant }: BentoSectionProps) {
  if (bullets.length === 0) return null

  return (
    <div className={`intel-card intel-section intel-section--${variant}`}>
      <h3 className="intel-card-title">
        {icon} {title}
      </h3>
      <ul className="intel-bullet-list">
        {bullets.map((bullet, i) => (
          <li key={i} className="intel-bullet">
            <span className="intel-bullet-text">{bullet.text}</span>
            <span className="intel-bullet-meta">
              {bullet.sourceIds.map((id) => (
                <button key={id} className="intel-source-ref"
                        onClick={() => scrollToSource(id)}>
                  {id}
                </button>
              ))}
              <span className={`intel-tag intel-tag--${bullet.tag}`}>
                {bullet.tag}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Section variants for subtle visual differentiation:

| Section | Variant | Accent |
|---------|---------|--------|
| What Just Happened | `news` | Default border |
| Talking Points | `talking` | Teal tint (#2DB5A3) |
| Landmines | `landmines` | Coral tint (#FF7A59) |
| Questions to Ask | `questions` | Violet tint (#CAC2FF) |
| Competitor Context | `competitors` | Amber tint (#FFC857) |

```css
.intel-section--landmines {
  border-color: rgba(255, 122, 89, 0.2);
}
.intel-section--talking {
  border-color: rgba(45, 181, 163, 0.2);
}
.intel-section--questions {
  border-color: rgba(202, 194, 255, 0.2);
}
.intel-section--competitors {
  border-color: rgba(255, 200, 87, 0.2);
}
```

#### Step 4.7: Redesign sources as horizontal card grid

**File:** `src/app/app/intelligence/IntelligenceSources.tsx`

Replace sidebar layout with a full-width horizontal scrolling card strip at the bottom:

```tsx
<div className="intel-sources-section">
  <h3 className="intel-card-title">
    📚 Sources ({sources.length})
  </h3>
  <div className="intel-sources-scroll">
    {sources.map((source) => (
      <div key={source.id} id={`source-${source.id}`}
           className="intel-source-card">
        <div className="intel-source-id">{source.id}</div>
        <div className="intel-source-domain">{source.domain}</div>
        <div className="intel-source-title">{source.title}</div>
        {source.publishedAt && (
          <div className="intel-source-date">
            {formatDate(source.publishedAt)}
          </div>
        )}
        <div className={`intel-source-provider intel-provider--${source.provider}`}>
          {source.provider}
        </div>
        <a href={source.url} target="_blank" rel="noopener noreferrer"
           className="intel-source-link">Open ↗</a>
      </div>
    ))}
  </div>
</div>
```

```css
.intel-sources-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
}

.intel-source-card {
  flex: 0 0 160px;
  scroll-snap-align: start;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s;
}

.intel-source-card.highlighted {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}
```

#### Step 4.8: Add status bar

**File:** `src/app/app/intelligence/IntelligenceResults.tsx`

```tsx
<div className="intel-status-bar">
  <span>⏱ {(status.totalMs / 1000).toFixed(1)}s</span>
  <span>·</span>
  <span>{status.sourceCount} sources</span>
  <span>·</span>
  <span className={status.exaSearchMs > 0 ? 'intel-ok' : 'intel-fail'}>
    Exa {status.exaSearchMs > 0 ? '✓' : '✗'}
  </span>
  <span className={status.tavilySearchMs > 0 ? 'intel-ok' : 'intel-fail'}>
    Tavily {status.tavilySearchMs > 0 ? '✓' : '✗'}
  </span>
  <span className={!status.degraded ? 'intel-ok' : 'intel-fail'}>
    AI {!status.degraded ? '✓' : '✗'}
  </span>
  {status.synthesisModel && (
    <span className="intel-model-badge">{status.synthesisModel}</span>
  )}
</div>
```

#### Step 4.9: Source click → scroll highlight

**File:** `src/app/app/intelligence/IntelligenceResults.tsx`

```ts
function scrollToSource(sourceId: string) {
  const el = document.getElementById(`source-${sourceId}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  el.classList.add('highlighted')
  setTimeout(() => el.classList.remove('highlighted'), 2000)
}
```

#### Step 4.10: Copy brief as markdown

**File:** `src/app/app/intelligence/IntelligenceResults.tsx`

```ts
function copyBriefAsMarkdown(brief: IntelligenceBrief) {
  const lines: string[] = []
  lines.push(`# ${brief.summary.headline}`)
  lines.push('')
  lines.push(`> ${brief.summary.bottomLine}`)
  lines.push('')

  if (brief.snapshot) {
    lines.push('## Company Snapshot')
    lines.push(`- **Industry:** ${brief.snapshot.industry || 'Unknown'}`)
    lines.push(`- **HQ:** ${brief.snapshot.headquarters || 'Unknown'}`)
    lines.push(`- **Size:** ${brief.snapshot.employeeCount || 'Unknown'}`)
    lines.push('')
  }

  const sectionMap = [
    ['What Just Happened', brief.sections.whatJustHappened],
    ['Talking Points', brief.sections.talkingPoints],
    ['Landmines', brief.sections.landmines],
    ['Questions to Ask', brief.sections.questionsToAsk],
    ['Competitor Context', brief.sections.competitorContext],
  ] as const

  for (const [title, bullets] of sectionMap) {
    if (bullets.length === 0) continue
    lines.push(`## ${title}`)
    for (const b of bullets) {
      lines.push(`- ${b.text} [${b.sourceIds.join(', ')}] (${b.tag})`)
    }
    lines.push('')
  }

  lines.push('## Sources')
  for (const s of brief.sources) {
    lines.push(`- [${s.id}] ${s.title} — ${s.domain} (${s.url})`)
  }

  navigator.clipboard.writeText(lines.join('\n'))
}
```

### Acceptance Criteria

- [ ] Results use CSS Grid 2-column bento layout on desktop
- [ ] Headline + bottom line have hero visual treatment (gradient background, large text)
- [ ] Company snapshot is a clean 2-column fact grid
- [ ] Attendee profiles show name, title, company, and LinkedIn link
- [ ] Each brief section is a distinct bento card with color-coded border
- [ ] Sections with 0 bullets are hidden (not shown empty)
- [ ] Sources are in a horizontal scrolling card strip at the bottom
- [ ] Clicking a source reference [s1] scrolls to and highlights that source card
- [ ] Status bar shows generation time, source count, and provider health (✓/✗)
- [ ] Copy button exports clean markdown to clipboard
- [ ] Fully responsive — single column on mobile (≤768px)
- [ ] No horizontal overflow on any screen size
- [ ] fact/inference tags are visually distinct (different colors)

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| No snapshot returned | Skip snapshot card, rest of grid still renders |
| No attendees | Skip people card, snapshot takes full width of row 1 |
| Empty section (e.g., no landmines) | Card is hidden, grid reflows |
| All sections empty (degraded) | Show degraded mode card (Phase 5) |
| 1 bullet in a section | Card still renders, no awkward spacing |
| Very long bullet text (>200 chars) | Text wraps, card grows vertically |
| 20+ sources | Horizontal scroll, no layout break |
| Source reference for missing source | Button is disabled/dimmed |
| No snapshot AND no attendees | Row 1 is skipped entirely |
| Competitor section with no competitors in request | Section hidden |

---

## 5. Phase 5 — Edge Cases & Polish

### Step 5.1: Degraded mode card

When LLM fails but sources exist, show a clean fallback instead of "Unable to generate full analysis":

```tsx
<div className="intel-degraded-card">
  <h3>⚠️ AI analysis unavailable</h3>
  <p>We found {sources.length} sources but couldn't generate the analysis.
     The raw evidence is shown below.</p>
  <button onClick={retry}>Retry Analysis</button>
</div>
```

Then show sources in the bento grid without the analysis sections.

### Step 5.2: Loading skeleton

Show skeleton bento boxes during generation:

```tsx
<div className="intel-bento intel-loading">
  <div className="intel-card intel-skeleton" style={{ height: 120 }} />
  <div className="intel-card intel-skeleton" style={{ height: 120 }} />
  <div className="intel-card intel-skeleton" style={{ height: 180 }} />
  <div className="intel-card intel-skeleton" style={{ height: 180 }} />
  <div className="intel-card intel-skeleton" style={{ height: 160 }} />
  <div className="intel-card intel-skeleton" style={{ height: 160 }} />
</div>
```

```css
.intel-skeleton {
  background: linear-gradient(90deg, var(--surface) 25%, var(--bg) 50%, var(--surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Step 5.3: Improved loading progress

Replace generic "Generating..." with step-by-step progress:

```ts
const LOADING_STEPS = [
  { label: 'Searching for company information...', delay: 0 },
  { label: 'Pulling recent news and events...', delay: 2000 },
  { label: 'Researching attendee backgrounds...', delay: 4000 },
  { label: 'Analyzing sources...', delay: 7000 },
  { label: 'Building your briefing...', delay: 10000 },
]
```

Show these progressively over the skeleton cards.

### Step 5.4: No results empty state

If providers return zero sources:

```tsx
<div className="intel-empty">
  <h3>No information found</h3>
  <p>We couldn't find enough information about "{accountName}".
     Try adding their website URL for better results.</p>
  <button onClick={goBack}>Try Again</button>
</div>
```

### Step 5.5: Mobile responsive testing

Test at these breakpoints:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 428px (iPhone 14 Plus)
- 768px (iPad)
- 1024px (Desktop)

Rules:
- Bento grid → single column below 768px
- Source cards → horizontal scroll works on touch
- All text readable without zooming
- No horizontal overflow anywhere
- Buttons are at least 44px touch target

### Acceptance Criteria

- [ ] Degraded mode shows clean "AI unavailable" card with retry button
- [ ] Loading state shows skeleton bento cards with shimmer animation
- [ ] Loading progress shows step-by-step messages
- [ ] Empty state (0 sources) shows helpful message with "try again" action
- [ ] No horizontal overflow at 375px viewport
- [ ] Touch targets are ≥44px on mobile
- [ ] All sections collapse to single column at ≤768px
- [ ] Source horizontal scroll works on touch devices
- [ ] Retry button re-runs the analysis (not the search)

---

## 6. File Change Map

### Files to modify

| File | Changes |
|------|---------|
| `src/lib/intelligence/synthesize.ts` | Model fallback chain, better error logging, markdown fence stripping, timeout increase |
| `src/lib/intelligence/types.ts` | Add `synthesisModel` to status |
| `src/lib/intelligence/index.ts` | Pass synthesisModel through to response |
| `src/app/globals.css` | Bump `.hero-waitlist-label` font-size, add all bento grid + card styles |
| `src/app/app/intelligence/IntelligenceForm.tsx` | Reorder fields, add helper text, dynamic goal placeholders, type descriptions |
| `src/app/app/intelligence/IntelligenceResults.tsx` | Full rewrite to bento grid, hero section, status bar, copy, scroll-to-source |
| `src/app/app/intelligence/IntelligenceSources.tsx` | Rewrite as horizontal card strip |

### No new files needed

All changes are modifications to existing files.

### Files NOT touched

| File | Reason |
|------|--------|
| `src/lib/intelligence/providers/exa.ts` | Working correctly |
| `src/lib/intelligence/providers/tavily.ts` | Working correctly |
| `src/lib/intelligence/normalize.ts` | Working correctly |
| `src/lib/intelligence/research-plan.ts` | Working correctly |
| `src/app/api/intelligence/route.ts` | Working correctly |
| `src/app/page.tsx` | Text is in CSS, not JSX |

---

## 7. Subagent Execution Plan

### Execution Order

```
Phase 1: LLM Fix (blocking — nothing else matters if synthesis is broken)
  └── SWE Agent: Fix synthesize.ts + types.ts + index.ts
  └── Execution Agent: Test with real API call, verify non-empty sections

Phase 2: Landing Page (independent, fast)
  └── SWE Agent: Update globals.css hero-waitlist-label
  └── Execution Agent: Verify visually

Phase 3: Form Redesign (independent of Phase 4)
  └── SWE Agent: Modify IntelligenceForm.tsx (reorder, helpers, dynamic placeholders)
  └── SWE Agent: Add form CSS to globals.css

Phase 4: Results Redesign (biggest change)
  └── SWE Agent: Rewrite IntelligenceResults.tsx to bento grid
  └── SWE Agent: Rewrite IntelligenceSources.tsx to horizontal cards
  └── SWE Agent: Add all bento CSS to globals.css

Phase 5: Polish
  └── SWE Agent: Degraded mode, skeleton loading, empty state, mobile fixes
  └── Execution Agent: Lint + typecheck + build

Final:
  └── Reviewer Agent: Review all changes (one pass)
  └── Execution Agent: Push to main
```

### Parallelization

```
Timeline:

T1: [Phase 1: LLM Fix] ────────────────────►
    [Phase 2: Landing Text] ──►

T2: [Phase 3: Form] ──────────────►
    [Phase 4: Results] ──────────────────────►

T3: [Phase 5: Polish] ──────────────►

T4: [Review] ──► [Push]
```

- Phase 1 and 2 can run in parallel
- Phase 3 and 4 can run in parallel (after Phase 1 completes)
- Phase 5 runs after 3 and 4
- Review runs once at the end

### Subagent Prompts

| # | Agent | Prompt Summary |
|---|-------|----------------|
| 1 | SWE | "Fix LLM synthesis in synthesize.ts: add model fallback chain, strip markdown fences, increase timeout to 45s, add synthesisModel to status in types.ts, pass it through in index.ts" |
| 2 | SWE | "Fix landing page text: update .hero-waitlist-label font-size from 0.78rem to 0.95rem in globals.css" |
| 3 | SWE | "Redesign IntelligenceForm.tsx: reorder fields (account→goal→type→website→attendees→advanced), add helper text below every field, add dynamic goal placeholders per meeting type, show meeting type description when selected. Add CSS classes to globals.css." |
| 4 | SWE | "Rewrite IntelligenceResults.tsx as bento grid: hero headline+bottomline card with gradient, 2-column grid with snapshot/people/happened/talking/landmines/questions cards, color-coded borders per section, status bar with provider health. Add copy-as-markdown and scroll-to-source." |
| 5 | SWE | "Rewrite IntelligenceSources.tsx as horizontal scrolling card strip: each source as a 160px card with id, domain, title, date, provider badge, open link. Add highlight animation when scrolled to." |
| 6 | SWE | "Add polish: degraded mode card with retry, skeleton loading bento animation, progressive loading steps, empty state for 0 sources, mobile responsive at 375/390/428/768/1024px breakpoints." |
| 7 | Execution | "Run: cd /Users/akshitsama/Desktop/Website && npx next lint && npx tsc --noEmit && npm run build" |
| 8 | Reviewer | "Review all Intelligence V2 redesign changes across: synthesize.ts, types.ts, index.ts, globals.css, IntelligenceForm.tsx, IntelligenceResults.tsx, IntelligenceSources.tsx" |

---

## 8. Full Acceptance Criteria Checklist

### P0: LLM Synthesis
- [ ] Synthesis returns structured JSON for valid inputs
- [ ] Fallback model chain works (3 models)
- [ ] Error logs show exact OpenRouter response on failure
- [ ] Markdown-fenced JSON responses handled
- [ ] Status includes which model was used
- [ ] Degraded mode only after all models fail
- [ ] 45s timeout per model attempt

### P1: Landing Page
- [ ] "The mobile app is coming" text readable at all sizes
- [ ] No layout shift in hero

### P1: Form UX
- [ ] Every field has helper text
- [ ] Meeting type shows description when selected
- [ ] Goal placeholder updates per meeting type
- [ ] Fields ordered by importance
- [ ] Completable in under 30 seconds
- [ ] Mobile-friendly

### P1: Results Layout
- [ ] Bento grid 2-column on desktop
- [ ] Single column on mobile
- [ ] Hero headline + bottom line visually prominent
- [ ] Color-coded section borders
- [ ] Empty sections hidden
- [ ] Horizontal source cards with scroll
- [ ] Source click scrolls + highlights
- [ ] Copy exports markdown
- [ ] Status bar shows provider health
- [ ] fact/inference tags visually distinct

### P2: Polish
- [ ] Skeleton loading with shimmer
- [ ] Progressive loading messages
- [ ] Degraded card with retry
- [ ] Empty state with guidance
- [ ] No horizontal overflow at 375px
- [ ] Touch targets ≥44px

### Engineering
- [ ] No TypeScript errors
- [ ] Lint passes
- [ ] Build succeeds
- [ ] No files over 400 lines
- [ ] No `any` types
- [ ] All CSS uses existing design tokens (--bg, --surface, --accent, --border, --text, --text-soft)

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenRouter model ID wrong | P0 — synthesis broken | Fallback chain with 3 models |
| OpenRouter API key invalid | P0 — synthesis broken | Check key validity before retry loop |
| Bento grid breaks on mobile | P1 — bad mobile UX | CSS Grid with single-column fallback at 768px |
| globals.css exceeds 400 lines limit | Blocks deployment | Already large — new styles are ~150 lines, may need splitting |
| IntelligenceResults.tsx exceeds 400 lines | Blocks deployment | Extract BentoSection, SnapshotCard, AttendeeList into separate components if needed |
| Source scroll doesn't work on iOS Safari | P2 — usability | Test with `-webkit-overflow-scrolling: touch` |
