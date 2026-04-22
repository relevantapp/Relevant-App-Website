# Cross-Product UI Unification Plan: Marketing + Web App + Intelligence

## 1. Goal

Unify the public marketing site, the authenticated web app, and the Intelligence experience under one shared design system.

This is not a marketing repaint.
This is a product-wide UI unification effort.

The target outcome is:

- A user lands on the homepage and immediately feels the same product when they move into signup, onboarding, feed, signal detail, journal, profile, and Intelligence.
- Dark mode is the primary visual expression.
- Light mode is fully supported, intentional, and tested across all primary surfaces.
- Intelligence V4 becomes the design reference, but its best parts are extracted into shared primitives instead of remaining isolated behind Intelligence-only CSS scope.

## 2. Product Decision

### What we are doing

- Establish one shared visual language across marketing and app surfaces.
- Keep one shared theme model with persistent dark and light mode.
- Promote Intelligence V4 editorial density, structure, and lighting into shared system primitives.
- Refactor the real route surfaces that users actually see today.

### What we are not doing

- We are not rewriting backend workflows or changing product logic.
- We are not redesigning every piece of product information architecture.
- We are not forcing every route to look identical. The system should be shared; the page composition can still vary by use case.
- We are not starting with Tailwind as the source of truth. The current codebase relies heavily on CSS variables and route-specific CSS, so the token layer must live in `src/app/globals.css` first.

## 3. Real Implementation Surfaces

The previous plan was weak because it targeted conceptual components instead of the real live surfaces. The actual rollout must anchor to the files below.

### Foundation

- `src/app/layout.tsx`
- `src/app/globals.css`
- `tailwind.config.js` only where utility exposure is genuinely useful

### Marketing

- `src/app/page.tsx`
- `src/components/HeroHeadline.tsx`
- `src/components/NoiseToSignal.tsx`
- `src/components/FeatureBento.tsx`
- `src/components/PhoneMockup.tsx`
- `src/components/BrandMark.tsx`

### App shell

- `src/components/app/AppLayout.tsx`
- `src/components/AppLogo.tsx`
- `src/components/BrandMark.tsx`

### Auth and onboarding

- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/onboarding/page.tsx`

### Public support and secondary routes

- `src/app/signal/[id]/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/verify-email/page.tsx`

### Authenticated app routes

- `src/app/app/feed/page.tsx`
- `src/app/app/search/page.tsx`
- `src/app/app/signal/[id]/page.tsx`
- `src/app/app/intelligence/page.tsx`
- `src/app/app/intelligence/history/page.tsx`
- `src/app/app/journal/page.tsx`
- `src/app/app/profile/page.tsx`
- `src/app/app/meeting-prep/page.tsx`
- `src/app/app/building/page.tsx`

### Existing app components that must be folded into the shared system

- `src/components/app/SignalCard.tsx`
- `src/components/app/AskAIChat.tsx`
- `src/components/app/FeedBottomSheet.tsx`
- `src/components/app/FeedTuneSheet.tsx`
- `src/components/app/FeedStatsSheet.tsx`
- `src/components/app/FeedSkeleton.tsx`
- `src/app/app/intelligence/ui/primitives.tsx`

## 4. Current State Summary

### What exists today

- Theme persistence already exists via `relevant-site-theme` in `src/app/layout.tsx` and route-level theme toggles.
- Marketing and most of the web app rely on global tokens such as `--bg`, `--surface`, `--text`, and `--accent`.
- Intelligence V4 has the strongest visual system in the repo, but it is intentionally scoped to `[data-intel="v4"]` in `src/app/globals.css`.
- The homepage is composed directly in `src/app/page.tsx`, not through `Hero.tsx`, `HowItWorks.tsx`, or `WhyRelevant.tsx`.

### Why the current state feels split

- Marketing and app shell still use an older token model.
- Intelligence uses better structure, better density, and better surface behavior, but those patterns are not shared.
- Accent hierarchy is inconsistent. Intelligence is amber and green forward; the broader site still leans on blue as the default accent.
- Light mode exists mechanically, but not as a fully designed system across all pages.
- There is duplicated styling logic between marketing, app shell, and Intelligence primitives.

## 5. North Star Experience

When this is complete, a user should experience:

- One brand system from homepage to product.
- One theme toggle behavior across all routes.
- One surface language: canvas, panels, dividers, cards, tags, buttons, and forms feel related everywhere.
- One typography language: editorial display, disciplined body copy, mono labels, tabular metrics.
- One interaction language: hover lift, focus ring, active state, selected state, loading state, skeleton state.
- One responsive model: desktop, tablet, and mobile are all intentionally designed, not desktop screens shrunk down.

## 6. Design System Strategy

### 6.1 Source of truth

The shared design system should live in two layers:

1. Shared semantic tokens in `src/app/globals.css`
2. Shared React primitives used by marketing and app routes

The Intelligence route should stop being a special island over time.
The goal is to reduce the `[data-intel="v4"]` scope until it becomes either:

- a thin route-level flavor layer, or
- unnecessary because the base system fully covers it

### 6.2 Token architecture

Do not start by globally forcing the body background to Intelligence dark.
That would break the existing light mode model and create regressions across non-migrated routes.

Instead, create shared semantic tokens under `[data-theme="dark"]` and `[data-theme="light"]`, then map legacy aliases during migration.

#### Recommended semantic token families

- `--canvas`
- `--canvas-elevated`
- `--surface`
- `--surface-2`
- `--surface-3`
- `--border`
- `--border-strong`
- `--text`
- `--text-strong`
- `--text-muted`
- `--text-soft`
- `--accent-primary`
- `--accent-secondary`
- `--accent-info`
- `--accent-success`
- `--accent-warning`
- `--accent-danger`
- `--focus-ring`
- `--shadow-soft`
- `--shadow-strong`
- `--backdrop-blur`

#### Dark theme target

- Canvas: Intelligence dark base
- Surface hierarchy: Intelligence panel stack
- Primary emphasis: amber
- Secondary evidence and success: green
- Informational highlight only where useful: blue
- Danger and degraded states: red

#### Light theme target

- Same token meanings, not inverted shortcuts
- Higher border visibility than dark mode
- Lower glow intensity than dark mode
- Stronger text contrast than current light mode
- Accent values tuned for accessibility on light surfaces

### 6.3 Backward-compatible migration layer

During rollout, keep the current aliases working while routes are migrated.

Examples:

- `--bg` can temporarily map to `--canvas`
- `--bg-elevated` can temporarily map to `--canvas-elevated`
- `--surface` and `--surface-strong` can map into the new surface stack
- `--accent` should eventually map to `--accent-primary`

This avoids a high-risk big-bang refactor.

### 6.4 Typography system

Use the existing font variables already established in `src/app/layout.tsx`.

#### Shared typography primitives

- Display: `var(--font-display)` with tight negative tracking
- Body: `var(--font-sans)` with disciplined line height and slight editorial tightening
- Mono labels: `var(--font-mono)` with tabular numbers where needed

#### Standardized roles

- Page hero display
- Section heading
- Card title
- Body paragraph
- Kicker
- Meta label
- Tag or chip label
- Numeric stat or metric

#### Standardized details

- Kicker should align to Intelligence V4, not the stale marketing spec
- Tags and chips should be shared across marketing and app
- Metrics should use tabular numbers everywhere

### 6.5 Surface and interaction language

#### Structural rules

- 1px dividers and grids should be real structural primitives, not ad hoc card borders everywhere
- Surfaces should be layered by meaning: canvas, panel, elevated panel, overlay
- Hover states must not cause layout shift

#### Shared interaction rules

- Hover lift: small and consistent
- Focus ring: clear, theme-aware, keyboard-visible
- Selected state: accent border plus controlled fill
- Pressed state: subtle compression or darken, not dramatic bounce
- Motion: short, editorial, and purposeful

#### Shared primitives to support this

- `SectionFrame`
- `Panel`
- `GridBorder`
- `Button`
- `IconButton`
- `Tag`
- `SourceChip`
- `StatCell`
- `FieldShell`
- `EmptyState`
- `SkeletonBlock`

## 7. Information Architecture Rule

The system should be unified, but marketing and product still serve different jobs.

### Marketing should feel like product entry

- More immersive
- More editorial
- More explanatory
- Clear handoff into signup or app

### Product should feel like the same system under load

- More dense
- More operational
- More task-oriented
- Still visually connected to marketing

This means shared tokens and primitives, not identical layouts on every route.

## 8. Detailed Implementation Plan

### Phase 0: Alignment and Audit Freeze

### Objective

Create a stable implementation baseline before touching shared tokens.

### Tasks

1. Capture the current route inventory and designate tier-one routes.
2. Freeze the visual reference direction.
3. Decide the final accent hierarchy.
4. Decide which Intelligence patterns become shared and which stay route-specific.

### Tier-one routes for this project

- Homepage
- Login
- Signup
- Onboarding
- Feed
- Search
- Signal detail
- Intelligence
- Intelligence history
- Journal
- Profile

### Second-wave routes that must still be normalized before final closeout

- Public signal detail
- Privacy
- Terms
- Verify email

### Deliverables

- Agreed token hierarchy
- Agreed accent roles
- Agreed route priority
- Screenshot references for dark and light mode targets

### Exit criteria

- No ambiguity about whether blue or amber is the primary product accent
- No ambiguity about which files are first-wave rollout targets

### Phase 1: Shared Theme Foundation

### Objective

Move from route-scoped styling islands to one shared semantic theme model.

### Primary files

- `src/app/globals.css`
- `src/app/layout.tsx`
- `tailwind.config.js` if utility aliases are needed

### Tasks

1. Define shared semantic tokens for dark and light theme.
2. Preserve current theme persistence behavior from `src/app/layout.tsx`.
3. Update the `themeColor` metadata values to match the new dark and light canvas tokens.
4. Keep temporary aliases for `--bg`, `--surface`, `--text`, `--accent`, and related tokens to avoid breaking non-migrated pages.
5. Move any universally useful Intelligence tokens out of `[data-intel="v4"]` scope.
6. Leave route-specific Intelligence styling scoped only where it truly expresses Intelligence-specific behavior.

### Important rule

Do not make `body` permanently Intelligence-dark as a shortcut.
Dark mode should be the default theme, but light mode must remain first-class.

### Acceptance criteria

- Theme toggle still works globally
- Theme preference persists across homepage, auth, and app routes
- No route visually breaks because of missing alias tokens
- Intelligence still renders correctly while migration is in progress

### Phase 2: Shared UI Primitive Layer

### Objective

Build one reusable primitive set instead of duplicating styling logic across marketing and app routes.

### Recommended target

Create a shared primitives home such as:

- `src/components/ui/`

Then either:

- move shared parts out of `src/app/app/intelligence/ui/primitives.tsx`, or
- make that file a thin re-export layer over the new shared primitives

### Primitives to implement first

- `Button`
- `IconButton`
- `Pill` or `Tag`
- `SourceChip`
- `Card` or `Panel`
- `GridBorder`
- `FieldShell`
- `TextInput`
- `Textarea`
- `PageHeader`
- `SectionHeader`
- `StatCell`
- `Skeleton`
- `EmptyState`
- `ThemeToggle`

### Tasks

1. Normalize button variants used in marketing and app shell.
2. Standardize chip and tag behavior.
3. Standardize card surface layers and divider behavior.
4. Standardize field input styling, focus ring, help text, and error state.
5. Standardize skeleton and loading surfaces.

### Acceptance criteria

- Marketing CTAs and app buttons are drawn from one component contract
- Chips and tags no longer have multiple inconsistent sizing systems
- Shared form fields behave identically across auth, onboarding, profile, and Intelligence

### Phase 3: Shell Unification

### Objective

Make the frame around the product feel consistent before polishing every route interior.

### Primary files

- `src/components/app/AppLayout.tsx`
- `src/app/page.tsx`
- `src/components/BrandMark.tsx`
- `src/components/AppLogo.tsx`
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/onboarding/page.tsx`

