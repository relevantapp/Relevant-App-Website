# Intelligence Flagship Plan

> Purpose: Turn the current meeting-prep feature into a flagship intelligence product that helps a user prepare, analyze, and act with confidence.
> Current repo state: `/app/intelligence` already exists with a basic meeting brief flow. This plan evolves it into a broader, role-aware intelligence workspace.

## 1. Bottom Line

Do not build this as a single "meeting prep" form.

Build one premium product surface called `Intelligence` with guided workflows that help a user:

- prepare for an important conversation
- build a business case
- research an account, company, partner, or market
- compare competitors
- later, monitor what changed over time

The product should feel simple on the outside and powerful on the inside:

- structured intake instead of a blank box
- role-aware personalization using the user's profile context
- careful search orchestration before synthesis
- output that feels like an intelligence dashboard, not a long document

Meeting Prep should be the wedge and the strongest first experience.

---

## 2. User Problem

The user is not asking for more information.

The user is asking:

- "Help me walk into this conversation already understanding what matters."
- "Help me make a strong case with proof points."
- "Help me understand this account, company, or market quickly."
- "Help me know what to say, what to ask, what to avoid, and what to do next."

The real job is not search. The real job is preparation and judgment.

Relevant has an advantage here:

- we already know the user
- we already know their role and company context
- we can personalize the synthesis based on their goals
- we can combine live search, structured evidence, and user context into one brief

That is the flagship feature:

`deep research, orchestrated for one specific work decision`

---

## 3. Product Shape

### Product name

Use `Intelligence` as the product surface.

### Product promise

`Know what happened, why it matters, and what to do next.`

### Workflow model

Inside `Intelligence`, do not make the user start from a blank prompt.

Use guided workflow presets.

### V1 workflows

1. `Meeting Prep`
2. `Business Case`
3. `Account Brief`
4. `Competitive Analysis`

### V1.5 workflows

1. `Partnership Prep`
2. `Investor Brief`
3. `Board Prep`

### V2 workflow

1. `Monitor`

`Monitor` should exist in the long-term architecture, but it should not dilute the first release. The first release should win on high-stakes one-off prep.

---

## 4. Core Product Principles

### Principle 1: Structure the input for the user

The user should not need to know how to prompt an LLM well.

They should answer simple, guided questions and let the system turn that into a strong research brief.

### Principle 2: Personalize from the user's context

The same meeting should produce different framing for:

- a founder
- a PM
- a salesperson
- a partnerships lead
- an operator

The synthesis should use the user's profile passage and account context as a lens, not just the target company's data.

### Principle 3: Search is the foundation

The quality of the output depends heavily on:

- what searches we dispatch
- which sources we trust
- how we bucket evidence
- how we keep facts separate from interpretation

Do not treat search as a generic "query the web once" step.

### Principle 4: First screen must already be useful

The result should answer the user's question before they scroll.

### Principle 5: The UI should feel premium

This should feel like something people would pay for:

- crisp hierarchy
- strong typography
- dense but readable cards
- numbers and evidence where available
- obvious actions
- low cognitive load

Not a chatbot. Not a wall of text. Not a feed.

---

## 5. Recommended Information Architecture

### Top-level experience

The `Intelligence` page should have:

1. a workflow picker
2. a structured intake form
3. an "AI refined brief" confirmation step
4. a live progress state
5. a premium result dashboard
6. follow-up actions

### Workflow picker design

Use clear preset cards, not tiny tabs.

Each preset should answer:

- what this is for
- what you will get back

Example preset labels:

- `Prep for a meeting`
- `Build a business case`
- `Research an account`
- `Compare competitors`

### Intake philosophy

Keep the visible form short.

Start with 3-5 required questions.
Reveal advanced context only when it helps.

This is the Apple-like part of the product:

- simple input
- strong defaults
- powerful output

---

## 6. Structured Input Framework

The current repo already supports a basic meeting schema:

