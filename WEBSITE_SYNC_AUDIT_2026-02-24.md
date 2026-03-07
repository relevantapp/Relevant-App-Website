# Website Sync Audit (App vs Website)

Date: February 24, 2026

## Scope
Audit of the live/app messaging and product reality against the website codebase in `/Users/akshitsama/Desktop/Website`.

## Executive Summary
The website was materially behind the product. It positioned Relevant as a generic personalized news feed, while the app is now a role-aware relevance engine built around three outputs: what happened, why it matters to this user, and what to do next. The visual identity and share surface were also out of sync.

## Findings

1. Positioning drift (critical)
- Website headline/metadata leaned on "personalized news feed" language.
- App mission is now a role-aware influence/relevance engine, not a generic feed.

2. Promise drift (critical)
- Website messaging did not consistently reinforce the core 3-part output structure.
- App onboarding and signal detail are explicitly organized around that structure.

3. Product surface drift (high)
- Website copy underrepresented the active app surfaces (Lens setup, role-aware feed, Goal Coach, share pages).
- Visitors could not understand current product depth from the website alone.

4. Share-surface fragility (high)
- Root `?signal=<id>` behavior existed in live compiled output but not clearly represented in current source structure.
- Risk: share contract and source code could drift again without an explicit route in repo.

5. Visual language mismatch (high)
- Website visual style felt like an earlier minimal landing page.
- App has stronger identity cues and a more opinionated information architecture.

6. Operational data capture gaps (medium)
- Waitlist flow captured email, but platform/source context was weak in code-level handling.
- Reduced ability to prioritize onboarding follow-up.

## Decisions Applied In This Update

1. Reposition site around the current app truth:
- "Not a generic news feed"
- "What happened / Why it matters to you / What to do next"

2. Implement immersive visual system aligned to current product tone:
- Layered atmospherics, premium panels, stronger typographic hierarchy, and motion accents.

3. Add explicit source-level share route:
- `/signal/[id]` now exists in repo and renders live `public-signal` payloads.

4. Keep waitlist workflow but make it operationally richer:
- Capture platform/source metadata in waitlist request handling.

## Delivery Plan (Execution Order)

1. Messaging foundation
- Lock voice, promise hierarchy, and section order around product truth.

2. Visual system
- Apply one coherent direction across hero, content sections, and CTA flow.

3. Share contract
- Ensure root `?signal=<id>` handoff and `/signal/[id]` rendering are first-class and maintained in source.

4. Conversion + instrumentation
- Improve access form context capture (platform/source) for follow-up quality.

5. QA and release
- Lint, type/build validation, mobile/desktop pass, then deploy.

## Risks Remaining

1. `NEXT_PUBLIC_SUPABASE_URL` must exist in Vercel for `/signal/[id]` to render live data.
2. Existing policy/legal copy may need final legal review if product claims evolve.
3. App screenshots can age quickly; update assets as UI evolves.
