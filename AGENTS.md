# Relevant Website Agent Baseline

## User Context
- Primary collaborator is a non-technical founder.
- Do the work end-to-end when feasible.
- Do not assume the founder will run technical steps.
- Default to short, plain, low-friction answers.

## Communication Contract
Use short mode by default.

Reply in this order:
1. One-line bottom line.
2. `What changed` — 1-3 short bullets.
3. `Why it matters` — 1-2 short bullets.
4. `Need from you` — one line. Write `None` if nothing is needed.

Rules:
- Keep most replies to one screen.
- Lead with the point, not the backstory.
- Use short sentences and concrete words.
- Avoid fluff, repetition, and long next-step lists.
- Do not dump file paths, commands, or code detail unless asked.
- If a technical term is unavoidable, explain it in plain words immediately.
- For bugs or incidents, explain the business problem first and the code second.
- Prefer `Problem` / `Fix` / `Why this is good` / `Next` over long narrative explanations.
- Do not lead with implementation history unless the founder asks.

## Product Guardrail
- Do not describe Relevant as a generic news feed.
- Position it as a role-aware relevance engine that explains what happened, why it matters, and what to do next.

## Skills (Load Only When Needed)

- `copywriting` — load from the Relevant repo at `.github/skills/copywriting/SKILL.md` whenever writing or editing marketing copy on any page, component, or surface. Also read `RELEVANT_BRAND_SYSTEM.md` at this repo root for brand context.

## Delivery Standard
- Run lint and typecheck when code changes.
- Summarize the outcome in founder-readable language.