- `accountName`
- `website`
- `attendees`
- `meetingType`
- `goal`
- `notes`
- `competitors`

That is a good start, but it should become a broader workflow schema.

### Shared request envelope

```ts
type IntelligenceWorkflow =
  | 'meeting_prep'
  | 'business_case'
  | 'account_brief'
  | 'competitive_analysis'
  | 'monitor'

type IntelligenceRequest = {
  workflow: IntelligenceWorkflow
  primaryEntity: string
  entityType?: 'company' | 'person' | 'market' | 'initiative'
  userGoal: string
  userContextNotes?: string
  website?: string
  participants?: ParticipantInput[]
  compareAgainst?: string[]
  outputDepth?: 'fast' | 'standard' | 'deep'
  attachedLinks?: string[]
}

type ParticipantInput = {
  name: string
  roleHint?: string
  linkedinUrl?: string
}
```

### User-context envelope

Every request should also carry a normalized user lens:

```ts
type UserLens = {
  profileKind: string | null
  role: string | null
  industry: string | null
  company: string | null
  profilePassage: string | null
}
```

This should be fetched server-side during brief generation.

### Required intake by workflow

#### Meeting Prep

Ask:

- Who are you meeting?
- What kind of conversation is this?
- What is your goal?
- Who is attending?
- What context should we know?
- Optional website or LinkedIn URLs

Suggested subtypes:

- customer
- prospect
- partner
- reseller
- investor
- candidate
- board

#### Business Case

Ask:

- What decision or initiative are you evaluating?
- What are you trying to prove?
- What company or market is this about?
- What constraints matter?
- What proof points would make this credible?

Example:

`I want to launch a weekend delivery service. Help me build the case.`

#### Account Brief

Ask:

- Which company or account?
- What do you need to understand?
- Are you selling, partnering, or evaluating?
- Who matters on their side?

#### Competitive Analysis

Ask:

- Which company or product are we comparing?
- Who are the competitors?
- What decision is this informing?
- What dimensions matter most?

### AI intent refinement

This is a key step and should be added explicitly.

After the user fills the structured form, the system should rewrite the raw input into a sharper internal brief before research starts.

Example:

Raw user input:

`Launch weekend delivery service`

Refined system brief:

`Assess whether a weekend delivery service is commercially and operationally justified, using demand signals, peer examples, customer expectations, logistics constraints, and evidence the user can use in an internal decision conversation.`

The user should be able to see and lightly edit this refined brief if needed.

---

## 7. Search Orchestration Plan

This is the most important technical layer.

The synthesis quality will rise or fall based on how well we gather evidence.

### Research pipeline

1. collect structured user input
2. fetch the `UserLens`
3. build a workflow-specific research plan
4. dispatch searches in parallel by evidence bucket
5. normalize and deduplicate results
6. score source quality and freshness
7. synthesize facts and inferences separately
8. render a workflow-specific output schema
9. allow follow-up chat on top of the report

### Evidence buckets

Do not search with only one flat query.

Build evidence buckets first.

#### Shared buckets

- official website and about pages
- recent company or topic news
- leadership and people pages
- product or launch pages
- funding, financial, or investor pages
- hiring and careers signals
- high-authority third-party coverage

#### Meeting Prep buckets

- account overview
- recent announcements
- leadership and attendee profiles
- likely priorities or pressure points
- relevant product, GTM, or partnership signals
- competitive context

#### Business Case buckets

- market demand signals
- customer pain signals
- industry examples and analogs
- economics and operational constraints
- regulatory or logistics considerations
- internal objections or tradeoffs

#### Account Brief buckets

- company snapshot
- latest developments
- org and leadership
- strategic direction
- ecosystem and partners
- risks and opportunities

#### Competitive Analysis buckets

- competitor positioning
- recent moves
- pricing and packaging signals
- partnerships and channel activity
- hiring signals
- customer proof and case studies

