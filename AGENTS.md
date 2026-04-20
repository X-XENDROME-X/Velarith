# Velarith — Agent Orientation

> **First action for any AI agent (Cursor, Claude Code, Antigravity, Codex, etc.): read `.agents/` before touching code.**

This repo is an **AI-powered prediction market research tool**. Prediction markets (Polymarket) are the core product; stock technicals, fundamentals, and sentiment are framed as supporting evidence for bet decisions.

## Where the context lives

All persistent project context is in the gitignored [`.agents/`](.agents/) folder. That folder travels with the local workspace and is the single source of truth across IDEs and AI tools. Keep it updated when decisions change.

Start here, in this order:

1. [`.agents/README.md`](.agents/README.md) — what each doc contains and how to navigate the folder
2. [`.agents/project-context.md`](.agents/project-context.md) — product positioning + user journey
3. [`.agents/plan.md`](.agents/plan.md) — the revival roadmap (milestones, status)
4. [`.agents/decisions.md`](.agents/decisions.md) — locked architectural choices
5. [`.agents/pages.md`](.agents/pages.md) — page-by-page spec
6. [`.agents/tech-stack.md`](.agents/tech-stack.md) — current versions + upgrade history
7. [`.agents/runbook.md`](.agents/runbook.md) — how to run dev, deploy, rotate keys
8. [`.agents/api-keys.md`](.agents/api-keys.md) — which keys are used where
9. [`.agents/known-issues.md`](.agents/known-issues.md) — bugs + gotchas
10. [`.agents/prompts.md`](.agents/prompts.md) — opening/closing prompts for session continuity

## House rules for agents

- **Never commit `.env`, `.env.local`, or anything under `.agents/`** — all gitignored.
- **Prediction markets first.** When designing features, always ask: "how does this help the user make a better bet?" Stock research is the evidence engine, not the product.
- **Two-tier AI routing.** Claude Sonnet 4.5 primary, Groq Llama 3.3 70B fallback. All AI calls go through the provider abstraction (frontend: Vercel AI SDK; backend: `backend/services/ai_provider.py`). Never hardcode a provider.
- **Free tier discipline.** Every new dependency or service must have a free tier that fits this project's scale. Paid-only services are rejected.
- **Lean v1 first.** No auth, no DB, watchlist in localStorage. Auth + Supabase are v2, optional.
- **Code style.** Read user rules in [`.cursor/rules/`](.cursor/rules/) if present. Concise, readable, separation-of-concerns, no verbose comments.

## When you finish a task

Update [`.agents/plan.md`](.agents/plan.md) milestone status and append to [`.agents/decisions.md`](.agents/decisions.md) if you made a non-obvious architectural choice.
