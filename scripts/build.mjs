#!/usr/bin/env node
// Build the portfolio: manifest (data/repos.json) -> static site in dist/.
//
//  - Ensures each repo is shallow-cloned into .cache/repos/<slug> (re-cloned
//    fresh in CI, cached locally) so we can vendor live apps verbatim and pull
//    real screenshots — "exact format, no rewrites".
//  - Copies live web apps into dist/apps/<slug>/ unchanged.
//  - Copies each repo's screenshots into dist/assets/shots/<slug>/.
//  - Renders the landing grid + one brochure page per repo.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { landingPage, detailPage } from "./lib/templates.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const CACHE = path.join(ROOT, ".cache/repos");
const DIST = path.join(ROOT, "dist");

const log = (...a) => console.log("  ", ...a);

function ensureClone(owner, slug) {
  const dir = path.join(CACHE, slug);
  if (fs.existsSync(path.join(dir, ".git")) || fs.existsSync(dir)) return dir;
  fs.mkdirSync(CACHE, { recursive: true });
  log(`cloning ${slug} …`);
  execFileSync(
    "git",
    ["clone", "--depth", "1", `https://github.com/${owner}/${slug}.git`, dir],
    { stdio: ["ignore", "ignore", "inherit"] }
  );
  return dir;
}

function copyInto(src, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(src, path.join(destDir, path.basename(src)), { recursive: true });
}

function writeSeo(site) {
  const base = (site.siteUrl || "").replace(/\/$/, "");
  const urls = ["/", ...site.repos.map((r) => `/${r.slug}/`)];
  const today = new Date().toISOString().slice(0, 10);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${base}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);
  fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
}

function main() {
  const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data/repos.json"), "utf8"));

  // fresh dist
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // static assets
  fs.cpSync(path.join(ROOT, "assets"), path.join(DIST, "assets"), { recursive: true });

  for (const repo of site.repos) {
    console.log(`• ${repo.name}`);
    const repoDir = ensureClone(site.owner, repo.slug);

    // screenshots -> dist/assets/shots/<slug>/<basename>
    for (const s of repo.screenshots || []) {
      const from = path.join(repoDir, s.src);
      s.file = path.basename(s.src);
      const to = path.join(DIST, "assets/shots", repo.slug, s.file);
      if (fs.existsSync(from)) {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
        log(`shot  ${s.src}`);
      } else {
        console.warn(`   ! missing screenshot ${from}`);
        s.file = null;
      }
    }

    // live app -> dist/apps/<slug>/ (verbatim). External live embeds (an app
    // hosted elsewhere and iframed in) are not vendored.
    if (repo.live && repo.live.type !== "external") {
      const appDir = path.join(DIST, "apps", repo.slug);
      fs.mkdirSync(appDir, { recursive: true });
      for (const inc of repo.live.include) {
        const from = path.join(repoDir, inc);
        if (fs.existsSync(from)) copyInto(from, appDir);
        else console.warn(`   ! missing live file ${from}`);
      }
      log(`live  /apps/${repo.slug}/ (${repo.live.include.length} entries, verbatim)`);
    }

    // brochure / detail page -> dist/<slug>/index.html
    const pageDir = path.join(DIST, repo.slug);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, "index.html"), detailPage(repo, site));
  }

  // landing
  fs.writeFileSync(path.join(DIST, "index.html"), landingPage(site));
  // simple 404 -> reuse landing
  fs.writeFileSync(path.join(DIST, "404.html"), landingPage(site));

  // SEO: robots.txt + sitemap.xml
  writeSeo(site);

  console.log(`\n✓ built ${site.repos.length} projects → dist/`);
}

main();
