import fs from "node:fs/promises";
import path from "node:path";

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

export async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function assertProfile(profile) {
  if (!profile || profile.version !== 1) throw new Error("profile.version must be 1");
  if (!Array.isArray(profile.favoriteTeams) || !Array.isArray(profile.favoritePlayers)) {
    throw new Error("favoriteTeams and favoritePlayers must be arrays");
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: profile.timezone }).format();
  } catch {
    throw new Error(`Invalid IANA timezone: ${profile.timezone}`);
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(profile.dailyDeliveryTime)) {
    throw new Error("dailyDeliveryTime must use HH:mm");
  }
  if (!Number.isInteger(profile.reminderMinutes) || profile.reminderMinutes < 0 || profile.reminderMinutes > 1440) {
    throw new Error("reminderMinutes must be an integer from 0 through 1440");
  }
  if (!["compact", "balanced", "deep"].includes(profile.density)) {
    throw new Error("density must be compact, balanced, or deep");
  }
}

export function localDateKey(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function normalizeUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP(S) URLs are allowed");
  return url.toString();
}
