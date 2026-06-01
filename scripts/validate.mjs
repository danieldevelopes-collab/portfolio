#!/usr/bin/env node
// Build-validation gate. Fails (exit 1) if the generated site has problems:
//   - manifest entries missing required fields or left as TODO stubs
//   - a `live` repo whose vendored entry file didn't make it into dist/apps
//   - a referenced screenshot that wasn't found at build time
//   - any internal link/asset in a generated page that points at a missing file
//   - missing SEO artifacts (sitemap.xml, robots.txt, 404.html)
// Run after `npm run build`. Used by CI before every deploy/preview.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const DIST = path.join(ROOT, "dist");
const REQUIRED = ["slug", "name", "tagline", "summary", "language", "accent", "tags", "repoUrl", "platform", "howItWorks", "run"];
const errors = [];
const fail = (m) => errors.push(m);

if (!fs.existsSync(DIST)) {
  console.error("dist/ not found — run `npm run build` first.");
  process.exit(2);
}

const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data/repos.json"), "utf8"));

// 1) manifest completeness + live integrity
for (const r of site.repos) {
  for (const f of REQUIRED) {
    const v = r[f];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))
      fail(`[manifest] ${r.slug || "?"}: missing "${f}"`);
  }
  if (/TODO/.test(JSON.stringify(r))) fail(`[manifest] ${r.slug}: contains a TODO placeholder — fill it in before shipping`);
  if (r.live && r.live.type !== "external") {
    if (!r.live.entry) fail(`[live] ${r.slug}: live.entry missing`);
    else if (!fs.existsSync(path.join(DIST, "apps", r.slug, r.live.entry)))
      fail(`[live] ${r.slug}: vendored entry missing at apps/${r.slug}/${r.live.entry}`);
  }
  for (const s of r.screenshots || []) {
    if (s.file === null) fail(`[shot] ${r.slug}: screenshot "${s.src}" was not found in the source repo at build time`);
  }
}

// 2) crawl generated pages and check every internal link/asset resolves
const pages = [];
(function collect(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "apps") continue; // vendored apps own their (relative) links
      collect(fp);
    } else if (e.name.endsWith(".html")) pages.push(fp);
  }
})(DIST);

const linkRe = /(?:href|src)="([^"]+)"/g;
let checked = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  if (/\bTODO\b/.test(html)) fail(`[content] ${path.relative(DIST, page)}: rendered page contains "TODO"`);
  let m;
  while ((m = linkRe.exec(html))) {
    const link = m[1];
    if (!link.startsWith("/") || link.startsWith("//")) continue; // external / data: / relative
    let p = link.split("#")[0].split("?")[0];
    if (!p) continue;
    if (p.endsWith("/")) p += "index.html";
    else if (!path.extname(p)) p += "/index.html";
    const target = path.join(DIST, p);
    checked++;
    if (!fs.existsSync(target)) fail(`[link] ${path.relative(DIST, page)} → ${link}  (missing ${path.relative(DIST, target)})`);
  }
}

// 3) SEO artifacts
for (const f of ["sitemap.xml", "robots.txt", "404.html"]) {
  if (!fs.existsSync(path.join(DIST, f))) fail(`[seo] missing ${f}`);
}

if (errors.length) {
  console.error(`\n✗ validation failed — ${errors.length} issue(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✓ validation passed — ${pages.length} pages, ${checked} internal links OK, ${site.repos.length} manifest entries complete`);
