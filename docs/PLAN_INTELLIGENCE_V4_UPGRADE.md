# Intelligence V4 Upgrade Plan

## What's there today

**4 tools wired through one endpoint** `POST /api/intelligence`:

| Tool | Form | Orchestrator | Results |
|---|---|---|---|
| Meeting Prep | MeetingPrepForm.tsx | lib/intelligence/index.ts (V2) | IntelligenceResults.tsx |
| Business Case | BusinessCaseForm.tsx | types/business-case.ts | BusinessCaseResults.tsx |
| Competitive Intel | CompetitiveAnalysisForm.tsx | types/competitive-analysis.ts | CompetitiveResults.tsx |
| Market Research | MarketResearchForm.tsx | types/market-research.ts | MarketResearchResults.tsx |

**Common pipeline:** form → Exa + Tavily in parallel → Gemini 2.0/1.5 Flash (or OpenRouter fallback) for synthesis → render. When all LLM candidates fail, the orchestrator returns a "degraded" brief with empty sections — that's the "AI synthesis step failed" banner.

**Loading UI:** a single spinner + "Researching…" with skeleton cards. No live step-by-step.

---

## 5 Workstreams

### 1. Fix the two blockers first (diagnose before redesign)

- **Meeting Prep synthesis failing on live run.** Got evidence + person but synthesis returned null. Need to: (a) add server-side logging around each Gemini/OpenRouter candidate to capture the actual failure (401? JSON parse? timeout? prompt too large?), (b) verify `GEMINI_API_KEY` / `OPENROUTER_API_KEY` are set in the env the server is using, (c) check whether prompt size blew past context when 5 competitors + attendees.
- **Competitive Intel generate doesn't work.** Likely a different bug (request never reaches synthesis, or result shape mismatch with CompetitiveResults.tsx). Need to repro and trace: client payload → route.ts handler → orchestrator → renderer.
- **Add Claude as primary synthesis model** (Haiku 4.5 or Sonnet 4.6 — `claude-haiku-4-5-20251001`). Gemini-only is fragile; the API key is the single point of failure. Keep Gemini + OpenRouter as fallbacks.

### 2. Live research UI (the "checking this, checking that")

Replace the static spinner with a streaming progress view:

**Option 2 (chosen — richer narration):** Narrate each step with the entity — "Pulling Canadian Tire snapshot from Exa…", "Found 12 news items, reading…", "Looking up Ken Coffin on LinkedIn…", "Synthesizing with Claude…". SSE mechanism with rich event payloads.

### 3. Inputs: smarter, more intuitive (per tool)

- **Meeting Prep:** auto-fetch company website from account name, auto-suggest attendees from Exa person-search, auto-suggest competitors based on industry. Add preset chips per meeting type ("close deal", "discover needs", "renewal", "expansion").
- **Business Case:** add "comparables auto-suggest" after initiative name. Drop `keyQuestions` textarea in favor of 2-3 focused chip questions.
- **Competitive Intel:** after first competitor entered, suggest the other 2 automatically. Make `yourCompany` actually required.
- **Market Research:** collapse `scope` + `timeHorizon` + `knownPlayers` into a smaller optional "narrow it down" drawer — the only required field should be the market/trend.

### 4. Outputs: less texty, more post-worthy

Move each tool toward **hero visual + scannable cards + one quote-worthy "pull quote"**:

- **Meeting Prep** → big "bottom line" callout, 3 talking-point cards (visual icons), "do/don't" split for landmines, attendee cards with photo + headline.
- **Business Case** → verdict badge as hero (Strong / Moderate / Weak with color + score), "evidence scoreboard" showing supporting N vs risk N with progress bar, comparable company logos.
- **Competitive Intel** → comparison matrix as hero (first thing user sees, not buried below competitor cards).
- **Market Research** → market overview as "TAM + growth + key trend" strip; player landscape as 2×2 positioning grid (leader/challenger/niche/emerging).

Also: **"Export as image / Copy as LinkedIn post"** button that renders results to a shareable PNG.

### 5. Cross-tool polish

- Unify degraded-state copy (currently four slightly different strings).
- Unified `StatusBar` surfacing *which* provider failed ("AI was down" vs "Exa was down").
- Shared prompt template library so tuning one tool doesn't drift the others.

---

## Implementation Order

1. **Diagnose + fix Meeting Prep synthesis** (add logging, add Claude) — unblocks live demo.
2. **Fix Competitive Intel generate.**
3. **Live streaming research UI** (workstream 2).
4. **Output redesign** one tool at a time, starting with Meeting Prep (demo tool).
5. **Input smarts + export-as-image** last.