### Source quality rules

The brief should prefer:

1. official and primary sources
2. high-authority reporting
3. reputable secondary sources

The system should track:

- freshness
- authority
- duplication
- evidence coverage by bucket

### Guardrails

- facts must map to explicit sources
- inferences must be labeled
- weak evidence should lower confidence
- missing evidence should be shown as unknowns, not guessed

---

## 8. Output Design by Workflow

The output should be dynamic by workflow, not one reused template.

### Shared result shell

Every result should include:

1. `Bottom line`
2. `Why this matters for you`
3. `Confidence`
4. `Key facts`
5. `Implications`
6. `Sources`
7. actions: `Share`, `Export`, `Ask follow-up`, `Refresh`

### Meeting Prep output

Recommended card order:

1. `Meeting answer`
2. `Company snapshot`
3. `People in the room`
4. `What changed recently`
5. `Opportunities to lean into`
6. `Risks and landmines`
7. `What to say`
8. `Questions to ask`
9. `Competitive context`
10. `Timeline`
11. `Sources`

### Business Case output

Recommended card order:

1. `Executive answer`
2. `Should we do this?`
3. `Proof points`
4. `Demand signals`
5. `Risks and objections`
6. `What would need to be true`
7. `Decision gaps`
8. `Suggested next steps`
9. `Sources`

### Account Brief output

Recommended card order:

1. `Bottom line`
2. `Company snapshot`
3. `What changed`
4. `Strategic priorities`
5. `Likely opportunities`
6. `Likely risks`
7. `People and leadership`
8. `Sources`

### Competitive Analysis output

Recommended card order:

1. `Comparison answer`
2. `At-a-glance comparison grid`
3. `Where they are winning`
4. `Where they are vulnerable`
5. `Positioning implications`
6. `What to do next`
7. `Sources`

---

## 9. Result Experience Design

### Design goal

The result page should feel like an intelligence dashboard.

### Visual structure

Use a layered layout:

- strong hero answer at the top
- bento grid of focused cards
- metrics and badges where available
- inline source chips
- optional timeline
- optional logos or images

### What makes it feel premium

- first answer above the fold
- clear contrast between facts and interpretation
- good use of space
- compact cards with strong headlines
- visible confidence and freshness
- obvious actions for reuse

### Numbers to surface when available

- employee count
- funding round
- source freshness
- source count
- number of recent developments
- number of people identified

### Fact vs inference treatment

Facts and analysis should look different.

For example:

- `Fact` chip for sourced events
- `Inference` chip for synthesized judgment

### Timeline

Use a dynamic timeline only when there are enough dated events to make it valuable.

Do not force a timeline into every result.

### Images

If providers return a company logo, leadership image, or useful page image, use it.

Images should support the brief, not become decoration.

---

## 10. Follow-up Actions

The feature should not end when the report appears.

### V1 actions

- `Copy summary`
- `Export report`
- `Share with team`
- `Refresh`
- `Ask a follow-up`

### Ask follow-up UX

This should be a contextual chat attached to the report, not a blank chatbot.

The system should know:

- the original request
- the user lens
- the gathered evidence
- the current synthesized report

Example follow-ups:

- "Turn this into 5 talking points for my VP."
- "What objections should I expect?"
- "What should I send my team before the call?"
- "Give me a one-page summary."

### Team-sharing UX

V1 should support at least:

- copy as clean markdown
- export as PDF
- share a stable in-app result link

---

## 11. Personalization Plan

This is one of Relevant's real moats and should be used deliberately.

### Inputs we should use

- user's role
- user's industry
- user's company
- user's profile kind
- user's stored profile passage

### How personalization should influence output

- which evidence buckets are prioritized
- what "why it matters" means
- which opportunities or risks get emphasized
- the tone and framing of suggested talking points

### What personalization should not do

- invent facts about the user
- assume hidden goals not present in input or profile
- override the user's explicit goal

