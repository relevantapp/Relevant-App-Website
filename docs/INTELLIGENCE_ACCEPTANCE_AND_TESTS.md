# Intelligence - Acceptance Criteria and Live Test Matrix

> This document defines what must be true before the coding agent returns the feature for founder review.

---

## Global Acceptance Criteria

### Product

- [ ] The feature is called `Intelligence` in the app UI
- [ ] The product feels like a role-aware relevance engine, not a generic feed or chatbot
- [ ] `Prep` mode is clearly the strongest and most useful mode
- [ ] The result page answers the meeting question before showing raw research detail
- [ ] The visual language matches the rest of the app

### Experience

- [ ] Users can create a useful brief without crafting a perfect search query
- [ ] The page feels interactive through meaningful actions, not gimmicks
- [ ] The result is scannable on first load
- [ ] Citations are accessible on important claims
- [ ] Confidence or degraded states are visible when evidence is weak

### Engineering

- [ ] Live provider integration works in deployed environment
- [ ] No provider secret is exposed client-side
- [ ] Request validation rejects malformed input
- [ ] Empty, partial, and failure states are handled cleanly
- [ ] Caching works
- [ ] Refresh works

### Deployment

- [ ] Local dev works
- [ ] Preview or production deployment works
- [ ] Environment variables are configured
- [ ] Feature flags behave correctly

---

## Mode-Specific Acceptance Criteria

### Prep mode

- [ ] User can enter account, goal, notes, attendees, and optional competitors
- [ ] Returned brief contains:
- [ ] bottom line
- [ ] what changed
- [ ] why it matters to them
- [ ] why it matters to you
- [ ] what to say
- [ ] questions to ask
- [ ] likely objections or tensions
- [ ] sources
- [ ] The first screen is useful before the user scrolls deeply

### Research mode

- [ ] User can research a company, person, or topic
- [ ] Output is broader than Prep mode
- [ ] Research mode does not force meeting framing

### Monitor mode

- [ ] User can create a monitor
- [ ] User can run a monitor manually
- [ ] Result highlights delta since last run
- [ ] Monitor failure states are understandable

---

## Live Test Scenarios

These must be run against live providers, not mocked provider responses.

### Scenario 1 - High-coverage company prep

Input:

- mode: `Prep`
- company: a well-covered live company
- goal: real meeting goal

Pass when:

- [ ] brief returns within acceptable time
- [ ] multiple recent sources are present
- [ ] `what changed` is genuinely recent
- [ ] `what to say` is tied to the goal

### Scenario 2 - Mid-coverage company prep

Input:

- mode: `Prep`
- company: real but less-covered company

Pass when:

- [ ] product still returns a usable brief
- [ ] confidence or degraded state adjusts correctly
- [ ] system does not invent certainty

### Scenario 3 - Attendee-aware prep

Input:

- mode: `Prep`
- company + at least one attendee name

Pass when:

- [ ] product tries to incorporate attendee context when evidence exists
- [ ] weak attendee evidence is disclosed as low confidence or omitted

### Scenario 4 - Research mode

Input:

- mode: `Research`
- entity: company, person, or market topic

Pass when:

- [ ] result is clearly not just the Prep template reused badly
- [ ] research output stays broad and useful

### Scenario 5 - Monitor mode

Input:

- create monitor on a real company
- run now

Pass when:

- [ ] monitor completes
- [ ] result highlights current deltas
- [ ] monitor configuration is preserved

### Scenario 6 - Degraded / low-evidence case

Input:

- obscure company or weakly covered entity

Pass when:

- [ ] page does not break
- [ ] confidence lowers
- [ ] user sees a useful explanation

---

## UI Test Checklist

### Desktop

- [ ] Intelligence route loads
- [ ] Mode tabs switch cleanly
- [ ] Prep form is readable
- [ ] Results hierarchy is correct
- [ ] Quick actions work
- [ ] Citations reveal correctly
- [ ] Save works
- [ ] Refresh works

### Mobile

- [ ] Form fields fit on narrow screens
- [ ] Result cards do not overflow
- [ ] Quick actions remain usable
- [ ] Citations and collapsibles are easy to tap
- [ ] No broken fixed-height layouts

---

## Security and Connectivity Tests

- [ ] `EXA_API_KEY` is only used server-side
- [ ] Optional `TAVILY_API_KEY` is only used server-side
- [ ] No secrets appear in browser network payloads beyond the app's own request
- [ ] Failed provider calls are logged server-side
- [ ] Client sees safe error messages only

---

## Performance Gates

- [ ] First useful state appears quickly
- [ ] Long requests show progress
- [ ] Cached result is faster than uncached result
- [ ] Refresh invalidates or bypasses cache when asked

---

## Regression Checklist

- [ ] App navigation still works
- [ ] Existing feed page still works
- [ ] Existing signal detail page still works
- [ ] Existing auth flow still works
- [ ] Existing search page still works
- [ ] Old `/app/meeting-prep` entry point does not hard-fail

---

## Required Evidence Before Returning to Founder

The coding agent should not say "done" until it has all of this:

- [ ] Live screenshots or verified UI walkthrough of the main flow
- [ ] Notes from at least 3 real test scenarios
- [ ] Confirmation that provider connectivity is live
- [ ] Confirmation that save and refresh work
- [ ] Confirmation that degraded mode was tested
- [ ] Confirmation that mobile was tested
- [ ] Confirmation that deployment env was set correctly

---

## Final Ship Gate

Feature is ready for founder review only when:

- [ ] Core Prep flow is clearly better than the old dossier
- [ ] The result feels grounded, useful, and role-aware
- [ ] The UI still feels like Relevant
- [ ] Live tests pass
- [ ] No critical regressions remain

