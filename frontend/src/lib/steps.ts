export interface Step {
  title: string;
  day: string;
  description: string;
  apiAction: string;
  enterpriseOnly: boolean;
}

export const STEPS: Step[] = [
  {
    title: "ORGANIZATION SETUP",
    day: "DAY 0–1",
    description: "Verify org exists, confirm enterprise plan, set admin contact.",
    apiAction: "Verify org via Management API",
    enterpriseOnly: false,
  },
  {
    title: "WORKSPACES & API KEYS",
    day: "DAY 1–2",
    description: "Provision workspaces, create scoped API keys with rate limits.",
    apiAction: "Provision workspaces, create keys",
    enterpriseOnly: false,
  },
  {
    title: "SECURITY & COMPLIANCE",
    day: "DAY 3–5",
    description: "Enable SSO, SCIM provisioning, zero data retention, content guardrails.",
    apiAction: "Validated locally — enterprise features",
    enterpriseOnly: true,
  },
  {
    title: "MODEL ROUTING & PRESETS",
    day: "DAY 5–7",
    description: "Create routing presets with fallback models, set cost limits and alerts.",
    apiAction: "Create presets, enable fallbacks",
    enterpriseOnly: false,
  },
  {
    title: "OBSERVABILITY",
    day: "DAY 7",
    description: "Configure broadcast destinations, set log retention, enable request tracing.",
    apiAction: "Configure broadcast destinations",
    enterpriseOnly: false,
  },
  {
    title: "PRODUCTION READINESS",
    day: "DAY 14",
    description: "Run load tests, verify failover, confirm monitoring, document runbook.",
    apiAction: "Run test inference, verify traces",
    enterpriseOnly: false,
  },
];
