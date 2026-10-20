// Copy rule checker: no hyphen, en dash or em dash in anything a visitor sees or hears.
// Scans every *.html (text nodes, <title>, title/alt/aria-label/placeholder, and the
// content of the description, og:title and og:description metas), every string in
// js/copy.js, and the name and reason values that js/mock-data.js produces.
// <script>, <style>, <code> and <pre> are skipped. Exit code 1 on any finding.
// Usage: node scripts/check-copy.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DASH = /[-–—]/;
const findings = [];
const report = (file, line, text) => findings.push(`${file}:${line}  ${text.trim().slice(0, 120)}`);

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&copy;/g, "©");

/* ------------------------------------------------------------ html */

// blank a block but keep its newlines, so offsets still map to the right line
const blank = (s) => s.replace(/[^\n]/g, " ");

function scanHtml(file) {
  const raw = readFileSync(join(root, file), "utf8");
  const lineOf = (i) => raw.slice(0, i).split("\n").length;
  const s = raw
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/<(script|style|code|pre)\b[\s\S]*?<\/\1>/gi, blank)
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, (m) => (/<foreignobject/i.test(m) ? m : blank(m)));

  // attributes read by people or screen readers
  for (const m of s.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const [, tag, attrs] = m;
    for (const a of attrs.matchAll(/\s(title|alt|aria-label|placeholder)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      const v = decode(a[3] ?? a[4] ?? a[5] ?? "");
      if (DASH.test(v)) report(file, lineOf(m.index), `${a[1]}="${v}"`);
    }
    if (tag.toLowerCase() === "meta") {
      const key = (attrs.match(/\s(?:name|property)\s*=\s*"?([^"\s>]+)/i) || [])[1] || "";
      if (["description", "og:title", "og:description"].includes(key.toLowerCase())) {
        const v = decode((attrs.match(/\scontent\s*=\s*"([^"]*)"/i) || [])[1] || "");
        if (DASH.test(v)) report(file, lineOf(m.index), `meta ${key}: ${v}`);
      }
    }
  }
  // text nodes, the title included
  for (const m of s.matchAll(/>([^<]+)</g)) {
    const text = decode(m[1]);
    if (text.trim() && DASH.test(text)) report(file, lineOf(m.index + 1), text);
  }
}

/* ------------------------------------------------------------ js/copy.js */

function walk(value, path, out) {
  if (typeof value === "string") out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k, out));
  return out;
}

async function scanCopy() {
  const file = "js/copy.js";
  const src = readFileSync(join(root, file), "utf8").split("\n");
  const { copy } = await import(pathToFileURL(join(root, file)).href);
  for (const [path, v] of walk(copy, "", [])) {
    if (!DASH.test(v)) continue;
    const line = src.findIndex((l) => l.includes(JSON.stringify(v).slice(1, -1).slice(0, 30))) + 1;
    report(file, line || "?", `${path}: ${v}`);
  }
}

/* ------------------------------------------------------------ js/mock-data.js: name and reason only */

async function scanMock() {
  const file = "js/mock-data.js";
  const m = await import(pathToFileURL(join(root, file)).href);
  const { agents, markets } = m.buildDataset(Date.UTC(2026, 9, 19, 12));
  const seen = new Set();
  const check = (field, v) => { if (typeof v === "string" && !seen.has(v)) { seen.add(v); if (DASH.test(v)) report(file, "?", `${field}: ${v}`); } };
  for (const a of agents) {
    check("name", a.name);
    a.trades.forEach((t) => check("reason", t.reason));
    a.lastDecisions.forEach((d) => check("reason", d.reason));
  }
  for (let n = 0; n < 200; n++) check("reason", m.liveTrade(n, agents, markets).reason);
}

/* ------------------------------------------------------------ run */

const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));
htmlFiles.forEach(scanHtml);
await scanCopy();
await scanMock();

if (findings.length) {
  console.log(`check-copy: ${findings.length} finding(s)`);
  findings.forEach((f) => console.log("  " + f));
  process.exit(1);
}
console.log(`check-copy: clean (${htmlFiles.length} html files, js/copy.js, js/mock-data.js)`);
