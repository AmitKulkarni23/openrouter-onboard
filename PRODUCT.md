# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router), Bun, Vercel, js-yaml. Delegated: user chose Next.js + Bun + Vercel explicitly.

## Users

Two co-equal users in the same session:

1. **OpenRouter Forward Deployed Engineer (FDE):** Owns enterprise onboarding from contract signature through Day 14 go-live. Currently manages this across calls, Slack threads, and dashboard walkthroughs with no single tracking artifact. Runs 3–5 onboardings simultaneously.
2. **Enterprise engineering team (customer):** The people who actually configure workspaces, API keys, SSO, presets, and observability on OpenRouter. They do all the work — OpenRouter cannot configure their org for them. Need clear guidance on what's done, what's blocking, and what's next.

## Product Purpose

Turns OpenRouter's 14-day enterprise onboarding journey into a validatable, executable artifact. A YAML manifest defines the desired org configuration. A sequential checklist validates it locally and optionally provisions real resources via the OpenRouter Management API. The goal is to compress a multi-meeting, Slack-heavy process into a structured flow where the FDE spends time on strategy, not status checks.

## Positioning

The only tool that bridges OpenRouter's onboarding documentation and the customer's actual environment. Docs tell you what to do; this tool does it with you — validating config before it's applied, catching misconfigurations early, and providing a single artifact (the manifest) that both FDE and customer can point to as the source of truth.

## Operating Context

- FDE and customer open the tool side-by-side during pairing sessions (screen share or same room)
- Customer's team also uses it async between calls to self-serve checklist progress
- The YAML manifest is the shared contract — FDE can pre-fill it, customer edits it, tool validates it
- Steps are sequential: Step 1 must pass before Step 2 unlocks (mirrors the real onboarding timeline)
- "Try Now" runs the current step — either local validation or a real API call to OpenRouter
- Some steps (SSO, ZDR, guardrails) require enterprise plan access and can only be validated locally

## Capabilities and Constraints

**Confirmed capabilities:**
- YAML editor with live parsing and error reporting
- 6-step sequential checklist mapping to the 14-day onboarding timeline
- Local validation mode (no API key needed)
- Connected mode (Management API key provisions real resources)
- Per-step "Try Now" button: validates or provisions the current step
- Steps: Org Setup → Workspaces & API Keys → Security & Compliance → Model Routing & Presets → Observability → Production Readiness
- Test inference call as final production readiness check

**Constraints:**
- OpenRouter Management API access required for connected mode
- Enterprise-only features (SSO, SCIM, ZDR, guardrails) cannot be provisioned via API on non-enterprise plans — validated locally only
- Tool runs locally; no data leaves the machine unless the user connects to OpenRouter
- Demo org is "NullPointer Industries" with deliberate misconfigurations for demo narrative

**Undecided:**
- Whether the tool should support exporting the manifest for handoff
- Whether to add a "Day X" progress timeline visualization

## Brand Commitments

OpenRouter-adjacent aesthetic: inspired by OpenRouter's visual identity (their colors, spatial feel) without copying it. The tool should feel like it belongs in the OpenRouter ecosystem — something an FDE would plausibly hand to a customer.

## Evidence on Hand

- OpenRouter Enterprise Onboarding Journey documentation (fetched, summarized in CONTEXT.md)
- OpenRouter Enterprise Quickstart documentation (fetched, summarized in CONTEXT.md)
- Two interactive artifact prototypes exploring layout and interaction patterns (v1: YAML + validation, v2: YAML + connection + API console)
- No real OpenRouter API credentials yet; demo uses simulated responses

## Product Principles

1. **Sequential, not parallel.** The onboarding is a journey with dependencies. The tool enforces order so nothing gets skipped.
2. **Validate before you provision.** Catch misconfigurations in the YAML before making real API calls. The cheapest mistake is the one you never make.
3. **One artifact, two audiences.** The manifest serves both the technical team (YAML they can edit) and the FDE (checklist they can track). Same data, two views.
4. **Honest about limits.** Enterprise-only features say "Enterprise Only" — no fake success states. The tool earns trust by being transparent about what it can and can't do.
5. **Local first.** Everything works offline with local validation. API connection is an enhancement, not a requirement.
