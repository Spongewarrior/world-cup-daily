#!/usr/bin/env node
import fs from "node:fs/promises";
import { parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.html) throw new Error("Usage: validate-digest.mjs --html FILE");
const html = await fs.readFile(args.html, "utf8");
const errors = [];

for (const text of ["昨日战况", "今日趣闻", "今日看球", "明日预告", "数据说明", "修改偏好", "加入日历"]) {
  if (!html.includes(text)) errors.push(`Missing required UI text: ${text}`);
}
if (html.includes("__DIGEST_DATA__")) errors.push("Digest placeholder was not replaced");
if (/FOOTBALL_DATA_API_TOKEN|X-Auth-Token/i.test(html)) errors.push("HTML contains a token identifier");
if (!/<script id="digest-data" type="application\/json">/.test(html)) errors.push("Embedded digest data is missing");
if (!/downloadProfile|showSaveFilePicker/.test(html)) errors.push("Preference-saving fallback is missing");
if (!/BEGIN:VCALENDAR/.test(html)) errors.push("ICS calendar generation is missing");

const match = html.match(/<script id="digest-data" type="application\/json">([\s\S]*?)<\/script>/);
if (match) {
  try {
    const data = JSON.parse(match[1]);
    if (!data.meta?.timezone) errors.push("Embedded data has no timezone");
    if (!data.profile) errors.push("Embedded data has no profile");
  } catch (error) {
    errors.push(`Embedded JSON is invalid: ${error.message}`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${args.html}`);
}
