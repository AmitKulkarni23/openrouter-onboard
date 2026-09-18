/**
 * Connected-mode validation: makes real API calls to OpenRouter
 * through the Next.js proxy at /api/openrouter.
 *
 * Each step validator returns the same { passed, checks } shape
 * as the local validator, but checks are populated from live API responses.
 */

import type { ValidationResult, Check } from "./validation";

type Manifest = Record<string, unknown>;

// Helper to reach nested YAML values by dot-path
function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// All client-side calls route through the Next.js API proxy
async function proxyCall(
  endpoint: string,
  apiKey: string,
  method: string = "GET",
  body?: unknown
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch("/api/openrouter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, method, apiKey, body }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Step 1 — Org Setup
 * Calls GET /auth/key to verify the API key and confirm org identity.
 */
async function validateOrgConnected(m: Manifest, apiKey: string): Promise<ValidationResult> {
  const checks: Check[] = [];

  const { ok, data } = await proxyCall("/auth/key", apiKey);

  checks.push({
    label: "API key valid",
    passed: ok,
    detail: ok ? "Key authenticated successfully" : `Auth failed: ${data.error || "unknown error"}`,
  });

  if (ok) {
    const label = (data as Record<string, unknown>).label as string | undefined;
    checks.push({
      label: "Key label",
      passed: !!label,
      detail: label ? `"${label}"` : "No label on key",
    });

    const usage = (data as Record<string, unknown>).usage as number | undefined;
    checks.push({
      label: "Usage retrieved",
      passed: typeof usage === "number",
      detail: typeof usage === "number" ? `$${usage.toFixed(4)} used` : "Usage data unavailable",
    });

    const limit = (data as Record<string, unknown>).limit as number | null | undefined;
    checks.push({
      label: "Credit limit",
      passed: true,
      detail: typeof limit === "number" ? `$${limit} limit` : "Unlimited",
    });
  }

  // Also run local checks for org fields
  const name = get(m, "organization.name") as string | undefined;
  checks.push({
    label: "Organization name",
    passed: !!name && name.length > 0,
    detail: name ? `"${name}"` : "Missing organization name",
  });

  return { passed: checks.every((c) => c.passed), checks };
}

/**
 * Step 2 — Workspaces & API Keys
 * Calls GET /keys to list existing keys on the account.
 */
async function validateWorkspacesConnected(m: Manifest, apiKey: string): Promise<ValidationResult> {
  const checks: Check[] = [];

  const { ok, data } = await proxyCall("/keys", apiKey);

  checks.push({
    label: "Keys endpoint",
    passed: ok,
    detail: ok ? "Keys retrieved" : `Failed: ${data.error || "unknown error"}`,
  });

  if (ok && Array.isArray((data as Record<string, unknown>).data)) {
    const keys = (data as Record<string, unknown>).data as Array<Record<string, unknown>>;
    checks.push({
      label: "Active keys",
      passed: keys.length > 0,
      detail: `${keys.length} key(s) on account`,
    });
  }

  // Local checks for workspace YAML config
  const workspaces = get(m, "workspaces") as Array<Record<string, unknown>> | undefined;
  checks.push({
    label: "Workspaces defined",
    passed: Array.isArray(workspaces) && workspaces.length > 0,
    detail: Array.isArray(workspaces) ? `${workspaces.length} workspace(s)` : "No workspaces defined",
  });

  if (Array.isArray(workspaces)) {
    const noBudget = workspaces.filter((ws) => typeof ws.budget !== "number" || ws.budget <= 0);
    checks.push({
      label: "Workspace budgets",
      passed: noBudget.length === 0,
      detail:
        noBudget.length === 0
          ? "All workspaces have budgets"
          : `${noBudget.length} workspace(s) without a budget`,
    });

    const allKeys = workspaces.flatMap(
      (ws) => (ws.api_keys as Array<Record<string, unknown>>) || []
    );
    const unscopedKeys = allKeys.filter((k) => k.scope === "all" || !k.scope);
    checks.push({
      label: "API keys scoped",
      passed: unscopedKeys.length === 0,
      detail:
        unscopedKeys.length === 0
          ? "All keys properly scoped"
          : `${unscopedKeys.length} unscoped key(s): ${unscopedKeys.map((k) => k.name).join(", ")}`,
    });
  }

  return { passed: checks.every((c) => c.passed), checks };
}

/**
 * Step 3 — Security & Compliance
 * Stays local-only (enterprise features can't be verified via public API).
 */
async function validateSecurityConnected(m: Manifest): Promise<ValidationResult> {
  const { validateStep } = await import("./validation");
  return validateStep(2, m);
}

/**
 * Step 4 — Model Routing & Presets
 * Calls GET /models to verify that configured models actually exist on OpenRouter.
 */
async function validateRoutingConnected(m: Manifest, apiKey: string): Promise<ValidationResult> {
  const checks: Check[] = [];

  const presets = get(m, "presets") as Array<Record<string, unknown>> | undefined;
  checks.push({
    label: "Presets defined",
    passed: Array.isArray(presets) && presets.length > 0,
    detail: Array.isArray(presets) ? `${presets.length} preset(s)` : "No presets defined — name use cases, not models",
  });

  // Fetch available models from OpenRouter
  const { ok, data } = await proxyCall("/models", apiKey);

  if (ok && Array.isArray((data as Record<string, unknown>).data)) {
    const availableModels = ((data as Record<string, unknown>).data as Array<Record<string, unknown>>).map(
      (m) => m.id as string
    );

    checks.push({
      label: "Models catalog",
      passed: true,
      detail: `${availableModels.length} models available on OpenRouter`,
    });

    // Check each preset's primary and fallback models against the catalog
    if (Array.isArray(presets)) {
      for (const preset of presets) {
        const models = (preset.models as string[]) || [];
        const fallbacks = (preset.fallback_models as string[]) || [];
        const allModels = [...models, ...fallbacks];

        for (const modelId of allModels) {
          const exists = availableModels.includes(modelId);
          checks.push({
            label: `Model "${modelId}"`,
            passed: exists,
            detail: exists ? "Available" : "Not found in OpenRouter catalog",
          });
        }

        checks.push({
          label: `Fallback for "${preset.name}"`,
          passed: fallbacks.length > 0,
          detail:
            fallbacks.length > 0
              ? `${fallbacks.length} fallback model(s)`
              : "No fallback models configured",
        });
      }
    }
  } else {
    checks.push({
      label: "Models catalog",
      passed: false,
      detail: `Failed to fetch models: ${data.error || "unknown error"}`,
    });
  }

  const budget = get(m, "cost_limits.monthly_budget");
  checks.push({
    label: "Monthly budget",
    passed: typeof budget === "number" && budget > 0,
    detail: typeof budget === "number" ? `$${budget}/mo` : "No monthly budget set",
  });

  return { passed: checks.every((c) => c.passed), checks };
}

/**
 * Step 5 — Observability
 * Stays local-only (broadcast config is validated against the manifest).
 */
async function validateObservabilityConnected(m: Manifest): Promise<ValidationResult> {
  const { validateStep } = await import("./validation");
  return validateStep(4, m);
}

/**
 * Step 6 — Go-Live Sign-Off
 * Calls POST /chat/completions to run a real test inference through OpenRouter.
 */
async function validateGoLiveConnected(m: Manifest, apiKey: string): Promise<ValidationResult> {
  const checks: Check[] = [];

  // Run a real test inference using the first preset's primary model
  const presets = get(m, "presets") as Array<Record<string, unknown>> | undefined;
  const testModel = Array.isArray(presets) && presets.length > 0
    ? ((presets[0].models as string[]) || ["openai/gpt-4o-mini"])[0]
    : "openai/gpt-4o-mini";

  const { ok, data } = await proxyCall("/chat/completions", apiKey, "POST", {
    model: testModel,
    messages: [{ role: "user", content: "Respond with exactly: INFERENCE_OK" }],
    max_tokens: 20,
  });

  checks.push({
    label: "Test inference",
    passed: ok,
    detail: ok
      ? `Model ${testModel} responded successfully`
      : `Inference failed: ${data.error || "unknown error"}`,
  });

  if (ok) {
    const choices = (data as Record<string, unknown>).choices as Array<Record<string, unknown>> | undefined;
    const content = choices?.[0]?.message
      ? ((choices[0].message as Record<string, unknown>).content as string)
      : null;
    checks.push({
      label: "Response received",
      passed: !!content,
      detail: content ? `"${content.slice(0, 60)}"` : "Empty response",
    });

    const model = (data as Record<string, unknown>).model as string | undefined;
    checks.push({
      label: "Model used",
      passed: !!model,
      detail: model || "Unknown",
    });
  }

  // Also check local go-live sign-off flags
  const fields: [string, string][] = [
    ["go_live.test_inference_passed", "Test inference passed"],
    ["go_live.traces_verified", "Traces verified in monitoring"],
    ["go_live.monitoring_confirmed", "Monitoring confirmed"],
    ["go_live.sign_off_completed", "Written sign-off completed"],
  ];
  for (const [path, label] of fields) {
    const val = get(m, path);
    checks.push({
      label,
      passed: val === true,
      detail: val === true ? "Done" : "Not completed",
    });
  }

  return { passed: checks.every((c) => c.passed), checks };
}

/**
 * Main dispatcher for connected-mode validation.
 * Falls back to local validation if no API key is present.
 */
export async function validateStepConnected(
  stepIndex: number,
  manifest: Manifest,
  apiKey: string
): Promise<ValidationResult> {
  const validators = [
    (m: Manifest) => validateOrgConnected(m, apiKey),
    (m: Manifest) => validateWorkspacesConnected(m, apiKey),
    (m: Manifest) => validateSecurityConnected(m),
    (m: Manifest) => validateRoutingConnected(m, apiKey),
    (m: Manifest) => validateObservabilityConnected(m),
    (m: Manifest) => validateGoLiveConnected(m, apiKey),
  ];
  return validators[stepIndex](manifest);
}
