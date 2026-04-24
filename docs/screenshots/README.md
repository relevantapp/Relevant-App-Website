# Screenshot Generation Runbook

Use this when updating website screenshot assets for Relevant.

## Bottom Line

Website screenshots should come from the app repo's real Surface Lab export
pipeline. This repo usually consumes final PNGs; it should not invent fake app
screens.

- App source repo: `/Users/muggle/Dev/Relevant`
- Canonical app runbook: `/Users/muggle/Dev/Relevant/docs/screenshots/README.md`
- App export command: `npm run app-store:export:real`
- Downloads handoff folder: `/Users/muggle/Downloads/relevant-marketing-screenshots`
- Website asset folder: `public/marketing-screenshots/`
- Website usage surface: `src/app/page.tsx`

## Correct Workflow

1. Generate or refresh screenshots in `/Users/muggle/Dev/Relevant`.
2. Export them to `/Users/muggle/Downloads/relevant-marketing-screenshots`.
3. Review the PNGs for fidelity to the real app.
4. Copy selected final PNGs into this repo's `public/marketing-screenshots/`.
5. Update `src/app/page.tsx` only when adding, removing, or renaming assets.

## Do Not Do This

- Do not build website-only mock screenshots when the app repo can export the
  real surface.
- Do not replace `public/marketing-screenshots/` with unrelated mockups.
- Do not assume files in `Screenshots/` are canonical; those are older manual
  simulator captures.
- Do not edit the marketing site copy just because screenshots changed.

## Current Website Assets

The landing page currently references screenshots from
`public/marketing-screenshots/`, including:

- `home-feed.png`
- `signal-card.png`
- `signal-detail.png`
- `detail-what-happened.png`
- `detail-why-matters.png`
- `detail-what-to-do.png`
- `ask-ai.png`
- `watch-listen.png`
- `journal.png`
- `share-composer.png`
- onboarding variants

## Adding More Website Story Versions

When the founder asks for more examples for the website, coordinate with the app
repo first. New variants should be generated as real app Surface Lab surfaces,
then copied here.

Good audience lanes:

- founders
- operators
- product leaders
- investors
- consultants
- sales and partnerships

Each variant should show a different signal/story, not just a different wrapper.
The product point is role-aware relevance: what happened, why it matters, and
what to do next.
