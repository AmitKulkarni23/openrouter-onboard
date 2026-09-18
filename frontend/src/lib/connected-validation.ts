import type { ValidationResult, Check } from "./validation";

type Manifest = Record<string, unknown>;

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

async function proxyCall(
  endpoint: string,
  apiKey: string,
  method: string = "GET",
  body?: unknown
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch("/api/openrouter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, method, apiKey, body }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/**
 * Step 1 — Activation
 * Uses management key to GET /workspaces, proving the key works and the account exists.
 */
async function validateActivationConnected(m: Manifest, mgmtKey: string): Promise<ValidationResult> {
  const checks: Check[] = [];

  const { ok, data } = await proxyCall("/workspaces", mgmtKey);

  checks.push({
    label: "Management key valid",
    passed: ok,
    detail: ok ? "Management key authenticated" : `Auth failed: ${(data.error as string) || "unknown error"}`,
  });

  if (ok) {
    const workspaces = (data as Record<string, unknown>).data as Array<Record<string, unknown>> | undefined;
    checks.push({
      label: "Account workspaces",
      passed: true,
      detail: `${Array.isArray(workspaces) ? workspaces.length : 0} existing workspace(s) on account`,
    });
  }

  const name = get(m, "organization.name") as string | undefined;
  checks.push({
    label: "Organization name",
    passed: !!name && name.length > 0,
    detail: name ? `"${name}"` : "Missing organization name",
  });

  const domain = get(m, "organization.domain") as string | undefined;
  checks.push({
    label: "Domain configured",
    passed: !!domain && domain.includes("."),
    detail: domain ? domain : "Missing domain",
  });

  return { passed: checks.every((c) => c.passed), checks };
}

/**
 * Step 2 — Workspaces & Budgets
 * Creates workspaces, sets budgets, and provisions API keys using the management key.
 */
async function validateWorkspacesConnected(m: Manifest, mgmtKey: string): Promise<ValidationResult> {
  const checks: Check[] = [];
  const workspaces = get(m, "workspaces") as Array<Record<string, unknown>> | undefined;

  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    checks.push({ label: "Workspaces defined", passed: false, detail: "No workspaces in YAML" });
    return { passed: false, checks };
  }

  // First, list existing workspaces to avoid duplicates
  const { ok: listOk, data: listData } = await proxyCall("/workspaces", mgmtKey);
  const existingWorkspaces = listOk && Array.isArray((listData as Record<string, unknown>).data)
    ? ((listData as Record<string, unknown>).data as Array<Record<string, unknown>>)
    : [];
  const existingSlugs = new Set(existingWorkspaces.map((ws) => ws.slug as string));

  for (const ws of workspaces) {
    const wsName = ws.name as string;
    const slug = wsName.toLowerCase().replace(/\s+/g, "-");
    const budget = ws.budget as number | null;

    // Create workspace if it doesn't exist (skip "default" — always exists)
    if (existingSlugs.has(slug) || slug === "default") {
      checks.push({
        label: `Workspace "${wsName}"`,
        passed: true,
        detail: "Already exists",
      });
    } else {
      const { ok, data } = await proxyCall("/workspaces", mgmtKey, "POST", {
        name: wsName,
        slug,
        description: (ws.description as string) || "",
      });
      checks.push({
        label: `Create workspace "${wsName}"`,
        passed: ok,
        detail: ok ? `Created (slug: ${slug})` : `Failed: ${(data.error as string) || JSON.stringify(data).slice(0, 100)}`,
      });
    }

    // Set monthly budget if specified
    if (typeof budget === "number" && budget > 0) {
      const { ok: budgetOk, data: budgetData } = await proxyCall(
        `/workspaces/${slug}/budgets/monthly`,
        mgmtKey,
        "PUT",
        { limit_usd: budget }
      );
      checks.push({
        label: `Budget for "${wsName}"`,
        passed: budgetOk,
        detail: budgetOk ? `$${budget}/mo set` : `Failed: ${(budgetData.error as string) || "unknown error"}`,
      });
    } else {
      checks.push({
        label: `Budget for "${wsName}"`,
        passed: false,
        detail: "No budget set — add budget: <amount> to the workspace",
      });
    }

    // Provision API keys for this workspace
    const wsKeys = (ws.api_keys as Array<Record<string, unknown>>) || [];
    for (const key of wsKeys) {
      const keyName = key.name as string;
      const scope = key.scope as string;
      const rateLimit = key.rate_limit as number | null;

      if (scope === "all" || !scope) {
        checks.push({
          label: `Key "${keyName}" scope`,
          passed: false,
          detail: `Scope is "${scope || "unset"}" — change to "workspace"`,
        });
        continue;
      }

      if (!rateLimit) {
        checks.push({
          label: `Key "${keyName}" rate limit`,
          passed: false,
          detail: "No rate limit — set rate_limit to a number",
        });
        continue;
      }

      // Find workspace ID for key creation
      const { ok: wsGetOk, data: wsGetData } = await proxyCall(`/workspaces/${slug}`, mgmtKey);
      const workspaceId = wsGetOk ? ((wsGetData as Record<string, unknown>).data as Record<string, unknown>)?.id as string : null;

      if (workspaceId) {
        const { ok: keyOk, data: keyData } = await proxyCall("/keys", mgmtKey, "POST", {
          name: keyName,
          limit: rateLimit,
          limit_reset: "daily",
          workspace_id: workspaceId,
        });
        checks.push({
          label: `Provision key "${keyName}"`,
          passed: keyOk,
          detail: keyOk
            ? `Created in workspace "${wsName}" ($${rateLimit}/day limit)`
            : `Failed: ${(keyData.error as string) || JSON.stringify(keyData).slice(0, 100)}`,
        });
      } else {
        checks.push({
          label: `Provision key "${keyName}"`,
          passed: false,
          detail: `Could not find workspace "${wsName}" to assign key`,
        });
      }
    }
  }

  return { passed: checks.every((c) => c.passed), checks };
}

/**
 * Step 3 — Governance
 * Local-only — enterprise SSO/SCIM/ZDR can't be set via public API.
 */
async function validateGovernanceConnected(m: Manifest): Promise<ValidationResult> {
  const { validateStep } = await import("./validation");
  return validateStep(2, m);
}

/**
 * Step 4 — Presets & Routing
 * Uses API key to GET /models and verify configured models exist in the catalog.
 */
async function validateRoutingConnected(m: Manifest, apiKey: string): Promise<ValidationResult> {
  const checks: Check[] = [];
  const presets = get(m, "presets") as Array<Record<string, unknown>> | undefined;

  checks.push({
    label: "Presets defined",
    passed: Array.isArray(presets) && presets.length > 0,
    detail: Array.isArray(presets) ? `${presets.length} preset(s)` : "No presets defined",
  });

  const { ok, data } = await proxyCall("/models", apiKey);

  if (ok && Array.isArray((data as Record<string, unknown>).data)) {
    const availableModels = ((data as Record<string, unknown>).data as Array<Record<string, unknown>>).map(
      (model) => model.id as string
    );

    checks.push({
      label: "Models catalog",
      passed: true,
      detail: `${availableModels.length} models available on OpenRouter`,
    });

    if (Array.isArray(presets)) {
      for (const preset of presets) {
        const models = (preset.models as string[]) || [];
        const fallbacks = (preset.fallback_models as string[]) || [];

        for (const modelId of [...models, ...fallbacks]) {
          const exists = availableModels.includes(modelId);
          checks.push({
            label: `Model "${modelId}"`,
            passed: exists,
            detail: exists ? "Available in catalog" : "Not found in OpenRouter catalog",
          });
        }

        checks.push({
          label: `Fallback for "${preset.name}"`,
          passed: fallbacks.length > 0,
          detail: fallbacks.length > 0 ? `${fallbacks.length} fallback model(s)` : "No fallback models configured",
        });
      }
    }
  } else {
    checks.push({
      label: "Models catalog",
      passed: false,
      detail: `Failed to fetch: ${(data.error as string) || "unknown error"}`,
    });
  }

  const budget = get(m, "cost_limits.monthly_budget");
  checks.push({
    label: "Monthly budget",
    passed: typeof budget === "number" && budget > 0,
    detail: typeof budget === "number" ? `$${budget}/mo` : "No monthly budget set",
  });

  const perReq = get(m, "cost_limits.per_request_max");
  checks.push({
    label: "Per-request limit",
    passed: typeof perReq === "number" && perReq > 0,
    detail: typeof perReq === "number" ? `$${perReq}/request` : "No per-request limit",
  });

  return { passed: checks.every((c) => c.passed), checks };
}

/**
 * Step 5 — Broadcast & Observability
 * Local-only — broadcast config is validated against the manifest.
 */
async function validateObservabilityConnected(m: Manifest): Promise<ValidationResult> {
  const { validateStep } = await import("./validation");
  return validateStep(4, m);
}

/**
 * Step 6 — Go-Live Sign-Off
 * Uses API key to POST /chat/completions for a real test inference.
 */
async function validateGoLiveConnected(m: Manifest, apiKey: string): Promise<ValidationResult> {
  const checks: Check[] = [];

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
      : `Inference failed: ${(data.error as string) || "unknown error"}`,
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
 * Steps 1-2 use management key, Steps 4+6 use API key, Steps 3+5 are local-only.
 */
export async function validateStepConnected(
  stepIndex: number,
  manifest: Manifest,
  mgmtKey: string,
  apiKey: string
): Promise<ValidationResult> {
  const validators = [
    (m: Manifest) => validateActivationConnected(m, mgmtKey),
    (m: Manifest) => validateWorkspacesConnected(m, mgmtKey),
    (m: Manifest) => validateGovernanceConnected(m),
    (m: Manifest) => validateRoutingConnected(m, apiKey || mgmtKey),
    (m: Manifest) => validateObservabilityConnected(m),
    (m: Manifest) => validateGoLiveConnected(m, apiKey),
  ];
  return validators[stepIndex](manifest);
}
