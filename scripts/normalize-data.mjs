#!/usr/bin/env node
import { assertProfile, localDateKey, normalizeUrl, parseArgs, readJson, shiftDateKey, writeJson } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.profile || !args.matches || !args.news || !args.out) {
  throw new Error("Usage: normalize-data.mjs --profile FILE --matches FILE --news FILE --out FILE [--now ISO]");
}

const profile = await readJson(args.profile);
assertProfile(profile);
const envelope = await readJson(args.matches);
const newsEnvelope = await readJson(args.news);
const now = args.now ? new Date(args.now) : new Date();
if (Number.isNaN(now.valueOf())) throw new Error("Invalid --now value");

const today = localDateKey(now, profile.timezone);
const yesterday = shiftDateKey(today, -1);
const tomorrow = shiftDateKey(today, 1);
const favoriteTeams = profile.favoriteTeams.map((value) => String(value).toLocaleLowerCase());
const favoritePlayers = profile.favoritePlayers.map((value) => String(value).toLocaleLowerCase());

const teamNameZh = new Map(Object.entries({
  ARG: "阿根廷",
  AUS: "澳大利亚",
  AUT: "奥地利",
  BEL: "比利时",
  BOL: "玻利维亚",
  BRA: "巴西",
  CAN: "加拿大",
  CHI: "智利",
  CHN: "中国",
  CIV: "科特迪瓦",
  CMR: "喀麦隆",
  COL: "哥伦比亚",
  CRC: "哥斯达黎加",
  CRO: "克罗地亚",
  CZE: "捷克",
  DEN: "丹麦",
  ECU: "厄瓜多尔",
  EGY: "埃及",
  ENG: "英格兰",
  ESP: "西班牙",
  FRA: "法国",
  GER: "德国",
  GHA: "加纳",
  GRE: "希腊",
  IRN: "伊朗",
  IRQ: "伊拉克",
  ITA: "意大利",
  JAM: "牙买加",
  JPN: "日本",
  KOR: "韩国",
  MAR: "摩洛哥",
  MEX: "墨西哥",
  NED: "荷兰",
  NGA: "尼日利亚",
  NOR: "挪威",
  NZL: "新西兰",
  PAR: "巴拉圭",
  PER: "秘鲁",
  POL: "波兰",
  POR: "葡萄牙",
  QAT: "卡塔尔",
  KSA: "沙特阿拉伯",
  SCO: "苏格兰",
  SEN: "塞内加尔",
  SRB: "塞尔维亚",
  SUI: "瑞士",
  SWE: "瑞典",
  TUN: "突尼斯",
  TUR: "土耳其",
  UKR: "乌克兰",
  URU: "乌拉圭",
  USA: "美国",
  VEN: "委内瑞拉",
  WAL: "威尔士"
}));

