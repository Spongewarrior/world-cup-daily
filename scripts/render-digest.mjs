#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, readJson } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.data || !args.template || !args.out) {
  throw new Error("Usage: render-digest.mjs --data FILE --template FILE --out FILE");
}

const data = await readJson(args.data);
const template = await fs.readFile(args.template, "utf8");
const serialized = JSON.stringify(data).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
if (!template.includes("__DIGEST_DATA__")) throw new Error("Template is missing __DIGEST_DATA__ placeholder");
const html = template.replace("__DIGEST_DATA__", serialized);
await fs.mkdir(path.dirname(path.resolve(args.out)), { recursive: true });
await fs.writeFile(args.out, html, "utf8");
console.log(`Rendered ${args.out}`);
