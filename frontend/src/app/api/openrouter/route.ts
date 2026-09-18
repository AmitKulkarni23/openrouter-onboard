import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, method = "GET", apiKey, body } = await req.json();

    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { error: "Missing apiKey or endpoint" },
        { status: 400 }
      );
    }

    const cleanKey = apiKey.replace(/[^\x20-\x7E]/g, "").trim();
    const url = `${OPENROUTER_BASE}${endpoint}`;
    const maskedKey = cleanKey.slice(0, 8) + "***" + cleanKey.slice(-2);

    console.log(`[proxy] ${method} ${url} | key: ${maskedKey}`);
    if (body) console.log(`[proxy] body: ${JSON.stringify(body)}`);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${cleanKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/AmitKulkarni23/openrouter-onboard",
      "X-Title": "OpenRouter Onboard",
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    console.log(`[proxy] ${method} ${endpoint} → ${response.status}`);
    console.log(`[proxy] response: ${JSON.stringify(data).slice(0, 500)}`);

    if (!response.ok) {
      console.error(`[proxy] ERROR ${response.status}: ${JSON.stringify(data)}`);
      return NextResponse.json(
        { error: data.error?.message || `OpenRouter returned ${response.status}`, data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy request failed";
    console.error(`[proxy] EXCEPTION: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
