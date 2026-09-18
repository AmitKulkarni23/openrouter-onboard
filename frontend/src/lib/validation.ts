export interface ValidationResult {
  passed: boolean;
  checks: Check[];
}

export interface Check {
  label: string;
  passed: boolean;
  detail: string;
}

type Manifest = Record<string, unknown>;

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function validateStep(stepIndex: number, manifest: Manifest): ValidationResult {
  const validators = [
    validateOrgSetup,
    validateWorkspaces,
    validateSecurity,
    validateRouting,
    validateObservability,
    validateProductionReadiness,
  ];
  return validators[stepIndex](manifest);
}

function validateOrgSetup(m: Manifest): ValidationResult {
  const checks: Check[] = [];

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
    detail: domain ? `${domain}` : "Missing domain",
  });

  const plan = get(m, "organization.plan") as string | undefined;
  checks.push({
    label: "Enterprise plan",
    passed: plan === "enterprise",
    detail: plan === "enterprise" ? "Enterprise plan active" : `Plan is "${plan || "not set"}" — enterprise required`,
  });

  const email = get(m, "organization.admin_email") as string | undefined;
  checks.push({
    label: "Admin email",
    passed: !!email && email.includes("@"),
    detail: email || "Missing admin email",
  });

  return { passed: checks.every((c) => c.passed), checks };
}

function validateWorkspaces(m: Manifest): ValidationResult {
  const checks: Check[] = [];
  const workspaces = get(m, "workspaces") as Array<Record<string, unknown>> | undefined;

  checks.push({
    label: "Workspaces defined",
    passed: Array.isArray(workspaces) && workspaces.length > 0,
    detail: Array.isArray(workspaces) ? `${workspaces.length} workspace(s)` : "No workspaces defined",
  });

  if (Array.isArray(workspaces)) {
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

    const noRateLimit = allKeys.filter((k) => !k.rate_limit);
    checks.push({
      label: "Rate limits set",
      passed: noRateLimit.length === 0,
      detail:
        noRateLimit.length === 0
          ? "All keys have rate limits"
          : `${noRateLimit.length} key(s) without rate limits`,
    });
  }

  return { passed: checks.every((c) => c.passed), checks };
}

function validateSecurity(m: Manifest): ValidationResult {
  const checks: Check[] = [];

  const sso = get(m, "security.sso_enabled");
  checks.push({
    label: "SSO enabled",
    passed: sso === true,
    detail: sso === true ? "SSO active" : "SSO disabled — enterprise security requires SSO",
  });

  if (sso === true) {
    const provider = get(m, "security.sso_provider") as string | undefined;
    checks.push({
      label: "SSO provider",
      passed: !!provider,
      detail: provider || "No SSO provider configured",
    });
  }

  const scim = get(m, "security.scim_provisioning");
  checks.push({
    label: "SCIM provisioning",
    passed: scim === true,
    detail: scim === true ? "SCIM active" : "SCIM disabled — manual user management required",
  });

  const zdr = get(m, "security.zero_data_retention");
  checks.push({
    label: "Zero data retention",
    passed: zdr === true,
    detail: zdr === true ? "ZDR active" : "ZDR disabled — data may be retained by providers",
  });

  const guardrails = get(m, "security.content_guardrails");
  checks.push({
    label: "Content guardrails",
    passed: guardrails === true,
    detail: guardrails === true ? "Guardrails active" : "No content guardrails configured",
  });

  return { passed: checks.every((c) => c.passed), checks };
}

function validateRouting(m: Manifest): ValidationResult {
  const checks: Check[] = [];
  const presets = get(m, "routing.presets") as Array<Record<string, unknown>> | undefined;

  checks.push({
    label: "Routing presets",
    passed: Array.isArray(presets) && presets.length > 0,
    detail: Array.isArray(presets) ? `${presets.length} preset(s)` : "No routing presets defined",
  });

  if (Array.isArray(presets)) {
    for (const preset of presets) {
      const fallbacks = preset.fallback_models as string[] | undefined;
      checks.push({
        label: `Fallback for "${preset.name}"`,
        passed: Array.isArray(fallbacks) && fallbacks.length > 0,
        detail:
          Array.isArray(fallbacks) && fallbacks.length > 0
            ? `${fallbacks.length} fallback model(s)`
            : "No fallback models — requests fail if primary is unavailable",
      });
    }
  }

  const budget = get(m, "routing.cost_limits.monthly_budget");
  checks.push({
    label: "Monthly budget",
    passed: typeof budget === "number" && budget > 0,
    detail: typeof budget === "number" ? `$${budget}/mo` : "No monthly budget set — unbounded spend risk",
  });

  const perReq = get(m, "routing.cost_limits.per_request_max");
  checks.push({
    label: "Per-request limit",
    passed: typeof perReq === "number" && perReq > 0,
    detail: typeof perReq === "number" ? `$${perReq}/request` : "No per-request limit",
  });

  return { passed: checks.every((c) => c.passed), checks };
}

function validateObservability(m: Manifest): ValidationResult {
  const checks: Check[] = [];

  const enabled = get(m, "observability.broadcast_enabled");
  checks.push({
    label: "Broadcast enabled",
    passed: enabled === true,
    detail: enabled === true ? "Broadcasting active" : "Broadcasting disabled — no visibility into requests",
  });

  const destinations = get(m, "observability.destinations") as string[] | undefined;
  checks.push({
    label: "Destinations configured",
    passed: Array.isArray(destinations) && destinations.length > 0,
    detail:
      Array.isArray(destinations) && destinations.length > 0
        ? destinations.join(", ")
        : "No broadcast destinations",
  });

  const retention = get(m, "observability.log_retention_days") as number | undefined;
  checks.push({
    label: "Log retention",
    passed: typeof retention === "number" && retention >= 7,
    detail:
      typeof retention === "number" && retention > 0
        ? `${retention} days`
        : "No log retention configured",
  });

  return { passed: checks.every((c) => c.passed), checks };
}

function validateProductionReadiness(m: Manifest): ValidationResult {
  const checks: Check[] = [];

  const fields: [string, string][] = [
    ["production_readiness.load_test_completed", "Load test completed"],
    ["production_readiness.failover_verified", "Failover verified"],
    ["production_readiness.monitoring_configured", "Monitoring configured"],
    ["production_readiness.runbook_documented", "Runbook documented"],
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
