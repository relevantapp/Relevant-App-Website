# Intelligence - Execution Checklist

Use this as the coding-agent run sheet.

## Founder Inputs

- [ ] Get `EXA_API_KEY`
- [ ] Get Exa onboarding-generated integration snippet
- [ ] Decide whether `TAVILY_API_KEY` is in scope now or later
- [ ] Decide whether X is in scope now or later
- [ ] Get 3 real founder test scenarios
- [ ] Confirm deployment target

## Phase 1 - Product shell

- [ ] Rename nav label from `Research` to `Intelligence`
- [ ] Add `/app/intelligence`
- [ ] Redirect `/app/meeting-prep` to the new route
- [ ] Add mode tabs: `Prep`, `Research`, `Monitor`
- [ ] Keep current app shell and component language

## Phase 2 - Prep form

- [ ] Replace generic query-first UI with structured Prep inputs
- [ ] Add meeting type quick chips
- [ ] Add goal field
- [ ] Add notes field
- [ ] Add attendee input
- [ ] Add optional competitors input
- [ ] Keep mobile layout tight and readable

## Phase 3 - API and provider layer

- [ ] Add `/api/intelligence`
- [ ] Create provider abstraction
- [ ] Implement Exa provider
- [ ] Keep provider calls server-side only
- [ ] Add optional Tavily provider behind feature flag
- [ ] Normalize evidence into shared shape

## Phase 4 - Brief synthesis

- [ ] Replace dossier response schema with Intelligence schema
- [ ] Add sections for `what changed`, `why it matters to them`, `why it matters to you`, `what to say`, `questions`, `objections`
- [ ] Tag bullets as fact or inference
- [ ] Attach source ids to visible claims
- [ ] Add confidence and degraded state support

## Phase 5 - Results experience

- [ ] Reorder result page around the meeting answer
- [ ] Move timeline lower
- [ ] Add citation reveal actions
- [ ] Add `Refresh brief`
- [ ] Add `Save`
- [ ] Add `Copy`
- [ ] Add `Compare competitor`
- [ ] Add `Turn into follow-up`

## Phase 6 - Persistence and feedback

- [ ] Save brief requests and outputs
- [ ] Reopen saved briefs
- [ ] Persist feedback events
- [ ] Track copy/save/refresh usage

## Phase 7 - Monitor mode

- [ ] Add monitor setup form
- [ ] Add monitor list
- [ ] Add `Run now`
- [ ] Return delta-focused result
- [ ] Use scheduled monitors only if stable

## Phase 8 - Hardening

- [ ] Add feature flags
- [ ] Add error states
- [ ] Add request-level logs
- [ ] Add provider latency logging
- [ ] Add cache hit/miss logging
- [ ] Add timeout handling

## Phase 9 - Live QA before return

- [ ] Test on real companies
- [ ] Test on mobile
- [ ] Test on desktop
- [ ] Test degraded / low-evidence case
- [ ] Test refresh behavior
- [ ] Test saved brief reopen
- [ ] Test monitor create and run
- [ ] Verify deployment env variables
- [ ] Verify live provider connectivity
- [ ] Verify no API secrets leak to client

## Out of scope for first release unless explicitly approved

- [ ] CRM sync
- [ ] Calendar auto-briefing
- [ ] Full attendee org-chart intelligence
- [ ] X as required source
- [ ] X share workflow
- [ ] Large visual redesign

