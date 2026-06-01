#!/usr/bin/env node
// Pipeline step: discover public repos from GitHub and add stub entries to the
// manifest for any that aren't there yet. You then fill in the curated copy,
// screenshots, and (if it runs in a browser) the `live` block — and rebuild.
//
// Requires the `gh` CLI, authenticated. Never overwrites existing entries.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const MANIFEST = path.join(ROOT, "data/repos.json");
const ACCENTS = ["#6ea8fe", "#2bd4a0", "#e0894e", "#b692ff", "#f4b740", "#ff7a90", "#39d98a"];

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
}

function main() {
  const site = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const owner = site.owner;
  const have = new Set(site.repos.map((r) => r.slug));

  const remote = JSON.parse(
    gh([
      "repo", "list", owner,
      "--visibility", "public",
      "--no-archived",
      "--source", // exclude forks
      "--limit", "200",
      "--json", "name,description,primaryLanguage,repositoryTopics,isFork",
    ])
  );

  const added = [];
  let i = site.repos.length;
  for (const r of remote) {
    if (r.isFork) continue;
    if (r.name === owner) continue; // the profile README repo
    if (have.has(r.name)) continue;

    const lang = r.primaryLanguage?.name || "";
    const topics = (r.repositoryTopics || []).map((t) => t.name);
    site.repos.push({
      slug: r.name,
      name: r.name,
      tagline: r.description || "TODO — one-line tagline.",
      summary: r.description || "TODO — what it is, in a couple of sentences.",
      language: lang,
      accent: ACCENTS[i++ % ACCENTS.length],
      tags: [lang, ...topics].filter(Boolean).slice(0, 5),
      repoUrl: `https://github.com/${owner}/${r.name}`,
      platform: "TODO — e.g. Web · Desktop · CLI",
      screenshots: [],
      live: null,
      howItWorks: ["TODO — how it works, step by step."],
      run: [{ label: "Run it", code: "TODO" }],
    });
    added.push(r.name);
  }

  if (!added.length) {
    console.log("✓ manifest already covers every public repo. Nothing to add.");
    return;
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(site, null, 2) + "\n");
  console.log(`+ added ${added.length} stub${added.length === 1 ? "" : "s"}: ${added.join(", ")}`);
  console.log("  Fill in tagline / summary / screenshots / live in data/repos.json, then `npm run build`.");
}

main();
