#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const skillRoot = path.resolve(import.meta.dirname, "..");
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "world-cup-daily-"));
const profileFile = path.join(temporary, "profile.json");
const chineseProfileFile = path.join(temporary, "profile-zh.json");
const invalidProfileFile = path.join(temporary, "profile-invalid.json");
const cacheFile = path.join(temporary, "matches-cache.json");
const fetchedFile = path.join(temporary, "matches-latest.json");
const missingCacheFile = path.join(temporary, "matches-cache-missing.json");
const missingCacheOutFile = path.join(temporary, "matches-missing-cache-out.json");
const newsFile = path.join(temporary, "news.json");
const normalizedFile = path.join(temporary, "digest.json");
const normalizedChineseFile = path.join(temporary, "digest-zh.json");
const htmlFile = path.join(temporary, "digest.html");
const invalidHtmlFile = path.join(temporary, "invalid.html");
const tokenHtmlFile = path.join(temporary, "token.html");
const badTemplateFile = path.join(temporary, "bad-template.html");

const profile = {
  version: 1,
  favoriteTeams: ["Argentina"],
  favoritePlayers: ["Lionel Messi"],
  timezone: "Asia/Shanghai",
  dailyDeliveryTime: "08:00",
  reminderMinutes: 30,
  density: "balanced",
  updatedAt: "2026-06-23T00:00:00.000Z"
};
const chineseProfile = {
  ...profile,
  favoriteTeams: ["阿根廷"],
  favoritePlayers: ["梅西"]
};
const invalidProfile = {
  ...profile,
  timezone: "Not/A_Real_Timezone"
};
const matches = [
  {
    id: 1001,
    utcDate: "2026-06-22T12:00:00Z",
    status: "FINISHED",
    stage: "GROUP_STAGE",
    homeTeam: { name: "Argentina", shortName: "Argentina", tla: "ARG" },
    awayTeam: { name: "Japan", shortName: "Japan", tla: "JPN" },
    score: { fullTime: { home: 2, away: 1 } },
    venue: "Test Stadium"
  },
  {
    id: 1002,
    utcDate: "2026-06-23T12:00:00Z",
    status: "TIMED",
    stage: "SEMI_FINALS",
    homeTeam: { name: "Brazil", shortName: "Brazil", tla: "BRA" },
    awayTeam: { name: "Argentina", shortName: "Argentina", tla: "ARG" },
    score: { fullTime: { home: null, away: null } },
    venue: "Test Stadium"
  },
  {
    id: 1003,
    utcDate: "2026-06-24T12:00:00Z",
    status: "POSTPONED",
    stage: "GROUP_STAGE",
    homeTeam: { name: "France", shortName: "France", tla: "FRA" },
    awayTeam: { name: "Spain", shortName: "Spain", tla: "ESP" },
    score: { fullTime: { home: null, away: null } },
    venue: null
  }
];
const cache = {
  meta: {
    source: "football-data.org",
    sourceUrl: "https://api.football-data.org/v4/competitions/WC/matches",
    fetchedAt: "2026-06-23T00:00:00.000Z",
    isCached: false,
    cacheReason: null
  },
  data: { matches }
};
const news = {
  fetchedAt: "2026-06-23T00:30:00.000Z",
  items: [{
    title: "阿根廷备战下一场比赛",
    summary: "球队完成赛前训练，官方尚未公布首发阵容。",
    source: "FIFA",
    publishedAt: "2026-06-23T00:00:00.000Z",
    url: "https://www.fifa.com/",
    relatedTeams: ["Argentina"],
    relatedPlayers: [],
    verification: "confirmed"
  }, {
    title: "<script>alert('news')</script>",
    summary: "<img src=x onerror=alert(1)> 这是一条需要安全呈现的摘要。",
    source: "Security Test",
    publishedAt: "2026-06-23T00:10:00.000Z",
    url: "https://www.fifa.com/",
    relatedTeams: ["Argentina"],
    relatedPlayers: [],
    verification: "confirmed"
  }, {
    title: "非法 URL 新闻应被丢弃",
    summary: "这条新闻不能进入日报。",
    source: "Bad Source",
    publishedAt: "2026-06-23T00:20:00.000Z",
    url: "javascript:alert(1)",
    relatedTeams: ["Argentina"],
    relatedPlayers: [],
    verification: "confirmed"
  }, {
    title: "非法时间新闻应被丢弃",
    summary: "这条新闻不能进入日报。",
    source: "Bad Source",
    publishedAt: "not-a-date",
    url: "https://www.fifa.com/",
    relatedTeams: ["Argentina"],
    relatedPlayers: [],
    verification: "confirmed"
  }]
};

await Promise.all([
  fs.writeFile(profileFile, JSON.stringify(profile)),
  fs.writeFile(chineseProfileFile, JSON.stringify(chineseProfile)),
  fs.writeFile(invalidProfileFile, JSON.stringify(invalidProfile)),
  fs.writeFile(cacheFile, JSON.stringify(cache)),
  fs.writeFile(newsFile, JSON.stringify(news))
]);

