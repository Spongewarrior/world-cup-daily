#!/usr/bin/env node
import dns from "node:dns/promises";

const endpoint = "https://api.football-data.org/v4/competitions/WC/matches?dateFrom=2026-06-23&dateTo=2026-06-27";
const token = process.env.FOOTBALL_DATA_API_TOKEN;

function formatError(error) {
  return {
    name: error?.name || "Error",
    message: String(error?.message || error),
    cause: error?.cause ? String(error.cause) : null
  };
}

const result = {
  checkedAt: new Date().toISOString(),
  dns: null,
  tokenPresent: Boolean(token),
  api: null
};

try {
  const resolved = await dns.lookup("api.football-data.org");
  result.dns = { ok: true, address: resolved.address, family: resolved.family };
} catch (error) {
  result.dns = { ok: false, error: formatError(error) };
}

if (!token) {
  result.api = { ok: false, error: { message: "FOOTBALL_DATA_API_TOKEN 未配置" } };
} else {
  try {
    const response = await fetch(endpoint, {
      headers: { "X-Auth-Token": token, Accept: "application/json" },
      signal: AbortSignal.timeout(15000)
    });
    const body = await response.text();
    result.api = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      requestsAvailableMinute: response.headers.get("X-Requests-Available-Minute"),
      authenticatedClient: response.headers.get("X-Authenticated-Client") || null,
      bodyPreview: body.slice(0, 300)
    };
  } catch (error) {
    result.api = { ok: false, error: formatError(error) };
  }
}

console.log(JSON.stringify(result, null, 2));