---

## 12. Technical Plan for This Repo

The repo already has the right foundation:

- `src/app/app/intelligence`
- `src/app/api/intelligence/route.ts`
- `src/lib/intelligence/*`

The next step is not a rewrite. It is an expansion of the current architecture.

### Required backend changes

1. Expand the request schema from meeting-only to workflow-aware.
2. Fetch the `UserLens` in the API route or orchestration layer.
3. Add workflow-specific research-plan builders.
4. Add evidence buckets and source scoring.
5. Add workflow-specific synthesis prompts and output schemas.
6. Persist generated reports so follow-up chat and sharing work.

### Required frontend changes

1. Replace the current single meeting form with a workflow picker plus dynamic form.
2. Add the refined-brief confirmation step.
3. Redesign results around workflow-specific card layouts.
4. Add export, share, and follow-up actions.
5. Add saved-report state and rerun state.

### Suggested schema additions

```ts
type IntelligenceMode = 'guided'

type IntelligenceReport = {
  id: string
  workflow: IntelligenceWorkflow
  generatedAt: string
  request: IntelligenceRequest
  userLens: UserLens
  refinedIntent: string
  evidenceCoverage: {
    official: number
    news: number
    people: number
    market: number
    competitors: number
  }
  summary: {
    headline: string
    bottomLine: string
    whyItMattersToYou: string
    confidence: 'high' | 'medium' | 'low'
  }
  cards: IntelligenceCard[]
  sources: BriefSource[]
}
```

---

## 13. Recommended Delivery Phases

### Phase 1: Make Meeting Prep great

Ship:

- workflow picker shell
- `Meeting Prep` workflow
- refined intent step
- user lens injection
- upgraded search orchestration
- premium meeting dashboard
- copy and export

Success bar:

- clearly better than the existing `/app/intelligence` brief
- useful in one screen
- feels personalized

### Phase 2: Add Business Case

Ship:

- business case intake schema
- business-case-specific evidence buckets
- proof-point and objection cards

Success bar:

- PM, founder, or operator can use it for a real decision

### Phase 3: Add Account Brief and Competitive Analysis

Ship:

- account brief preset
- competitor comparison grid
- stronger company and market research cards

### Phase 4: Add follow-up chat and sharing

Ship:

- report-aware chat
- saved brief pages
- team share links
- PDF export polish

### Phase 5: Add Monitor

Ship:

- saved monitors
- delta reports
- rerun and alert flows

---

## 14. Success Metrics

Track:

- completion rate from start to generated brief
- time to first useful result
- export/share rate
- follow-up question rate
- repeat usage by workflow
- user feedback on usefulness
- percentage of briefs with strong source coverage

For founder review, the most important question is simple:

`Would someone trust this before an important meeting or decision?`

---

## 15. Decisions Needed From Founder

These decisions unblock clean execution:

1. Confirm the V1 workflow set:
   - recommended: `Meeting Prep`, `Business Case`, `Account Brief`, `Competitive Analysis`
2. Confirm whether attendee handling in V1 should be:
   - name only
   - name + optional LinkedIn URL
3. Confirm whether export in V1 should be:
   - copy + PDF
   - copy + PDF + share link
4. Confirm whether `Monitor` is a launch requirement or a phase-2 feature.

My recommendation:

- make `Meeting Prep` the hero workflow
- include `Business Case` in V1 because it broadens the product meaningfully
- keep `Monitor` for phase 2

---

## 16. Recommended Next Build Order

If we implement this now, the order should be:

1. upgrade the request schema and workflow picker
2. inject user profile context into orchestration
3. add refined intent generation
4. improve the research planner and evidence buckets
5. redesign the result dashboard for `Meeting Prep`
6. add `Business Case`
7. add export and follow-up chat

This path gets the product from "useful meeting brief" to "flagship intelligence feature" without throwing away the existing codebase.
