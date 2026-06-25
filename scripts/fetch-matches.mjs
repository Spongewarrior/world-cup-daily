#!/usr/bin/env node
import fs from "node:fs/promises";
import { assertProfile, localDateKey, parseArgs, readJson, shiftDateKey, writeJson } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.profile || !args.cache || !args.out) {
  throw new Error("Usage: fetch-matches.mjs --profile FILE --cache FILE --out FILE");
}

const profile = await readJson(args.profile);
assertProfile(profile);

const today = localDateKey(new Date(), profile.timezone);
const dateFrom = shiftDateKey(today, -2);
const dateTo = shiftDateKey(today, 2);
const endpoint = new URL("https://api.football-data.org/v4/competitions/WC/matches");
endpoint.searchParams.set("dateFrom", dateFrom);
endpoint.searchParams.set("dateTo", dateTo);

function describeFetchError(error) {
  const message = String(error?.message || error);
  const cause = String(error?.cause || "");

  if (message.includes("The operation was aborted due to timeout")) {
    return "请求超时：15 秒内未收到比赛接口响应";
  }
  if (cause.includes("ENOTFOUND")) {
    return "DNS 解析失败：当前运行环境无法解析 api.football-data.org";
  }
  if (cause.includes("ECONNREFUSED")) {
    return "连接被拒绝：当前运行环境无法连到比赛接口";
  }
  if (cause.includes("ETIMEDOUT")) {
    return "网络超时：当前运行环境无法在预期时间内连接比赛接口";
  }

  return message;
}

async function useCache(reason) {
  try {
    const cached = await readJson(args.cache);
    const envelope = {
      ...cached,
      meta: {
        ...cached.meta,
        isCached: true,
        cacheReason: reason
      }
    };
    await writeJson(args.out, envelope);
    console.error(`Live match fetch failed; using cache from ${cached.meta?.fetchedAt ?? "unknown time"}.`);
  } catch {
    throw new Error(`Unable to fetch live match data and no readable cache exists: ${reason}`);
  }
}

const token = process.env.FOOTBALL_DATA_API_TOKEN;
if (!token) {
  await useCache("比赛数据 API 凭据未配置");
} else {
  try {
    const response = await fetch(endpoint, {
      headers: { "X-Auth-Token": token, Accept: "application/json" },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      const body = (await response.text()).slice(0, 300);
      throw new Error(`HTTP ${response.status}: ${body}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.matches)) throw new Error("Response does not contain a matches array");
    const envelope = {
      meta: {
        source: "football-data.org",
        sourceUrl: endpoint.toString(),
        fetchedAt: new Date().toISOString(),
        isCached: false,
        cacheReason: null
      },
      data
    };
    await writeJson(args.cache, envelope);
    await writeJson(args.out, envelope);
    console.log(`Fetched ${data.matches.length} World Cup matches.`);
  } catch (error) {
    await useCache(describeFetchError(error));
  }
}

// Confirm that the output was actually written before reporting success to an automation.
await fs.access(args.out);