const teamNameZhByName = new Map(Object.entries({
  "Algeria": "阿尔及利亚",
  "Argentina": "阿根廷",
  "Australia": "澳大利亚",
  "Austria": "奥地利",
  "Bahrain": "巴林",
  "Belgium": "比利时",
  "Bolivia": "玻利维亚",
  "Bosnia and Herzegovina": "波黑",
  "Brazil": "巴西",
  "Burkina Faso": "布基纳法索",
  "Cameroon": "喀麦隆",
  "Canada": "加拿大",
  "Cape Verde": "佛得角",
  "Chile": "智利",
  "China": "中国",
  "China PR": "中国",
  "Colombia": "哥伦比亚",
  "Congo DR": "刚果民主共和国",
  "Costa Rica": "哥斯达黎加",
  "Croatia": "克罗地亚",
  "Czechia": "捷克",
  "Czech Republic": "捷克",
  "Côte d'Ivoire": "科特迪瓦",
  "DR Congo": "刚果民主共和国",
  "Denmark": "丹麦",
  "Ecuador": "厄瓜多尔",
  "Egypt": "埃及",
  "El Salvador": "萨尔瓦多",
  "England": "英格兰",
  "France": "法国",
  "Germany": "德国",
  "Ghana": "加纳",
  "Greece": "希腊",
  "Haiti": "海地",
  "Honduras": "洪都拉斯",
  "Hungary": "匈牙利",
  "IR Iran": "伊朗",
  "Iceland": "冰岛",
  "Indonesia": "印度尼西亚",
  "Iran": "伊朗",
  "Iraq": "伊拉克",
  "Ireland": "爱尔兰",
  "Italy": "意大利",
  "Ivory Coast": "科特迪瓦",
  "Jamaica": "牙买加",
  "Japan": "日本",
  "Jordan": "约旦",
  "Korea DPR": "朝鲜",
  "Korea Republic": "韩国",
  "Mali": "马里",
  "Mexico": "墨西哥",
  "Morocco": "摩洛哥",
  "Netherlands": "荷兰",
  "New Zealand": "新西兰",
  "Nigeria": "尼日利亚",
  "North Macedonia": "北马其顿",
  "Northern Ireland": "北爱尔兰",
  "Norway": "挪威",
  "Oman": "阿曼",
  "Panama": "巴拿马",
  "Paraguay": "巴拉圭",
  "Peru": "秘鲁",
  "Poland": "波兰",
  "Portugal": "葡萄牙",
  "Qatar": "卡塔尔",
  "Republic of Ireland": "爱尔兰",
  "Romania": "罗马尼亚",
  "Saudi Arabia": "沙特阿拉伯",
  "Scotland": "苏格兰",
  "Senegal": "塞内加尔",
  "Serbia": "塞尔维亚",
  "Slovakia": "斯洛伐克",
  "Slovenia": "斯洛文尼亚",
  "South Africa": "南非",
  "South Korea": "韩国",
  "Spain": "西班牙",
  "Sweden": "瑞典",
  "Switzerland": "瑞士",
  "Thailand": "泰国",
  "Tunisia": "突尼斯",
  "Turkey": "土耳其",
  "Türkiye": "土耳其",
  "UAE": "阿联酋",
  "USA": "美国",
  "Ukraine": "乌克兰",
  "United Arab Emirates": "阿联酋",
  "United States": "美国",
  "Uruguay": "乌拉圭",
  "Uzbekistan": "乌兹别克斯坦",
  "Venezuela": "委内瑞拉",
  "Vietnam": "越南",
  "Wales": "威尔士"
}));

const statusLabels = {
  SCHEDULED: "未开始",
  TIMED: "未开始",
  IN_PLAY: "进行中",
  PAUSED: "中场",
  FINISHED: "已结束",
  POSTPONED: "延期",
  SUSPENDED: "中断",
  CANCELLED: "取消"
};

