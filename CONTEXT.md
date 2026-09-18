# OpenRouter FDE Application — POC Context

## What This Is

A demo POC for applying to the **Forward Deployed Engineer** role at OpenRouter. The deliverable is a video showing a tool that walks an enterprise customer through OpenRouter's onboarding journey — from contract signature to production go-live on Day 14.

## The Problem

OpenRouter's enterprise onboarding is a 14-day, FDE-assisted process. The FDE can't configure anything — the customer's team does it all. Today this happens across multiple calls, Slack threads, and dashboard sessions with no single artifact that tracks "here's where you are, here's what's left."

## The Tool: `openrouter-onboard`

A local web application (Next.js) that turns the onboarding journey into a validatable, executable artifact.

### Layout

- **Left pane:** YAML editor — the onboarding manifest. This is the shared contract between FDE and customer. It defines org details, workspaces, API keys, security settings, routing presets, observability config, and production readiness flags.
- **Right pane:** Sequential checklist — a step-by-step flow that maps to the real 14-day onboarding timeline. Steps unlock one at a time, top to bottom.
- **"Try Now" button (top right):** Runs the current step against OpenRouter's API. The step either passes (turns green, next step unlocks) or fails (shows error inline, user fixes YAML, tries again).

### The 6 Steps (Sequential)

| # | Step | Day | API Action |
|---|------|-----|------------|
| 1 | Organization Setup | 0–1 | Verify org exists via Management API |
| 2 | Workspaces & API Keys | 1–2 | Provision workspaces, create scoped keys |
| 3 | Security & Compliance | 3–5 | Enterprise-only (SSO, ZDR, guardrails) — validated locally |
| 4 | Model Routing & Presets | 5–7 | Create presets, enable fallbacks |
| 5 | Observability | 7 | Configure broadcast destinations |
| 6 | Production Readiness | 14 | Run test inference, verify traces, go-live check |

### Two Modes

1. **Validate mode (offline):** Edit YAML, checklist validates locally, catches misconfigs before touching OpenRouter.
2. **Apply mode (connected):** Connect with Management API key, "Try Now" makes real API calls, provisions actual resources.

### Demo Org

- **Name:** NullPointer Industries
- **Tagline:** "AI that definitely won't segfault... probably"
- **Domain:** nullpointer.dev
- The initial YAML manifest is pre-loaded with deliberate problems (unscoped API key named "dev-yolo-key", no fallback model, SSO/ZDR disabled, observability off).

## The Pitch

"Your docs tell enterprises *what* to do. This tool *does it with them*. Your FDEs are spending time on checklist management — this tool turns the onboarding journey into a validatable artifact, so FDEs spend time on strategy, not status checks."

## Video Flow

1. Open tool, show the broken YAML manifest for NullPointer Industries
2. Walk through checklist — Step 1 active, rest locked
3. Hit "Try Now" — passes or fails with inline feedback
4. Fix YAML issues, try again, step goes green, next unlocks
5. Show failure scenarios (unscoped key, no fallback, no observability)
6. Connect to real OpenRouter API — show actual provisioning
7. Final step: test inference call returns a real response
8. All green — Day 14 Go-Live — "Ship it."

## Technical Stack

- **Framework:** Next.js (App Router)
- **YAML parsing:** js-yaml
- **API integration:** OpenRouter Management API (proxied through Next.js API routes)
- **Styling:** Tailwind or hand-rolled CSS (TBD)
- **Key OpenRouter APIs:**
  - `GET/POST /api/v1/workspaces` — workspace management
  - `GET/POST /api/v1/keys` — API key provisioning
  - `POST /api/v1/presets` — preset creation
  - `POST /api/v1/chat/completions` — test inference
  - `GET /api/v1/analytics` — trace verification
  - `GET /api/v1/organization` — org verification

## Source Docs

- [Enterprise Onboarding Journey](https://openrouter.ai/docs/cookbook/get-started/enterprise-onboarding-journey.md)
- [Enterprise Quickstart](https://openrouter.ai/docs/cookbook/get-started/enterprise-quickstart.md)

## Prior Artifacts

- [v1 — YAML validator only](https://claude.ai/artifact/EvUmVQWvGRFJ78ZcfyDX3A)
- [v2 — With API console & connection](https://claude.ai/artifact/EGWKxVpGvNAfCB3GzhBaBb)
- v3 (final) — Sequential checklist with "Try Now" (to be built as Next.js app)
