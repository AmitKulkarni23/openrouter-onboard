import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/**
 * Proxies requests to OpenRouter's API so the API key never touches the browser.
 *
 * Usage from the client:
 *   POST /api/openrouter
 *   Body: { endpoint: "/auth/key", method: "GET", apiKey: "sk-or-..." }
 *   or:   { endpoint: "/chat/completions", method: "POST", apiKey: "sk-or-...", body: {...} }
 */
export async function POST(req: NextRequest) {
  try {
    const { endpoint, method = "GET", apiKey, body } = await req.json();

    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { error: "Missing apiKey or endpoint" },
        { status: 400 }
      );
    }

    const url = `${OPENROUTER_BASE}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Required by OpenRouter for identifying the app
      "HTTP-Referer": "https://github.com/AmitKulkarni23/openrouter-onboard",
      "X-Title": "OpenRouter Onboard",
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Only attach body for POST/PUT/PATCH requests
    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || `OpenRouter returned ${response.status}`, data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