### Tasks

1. Align the marketing nav and app top nav around the same spacing, border, blur, logo treatment, and action hierarchy.
2. Keep different navigation models where necessary, but make them visually related.
3. Align theme toggle treatment across marketing and app shell.
4. Unify footer and bottom navigation language.
5. Bring login, signup, and onboarding onto the same canvas, panel, and form system.

### Specific decisions

- Marketing nav can remain a simpler top-level entry shell.
- App nav can remain task-oriented with tabs.
- Both must share backdrop treatment, border logic, icon sizing, and button language.

### Acceptance criteria

- Marketing top nav and app top nav feel related
- Auth routes no longer feel like a different product
- Theme toggle looks and behaves the same everywhere

### Phase 4: Marketing Homepage Refactor

### Objective

Refactor the real homepage composition, not the stale conceptual components.

### Primary files

- `src/app/page.tsx`
- `src/components/HeroHeadline.tsx`
- `src/components/NoiseToSignal.tsx`
- `src/components/FeatureBento.tsx`
- `src/components/PhoneMockup.tsx`

### Tasks by section

#### Navigation and hero

1. Refactor the top nav in `src/app/page.tsx` to use shared shell primitives.
2. Replace legacy hero badge and CTA styling with shared primitives.
3. Keep the homepage headline structure, but bring typography onto the shared display system.
4. Rework the hero information cards so they feel structurally related to the app panels.
5. Align waitlist form styling with shared field and button primitives.

