# openrouter-onboard

A local web tool that walks enterprise customers through OpenRouter's 14-day onboarding journey — from contract signature to production go-live. Left pane is a YAML editor holding the onboarding manifest, right pane is a sequential checklist with a "Try Now" button that validates locally or provisions real resources via the OpenRouter Management API.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Next.js (App Router)
- **Deployment:** Vercel
- **API Integration:** OpenRouter Management API (proxied through Next.js API routes)
- **YAML Parsing:** js-yaml

## Running Locally

```sh
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).
