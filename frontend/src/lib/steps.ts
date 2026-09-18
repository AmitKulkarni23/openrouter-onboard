/**
 * Step definitions for the 14-day enterprise onboarding timeline.
 * Steps unlock sequentially — each must pass before the next activates.
 */

export interface Step {
  title: string;
  day: string;
  description: string;
  apiAction: string;
  enterpriseOnly: boolean;
}

export const STEPS: Step[] = [
  {
    title: "ACTIVATION",
    day: "DAY 0–1",
    description: "Organization live, admin signed in, first API key created.",
    apiAction: "GET /auth/key — verify key and org identity",
    enterpriseOnly: false,
  },
  {
    title: "WORKSPACES & BUDGETS",
    day: "DAY 1–3",
    description: "Map workspaces to teams, create scoped API keys, set workspace budgets and rate limits.",
    apiAction: "GET /keys — list provisioned keys",
    enterpriseOnly: false,
  },
  {
    title: "GOVERNANCE",
    day: "DAY 3–5",
    description: "SSO, SCIM group mappings, Zero Data Retention, content guardrails, data-retention policy.",
    apiAction: "Validated locally — enterprise configuration",
    enterpriseOnly: true,
  },
  {
    title: "PRESETS & ROUTING",
    day: "DAY 5–7",
    description: "Create presets that name use cases instead of model versions. Configure model fallbacks and cost limits.",
    apiAction: "GET /models — verify models in catalog",
    enterpriseOnly: false,
  },
  {
    title: "BROADCAST & OBSERVABILITY",
    day: "DAY 7",
    description: "Configure Broadcast into your monitoring stack, set log retention, enable request tracing.",
    apiAction: "Configure Broadcast destinations",
    enterpriseOnly: false,
  },
  {
    title: "GO-LIVE SIGN-OFF",
    day: "DAY 14",
    description: "Test inference end-to-end, verify traces flowing, confirm production readiness, written sign-off.",
    apiAction: "POST /chat/completions — test inference",
    enterpriseOnly: false,
  },
];
