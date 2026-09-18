export const DEFAULT_MANIFEST = `# OpenRouter Enterprise Onboarding Manifest
# Organization: NullPointer Industries
# "AI that definitely won't segfault... probably"

organization:
  name: NullPointer Industries
  domain: nullpointer.dev
  plan: enterprise
  admin_email: cto@nullpointer.dev

workspaces:
  - name: production
    description: Production inference workload
    api_keys:
      - name: dev-yolo-key
        scope: all
        rate_limit: null
        description: "Temporary key, will scope later"

  - name: staging
    description: Pre-production testing
    api_keys:
      - name: staging-key
        scope: workspace
        rate_limit: 100
        description: Staging environment key

security:
  sso_enabled: false
  sso_provider: null
  scim_provisioning: false
  zero_data_retention: false
  content_guardrails: false

routing:
  presets:
    - name: default-route
      models:
        - anthropic/claude-sonnet-4-20250514
      fallback_models: []
      max_tokens: 4096
      temperature: 0.7

  cost_limits:
    monthly_budget: null
    per_request_max: null
    alert_threshold: null

observability:
  broadcast_enabled: false
  destinations: []
  log_retention_days: 0

production_readiness:
  load_test_completed: false
  failover_verified: false
  monitoring_configured: false
  runbook_documented: false
`;