#### Signal explanation section

1. Refactor `NoiseToSignal.tsx` to use the shared panel and grid system.
2. Preserve the storytelling structure while improving alignment with app surfaces.
3. Use the same divider language and panel treatment as product routes.

#### Feature bento

1. Refactor `FeatureBento.tsx` around shared grid and surface primitives.
2. Apply shared hover behavior.
3. Keep editorial composition but reduce bespoke one-off styling.

#### Access CTA and footer

1. Refactor the access section in `src/app/page.tsx` onto shared CTA and field primitives.
2. Refactor the footer to share the same border and panel logic as the rest of the system.
3. Refactor the floating mobile CTA island to match the shared interaction language.

### Acceptance criteria

- Homepage feels like the front door to the same product as the app
- Marketing forms, CTAs, and informational cards no longer feel stylistically detached
- Mobile homepage retains the same quality as desktop in both themes

### Phase 5: Intelligence Migration from Isolated Reference to Shared System

### Objective

Keep Intelligence as the quality bar while removing unnecessary isolation.

### Primary files

- `src/app/app/intelligence/page.tsx`
- `src/app/app/intelligence/history/page.tsx`
- `src/app/app/intelligence/ui/primitives.tsx`
- `src/app/globals.css`

### Tasks

1. Move shared Intelligence typography, tags, button treatment, and panel logic into the shared primitive layer.
2. Keep Intelligence-specific layouts and evidence patterns where they are product-specific.
3. Reduce reliance on `[data-intel="v4"]` to only what is still truly route-specific.
4. Keep evidence tags, source chips, and workflow list density intact.

### Acceptance criteria

- Intelligence still feels premium and dense
- Intelligence no longer depends on a separate private design system for shared behaviors
- Shared primitives are proven in the most demanding route

### Phase 6: Core App Route Rollout

### Objective

Bring the rest of the authenticated app onto the shared system.

### Route group A: Feed, Search, and Signal detail

#### Primary files

- `src/app/app/feed/page.tsx`
- `src/app/app/search/page.tsx`
- `src/app/app/signal/[id]/page.tsx`
- `src/components/app/SignalCard.tsx`
- `src/components/app/AskAIChat.tsx`
- `src/components/app/FeedBottomSheet.tsx`
- `src/components/app/FeedTuneSheet.tsx`
- `src/components/app/FeedStatsSheet.tsx`
- `src/components/app/FeedSkeleton.tsx`

#### Tasks

1. Standardize page headers and route framing.
2. Standardize signal card surfaces, dividers, tags, metrics, and CTA patterns.
3. Standardize bottom sheet and panel styling.
4. Align Ask AI surfaces to the same chip, button, field, and panel system.
5. Align loading and empty states with the shared skeleton model.

### Route group B: Journal, Profile, and supporting routes

#### Primary files

- `src/app/app/journal/page.tsx`
- `src/app/app/profile/page.tsx`
- `src/app/app/building/page.tsx`
- `src/app/app/meeting-prep/page.tsx`

#### Tasks

1. Standardize page header patterns.
2. Standardize form fields and save states.
3. Standardize empty states and informational notices.
4. Standardize panel spacing and section hierarchy.

### Acceptance criteria

- The app feels cohesive route to route
- Signal cards, bottom sheets, page headers, and forms all feel like one system
- No route still looks visually pre-unification

### Phase 7: Auth and Onboarding Polish

### Objective

Make the transition from landing page to account creation feel seamless.

### Primary files

- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/onboarding/page.tsx`

### Tasks

1. Refactor auth panels to match shared surface and field primitives.
2. Align form hierarchy, helper text, validation, and CTA structure.
3. Align onboarding selection cards and chips to the shared tag and selection model.
4. Ensure mobile auth screens feel intentional, not just reduced.

### Acceptance criteria

- Signup no longer feels like a separate mini-app
- Onboarding feels like the bridge between homepage promise and app behavior

### Phase 8: Light Mode Completion

### Objective

Turn light mode into a designed experience rather than a token inversion.

### Tasks

1. Tune border contrast for light surfaces.
2. Reduce glow intensity in light mode.
3. Rebalance accent saturation for readability on pale surfaces.
4. Verify every shared primitive in both themes.
5. Verify route-level components with screenshots and manual QA.
6. Ensure all logos and screenshots still read properly in both themes.

### Explicit checks

- Marketing nav blur and border in light mode
- App top nav and mobile bottom nav in light mode
- All input borders and focus states in light mode
- Signal cards and Intelligence evidence panels in light mode
- Hero imagery, screenshots, and floating CTA island in light mode

### Acceptance criteria

- Light mode is visually coherent across homepage, auth, app shell, and core routes
- No component looks like a dark-mode artifact pasted onto a light background

### Phase 9: Cleanup and Removal of Legacy Styling

### Objective

Remove obsolete CSS only after routes are migrated.

### Tasks

1. Remove dead legacy classes such as old pill button helpers once replacements are live.
2. Remove duplicate marketing-only or route-only tokens that are now covered by shared semantics.
3. Remove stale Intelligence-only implementations when their behavior is now shared.
4. Delete or de-prioritize unused legacy components that are not actually on the live homepage.

### Important rule

Cleanup happens after migration, not before.
Do not delete legacy classes if any live route still depends on them.

### Acceptance criteria

- `src/app/globals.css` is simpler, not more fragmented
- Shared primitives replace duplicate route-specific styling

## 9. Recommended PR Sequence

To keep risk manageable, ship this in small vertical slices.

### PR 1

Shared token foundation and theme cleanup

### PR 2

Shared UI primitives and compatibility layer

### PR 3

App shell plus auth and onboarding unification

### PR 4

Homepage refactor

### PR 5

Intelligence migration onto shared primitives

### PR 6

Feed, search, signal detail, and support surfaces

### PR 7

Light mode polish and legacy CSS cleanup

## 10. Detailed Definition of Done

The project is done only when all of the following are true.

### System-level done criteria

- One shared token model powers marketing and app surfaces
- One shared theme model powers dark and light mode
- One shared primitive layer powers buttons, panels, tags, fields, and headers
- Intelligence no longer relies on a separate private system for shared primitives

### Marketing done criteria

- Homepage, nav, access CTA, footer, and floating mobile CTA all feel part of the same product as the app
- Marketing hero and storytelling panels use the shared surface language

### App done criteria

- App shell, feed, search, signal detail, journal, profile, and Intelligence all feel visually related
- Auth and onboarding feel like the same product as marketing and app

### Theme done criteria

- Dark mode is the default and strongest expression
- Light mode is fully designed and verified
- Theme toggle persists and behaves consistently everywhere

### Quality done criteria

- No horizontal overflow on supported mobile breakpoints
- No layout shift on hover and focus transitions
- All primary interactive controls have keyboard-visible focus states
- Lint and typecheck pass
- Route QA is completed in both dark and light mode

## 11. Validation Matrix

### Required route checks

- Homepage
- Login
- Signup
- Onboarding
- Feed
- Search
- Signal detail
- Intelligence
- Intelligence history
- Journal
- Profile

### Required viewport checks

- 390px mobile
- 768px tablet
- 1024px laptop
- 1440px desktop

### Required theme checks

- Dark mode
- Light mode
- Theme persistence after refresh
- Theme persistence across route changes

### Required quality checks

- `npm run lint`
- Typecheck or build validation for touched routes
- Manual keyboard navigation pass
- Contrast check on primary surfaces
- Hover and focus regression pass

## 12. Main Risks and Mitigations

### Risk 1: Shared token migration breaks non-migrated routes

Mitigation:

- Keep compatibility aliases during rollout
- Ship token changes before removing legacy variables

### Risk 2: Light mode gets treated as an afterthought

Mitigation:

- Validate every PR in both themes
- Do not defer light mode to the very end without route verification

### Risk 3: Intelligence loses quality during generalization

Mitigation:

- Use Intelligence as the reference route for premium density
- Only generalize primitives, not route-specific information design

### Risk 4: Homepage and app shell converge visually but product routes remain inconsistent

Mitigation:

- Explicitly include feed, search, signal detail, journal, and profile in the rollout plan
- Do not call the project done at marketing plus Intelligence only

## 13. Final Recommendation

Execute this as a cross-product system migration, not a homepage redesign.

The correct order is:

1. Shared theme foundation
2. Shared primitives
3. Shell and auth unification
4. Homepage refactor
5. Intelligence migration
6. Core app route rollout
7. Light mode polish
8. Cleanup

If the work starts anywhere else, the team will end up styling the same problems multiple times.