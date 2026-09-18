# OpenRouter Onboard — Demo Video Script

## Premise

Walk through the 14-day enterprise onboarding journey using the tool. Start with a deliberately broken YAML manifest, fix it step by step, and end with a live inference call visible on OpenRouter's Activity page.

---

## Act 1 — Local Mode (broken YAML, red failures)

Open the app. The YAML editor loads with NullPointer Industries' manifest. The connection indicator reads **LOCAL MODE**.

### Step 1: Activation

Click **VERIFY**. This passes immediately — org name, domain, plan, and admin email are all valid. Quick win, green check.

### Step 2: Workspaces & Budgets

Click **VERIFY**. Three red failures appear:

| Broken field | Line | Fix |
|---|---|---|
| `budget: null` on production workspace | 16 | Change to `budget: 1000` |
| `scope: all` on dev-yolo-key | 19 | Change to `scope: workspace` |
| `rate_limit: null` on dev-yolo-key | 20 | Change to `rate_limit: 500` |

Fix each one in the editor, then click **VERIFY** again. All green.

### Step 3: Governance

Click **VERIFY**. Five red failures — everything is disabled:

| Broken field | Line | Fix |
|---|---|---|
| `sso_enabled: false` | 33 | Change to `true` |
| `sso_provider: null` | 34 | Change to `sso_provider: okta` |
| `scim_provisioning: false` | 35 | Change to `true` |
| `zero_data_retention: false` | 36 | Change to `true` |
| `content_guardrails: false` | 37 | Change to `true` |

Fix, verify. Green.

### Step 4: Presets & Routing

Click **VERIFY**. Three failures:

| Broken field | Line | Fix |
|---|---|---|
| `fallback_models: []` | 44 | Add a fallback: `fallback_models: [openai/gpt-4o]` |
| `monthly_budget: null` | 49 | Change to `monthly_budget: 5000` |
| `per_request_max: null` | 50 | Change to `per_request_max: 2` |

Fix, verify. Green.

### Step 5: Broadcast & Observability

Click **VERIFY**. Three failures:

| Broken field | Line | Fix |
|---|---|---|
| `enabled: false` | 54 | Change to `true` |
| `destinations: []` | 55 | Add destinations: `destinations: [datadog, langfuse]` |
| `log_retention_days: 0` | 56 | Change to `log_retention_days: 30` |

Fix, verify. Green.

### Step 6: Go-Live Sign-Off

Click **VERIFY**. Four failures:

| Broken field | Line | Fix |
|---|---|---|
| `test_inference_passed: false` | 59 | Change to `true` |
| `traces_verified: false` | 60 | Change to `true` |
| `monitoring_confirmed: false` | 61 | Change to `true` |
| `sign_off_completed: false` | 62 | Change to `true` |

Fix, verify. All 6 steps green. "ALL VERIFIED" button appears.

**Pause.** Call out: "That was all local validation — no API calls were made. Now let's connect to OpenRouter."

---

## Act 2 — Connected Mode (real API calls)

### Reset the checklist

Reload the page to get back to the broken YAML. This time, paste your real OpenRouter API key on line 11:

```yaml
api_key: sk-or-v1-...
```

Click **CONNECT**. The indicator changes to a green dot and **CONNECTED**.

### Verify with live API

Now fix and verify each step again. This time the tool makes real calls:

| Step | API call | What it proves |
|---|---|---|
| Activation | `GET /auth/key` | Your key is valid and shows usage |
| Workspaces & Budgets | `GET /keys` | Lists real keys on your account |
| Governance | Local only | YAML structure checks (SSO, ZDR, guardrails) |
| Presets & Routing | `GET /models` | Your configured models exist in the real catalog |
| Broadcast & Observability | Local only | Broadcast config structure checks |
| Go-Live Sign-Off | `POST /chat/completions` | Runs a real inference call through your key |

### Where to see it on OpenRouter

| Step | Where on OpenRouter UI |
|---|---|
| Activation | Settings > Keys — your key's label and usage |
| Workspaces & Budgets | https://openrouter.ai/workspaces — your workspaces |
| Governance | Settings > Privacy (ZDR), workspace settings (guardrails) |
| Presets & Routing | https://openrouter.ai/workspaces/default/presets |
| Broadcast & Observability | https://openrouter.ai/settings/observability |
| Go-Live Sign-Off | https://openrouter.ai/activity — the request appears here |

---

## Act 3 — The Money Shot

After fixing all steps in connected mode and clicking **VERIFY** on Go-Live Sign-Off:

1. The tool sends a real `POST /chat/completions` through your key
2. Step 6 turns green, "ALL VERIFIED" appears
3. **Tab over to https://openrouter.ai/activity**
4. Your inference request is right there — model name, token count, cost, timestamp

That live request appearing in the Activity page is the payoff. It proves the onboarding tool doesn't just validate config — it actually provisions and tests against the real OpenRouter platform.

---

## Total misconfigurations: 18

- Step 1 (Activation): 0 — passes immediately
- Step 2 (Workspaces & Budgets): 3
- Step 3 (Governance): 5
- Step 4 (Presets & Routing): 3
- Step 5 (Broadcast & Observability): 3
- Step 6 (Go-Live Sign-Off): 4
