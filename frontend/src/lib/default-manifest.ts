export const DEFAULT_MANIFEST = `# OpenRouter Enterprise Onboarding Manifest
# Organization: NullPointer Industries
# "AI that definitely won't segfault... probably"

organization:
  name: NullPointer Industries
  domain: nullpointer.dev
  plan: enterprise
  admin_email: cto@nullpointer.dev

keys:
  # Management key — provisions workspaces, keys, presets (sk-or-mgmt-...)
  management_key: null
  # API key — runs inference and verifies models (sk-or-v1-...)
  api_key: null

workspaces:
  - name: production
    description: Production inference workload
    budget: null
    api_keys:
      - name: dev-yolo-key
        scope: all
        rate_limit: null
        description: "Temporary key, will scope later"

  - name: staging
    description: Pre-production testing
    budget: 500
    api_keys:
      - name: staging-key
        scope: workspace
        rate_limit: 100
        description: Staging environment key

governance:
  sso_enabled: false
  sso_provider: null
  scim_provisioning: false
  zero_data_retention: false
  content_guardrails: false

presets:
  - name: customer-support
    description: "Use-case preset — names the job, not the model"
    models:
      - anthropic/claude-sonnet-4-20250514
    fallback_models: []
    max_tokens: 4096
    temperature: 0.7

cost_limits:
  monthly_budget: null
  per_request_max: null
  alert_threshold: null

broadcast:
  enabled: false
  destinations: []
  log_retention_days: 0

go_live:
  test_inference_passed: false
  traces_verified: false
  monitoring_confirmed: false
  sign_off_completed: false
`;
