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
    description: "Organization live, admin signed in, management key ready.",
    apiAction: "GET /workspaces — verify management key works",
    enterpriseOnly: false,
  },
  {
    title: "WORKSPACES & BUDGETS",
    day: "DAY 1–3",
    description: "Create workspaces, set budgets, provision scoped API keys with rate limits.",
    apiAction: "POST /workspaces + PUT /budgets + POST /keys",
    enterpriseOnly: false,
  },
  {
    title: "PRESETS & ROUTING",
    day: "DAY 3–5",
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
    apiAction: "POST /chat/completions — test inference with API key",
    enterpriseOnly: false,
  },
];