function run(script, args, env = {}) {
  const result = spawnSync(process.execPath, [path.join(skillRoot, "scripts", script), ...args], {
    cwd: skillRoot,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`${script} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function expectFailure(script, args, env = {}, pattern = /Error|Unable|Invalid/) {
  const result = spawnSync(process.execPath, [path.join(skillRoot, "scripts", script), ...args], {
    cwd: skillRoot,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
  assert.notEqual(result.status, 0, `${script} was expected to fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, pattern);
  return result;
}

run("fetch-matches.mjs", [
  "--profile", profileFile, "--cache", cacheFile, "--out", fetchedFile
], { FOOTBALL_DATA_API_TOKEN: "" });
const fetched = JSON.parse(await fs.readFile(fetchedFile, "utf8"));
assert.equal(fetched.meta.isCached, true);
assert.match(fetched.meta.cacheReason, /凭据未配置/);
expectFailure("fetch-matches.mjs", [
  "--profile", profileFile, "--cache", missingCacheFile, "--out", missingCacheOutFile
], { FOOTBALL_DATA_API_TOKEN: "" }, /no readable cache|凭据未配置/);
await assert.rejects(fs.access(missingCacheOutFile));
expectFailure("fetch-matches.mjs", [
  "--profile", invalidProfileFile, "--cache", cacheFile, "--out", path.join(temporary, "invalid-profile-out.json")
], { FOOTBALL_DATA_API_TOKEN: "" }, /Invalid IANA timezone/);

run("normalize-data.mjs", [
  "--profile", profileFile, "--matches", fetchedFile, "--news", newsFile,
  "--out", normalizedFile, "--now", "2026-06-23T01:00:00.000Z"
]);
const normalized = JSON.parse(await fs.readFile(normalizedFile, "utf8"));
assert.equal(normalized.meta.date, "2026-06-23");
assert.equal(normalized.yesterdayResults.length, 1);
assert.equal(normalized.todayMatches.length, 1);
assert.equal(normalized.tomorrowMatches.length, 1);
assert.equal(normalized.todayMatches[0].favorite, true);
assert.equal(normalized.todayMatches[0].homeTeam, "巴西");
assert.equal(normalized.todayMatches[0].awayTeam, "阿根廷");
assert.equal(normalized.yesterdayResults[0].homeTeam, "阿根廷");
assert.equal(normalized.yesterdayResults[0].awayTeam, "日本");
assert.equal(normalized.news[0].personalized, true);
assert.equal(normalized.news.length, 2);
assert.equal(normalized.news.some((item) => item.url.startsWith("javascript:")), false);

run("normalize-data.mjs", [
  "--profile", chineseProfileFile, "--matches", fetchedFile, "--news", newsFile,
  "--out", normalizedChineseFile, "--now", "2026-06-23T01:00:00.000Z"
]);
const normalizedChinese = JSON.parse(await fs.readFile(normalizedChineseFile, "utf8"));
assert.equal(normalizedChinese.todayMatches[0].favorite, true);
assert.match(normalizedChinese.headline.summary, /阿根廷/);

run("render-digest.mjs", [
  "--data", normalizedFile,
  "--template", path.join(skillRoot, "assets", "digest-template.html"),
  "--out", htmlFile
]);
run("validate-digest.mjs", ["--html", htmlFile]);
await fs.writeFile(invalidHtmlFile, [
  "<!doctype html>",
  "<h1>昨日战况 今日趣闻 今日看球 明日预告 数据说明 修改偏好 加入日历</h1>",
  "<script id=\"digest-data\" type=\"application/json\">{\"meta\":{\"timezone\":\"Asia/Shanghai\"}}</script>",
  "<script>function downloadProfile(){}; const x = 'BEGIN:VCALENDAR';</script>"
].join("\n"));
expectFailure("validate-digest.mjs", ["--html", invalidHtmlFile], {}, /no profile/);
await fs.writeFile(tokenHtmlFile, `${await fs.readFile(htmlFile, "utf8")}\nFOOTBALL_DATA_API_TOKEN`);
expectFailure("validate-digest.mjs", ["--html", tokenHtmlFile], {}, /token identifier/);
await fs.writeFile(badTemplateFile, "<html><body>no placeholder</body></html>");
expectFailure("render-digest.mjs", [
  "--data", normalizedFile,
  "--template", badTemplateFile,
  "--out", path.join(temporary, "bad-template-out.html")
], {}, /missing __DIGEST_DATA__/);

const html = await fs.readFile(htmlFile, "utf8");
assert.match(html, /showSaveFilePicker/);
assert.match(html, /复制修改指令/);
assert.match(html, /BEGIN:VCALENDAR/);
assert.match(html, /巴西/);
assert.match(html, /阿根廷/);
assert.match(html, /\\u003cscript>alert/);
assert.doesNotMatch(html, /<script>alert/);
assert.doesNotMatch(html, /javascript:alert/);
assert.match(html, /Google 日历/);
assert.doesNotMatch(html, /X-Auth-Token/);
assert.doesNotMatch(html, /FOOTBALL_DATA_API_TOKEN/);

console.log(`World Cup Daily end-to-end test passed: ${htmlFile}`);