function formatLocal(utcDate) {
  const date = new Date(utcDate);
  return {
    dateKey: localDateKey(date, profile.timezone),
    date: new Intl.DateTimeFormat("zh-CN", {
      timeZone: profile.timezone,
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(date),
    time: new Intl.DateTimeFormat("zh-CN", {
      timeZone: profile.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(date)
  };
}

function teamName(team) {
  return team?.name || team?.shortName || team?.tla || "待定";
}

function displayTeamName(team) {
  return teamNameZh.get(team?.tla) || teamNameZhByName.get(team?.name) || teamNameZhByName.get(team?.shortName) || teamName(team);
}

function teamAliases(team) {
  return [teamName(team), displayTeamName(team), team?.shortName, team?.tla]
    .filter(Boolean)
    .map((name) => String(name).toLocaleLowerCase());
}

function includesFavoriteTeam(match) {
  const names = [match.homeTeam, match.awayTeam].flatMap(teamAliases);
  return favoriteTeams.some((favorite) => names.some((name) => name.includes(favorite) || favorite.includes(name)));
}

function stageWeight(stage = "") {
  const value = stage.toUpperCase();
  if (value.includes("FINAL") && !value.includes("SEMI") && !value.includes("QUARTER")) return 50;
  if (value.includes("SEMI")) return 40;
  if (value.includes("QUARTER")) return 30;
  if (value.includes("ROUND")) return 20;
  return 10;
}

function normalizeMatch(match) {
  const local = formatLocal(match.utcDate);
  const favorite = includesFavoriteTeam(match);
  const home = displayTeamName(match.homeTeam);
  const away = displayTeamName(match.awayTeam);
  const scoreHome = match.score?.fullTime?.home ?? null;
  const scoreAway = match.score?.fullTime?.away ?? null;
  const reasons = [];
  if (favorite) reasons.push("你关注的球队出战");
  if (stageWeight(match.stage) >= 30) reasons.push("淘汰赛关键场次");
  const hour = Number(local.time.slice(0, 2));
  if (hour >= 18 && hour <= 22) reasons.push("当地晚间友好开球");
  if (reasons.length === 0) reasons.push("世界杯赛程推荐");
  return {
    uid: `football-data-wc-${match.id}@world-cup-daily`,
    id: String(match.id),
    utcDate: match.utcDate,
    localDateKey: local.dateKey,
    localDate: local.date,
    localTime: local.time,
    homeTeam: home,
    awayTeam: away,
    score: scoreHome === null || scoreAway === null ? null : `${scoreHome}–${scoreAway}`,
    stage: String(match.stage || "阶段待定").replaceAll("_", " "),
    venue: match.venue || "场地待定",
    status: match.status,
    statusLabel: statusLabels[match.status] || match.status || "状态未知",
    recommendationReason: reasons.join(" · "),
    favorite,
    rank: (favorite ? 100 : 0) + stageWeight(match.stage),
    source: envelope.meta?.source || "football-data.org",
    sourceUrl: normalizeUrl(envelope.meta?.sourceUrl || "https://www.football-data.org/")
  };
}

const matches = (envelope.data?.matches || []).map(normalizeMatch);
const yesterdayResults = matches
  .filter((match) => match.localDateKey === yesterday && match.status === "FINISHED")
  .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
const byRecommendation = (a, b) => b.rank - a.rank || a.utcDate.localeCompare(b.utcDate);
const todayMatches = matches.filter((match) => match.localDateKey === today).sort(byRecommendation);
const tomorrowMatches = matches.filter((match) => match.localDateKey === tomorrow).sort(byRecommendation);

function validateNews(item) {
  if (!item?.title || !item?.summary || !item?.source || !item?.publishedAt || !item?.url) return null;
  const published = new Date(item.publishedAt);
  if (Number.isNaN(published.valueOf())) return null;
  const related = [...(item.relatedTeams || []), ...(item.relatedPlayers || [])]
    .map((value) => String(value).toLocaleLowerCase());
  const personalized = [...favoriteTeams, ...favoritePlayers].some((favorite) =>
    related.some((value) => value.includes(favorite) || favorite.includes(value))
  );
  try {
    return {
      title: String(item.title),
      summary: String(item.summary),
      source: String(item.source),
      publishedAt: published.toISOString(),
      publishedLabel: new Intl.DateTimeFormat("zh-CN", {
        timeZone: profile.timezone,
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(published),
      url: normalizeUrl(item.url),
      verification: item.verification === "unconfirmed" ? "unconfirmed" : "confirmed",
      personalized
    };
  } catch {
    return null;
  }
}

const maxNews = profile.density === "compact" ? 3 : 5;
const newsItems = Array.isArray(newsEnvelope.items) ? newsEnvelope.items : [];
const news = newsItems
  .map(validateNews)
  .filter(Boolean)
  .sort((a, b) => Number(b.personalized) - Number(a.personalized) || b.publishedAt.localeCompare(a.publishedAt))
  .slice(0, maxNews);

const focus = [
  profile.favoriteTeams.length ? `关注球队：${profile.favoriteTeams.join("、")}` : "",
  profile.favoritePlayers.length ? `关注球星：${profile.favoritePlayers.join("、")}` : ""
].filter(Boolean);
const favoriteToday = todayMatches.filter((match) => match.favorite);

const output = {
  meta: {
    date: today,
    yesterday,
    tomorrow,
    timezone: profile.timezone,
    generatedAt: now.toISOString(),
    matchData: {
      source: envelope.meta?.source || "football-data.org",
      sourceUrl: envelope.meta?.sourceUrl || "https://www.football-data.org/",
      fetchedAt: envelope.meta?.fetchedAt || null,
      isCached: Boolean(envelope.meta?.isCached),
      cacheReason: envelope.meta?.cacheReason || null
    },
    newsFetchedAt: newsEnvelope.fetchedAt || null
  },
  profile: {
    version: 1,
    favoriteTeams: profile.favoriteTeams,
    favoritePlayers: profile.favoritePlayers,
    timezone: profile.timezone,
    dailyDeliveryTime: profile.dailyDeliveryTime,
    reminderMinutes: profile.reminderMinutes,
    density: profile.density,
    updatedAt: profile.updatedAt || null
  },
  headline: {
    title: favoriteToday.length ? `${favoriteToday[0].homeTeam} vs ${favoriteToday[0].awayTeam}，今天别错过` : "你的世界杯晨报已送达",
    summary: focus.length ? focus.join(" · ") : "尚未设置关注球队或球星，可随时通过右上角修改偏好。"
  },
  yesterdayResults,
  todayMatches,
  tomorrowMatches,
  news
};

await writeJson(args.out, output);
console.log(`Normalized ${matches.length} matches and ${news.length} news stories for ${today}.`);
