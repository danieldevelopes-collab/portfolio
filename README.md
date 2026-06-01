# portfolio

[![Deploy (live)](https://github.com/danieldevelopes-collab/portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/danieldevelopes-collab/portfolio/actions/workflows/deploy.yml)
[![PR Preview](https://github.com/danieldevelopes-collab/portfolio/actions/workflows/preview.yml/badge.svg)](https://github.com/danieldevelopes-collab/portfolio/actions/workflows/preview.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**▶ Live: [danieldevelopes-portfolio.web.app](https://danieldevelopes-portfolio.web.app)**

A single, public repository that hosts a **living portfolio** of every project I build.
Every repo gets a polished page — what it is, how it works, how to run it — and the
projects that run in a browser are **embedded live, unmodified**. New projects are added
by appending to one manifest; a push rebuilds and redeploys everything.

- **Live + brochure.** Web apps run in an in-page frame (the real repo, verbatim).
  Desktop / CLI projects get a "brochure-max" page with their real screenshots.
- **One source of truth.** [`data/repos.json`](data/repos.json) drives the whole site.
- **No rewrites.** Source repos are cloned at build time and vendored as-is.
- **Free-tier hostable.** Pure static output → Firebase Hosting (Spark plan), or any
  static host (Cloudflare Pages, GitHub Pages, Netlify…).

```
data/repos.json ──▶ scripts/build.mjs ──▶ dist/ ──▶ Firebase Hosting
      ▲                    │
   npm run sync       clones each repo into .cache/, copies live apps
 (discovers repos)    + screenshots, renders landing + one page per repo
```

## Quick start

```bash
npm run dev        # build + preview at http://localhost:5050
npm run build      # build dist/ only
npm run sync       # add stub entries for any public repos not yet in the manifest
npm run clean      # remove dist/
```

No runtime dependencies — just Node 18+ and `git` (and `gh` for `sync`).

## Adding a project (the pipeline)

1. **Discover it.** Run `npm run sync`. It calls the `gh` CLI, finds public repos not
   already in the manifest, and appends a stub for each (with `TODO` fields). You can
   also add an entry by hand.

2. **Fill it in.** Edit the new block in [`data/repos.json`](data/repos.json):

   ```jsonc
   {
     "slug": "my-repo",                 // must match the GitHub repo name
     "name": "my-repo",
     "tagline": "One punchy line.",
     "summary": "A couple of sentences. Blank lines become paragraphs.",
     "language": "TypeScript",
     "accent": "#6ea8fe",               // drives the page's accent colour
     "tags": ["React", "Vite"],
     "repoUrl": "https://github.com/danieldevelopes-collab/my-repo",
     "platform": "Web — runs live in your browser",
     "screenshots": [
       { "src": "docs/hero.png", "alt": "Describe the shot" }  // path *inside the repo*
     ],
     "live": null,                      // see below to make it run live
     "howItWorks": ["Step one.", "Step two."],
     "run": [{ "label": "Run it", "code": "npm install && npm run dev" }]
   }
   ```

3. **Make it run live (only if it's a static/browser app).** Set `live` to tell the
   build which files to vendor verbatim into `dist/apps/<slug>/` and which is the entry:

   ```jsonc
   "live": {
     "type": "static",
     "entry": "index.html",
     "include": ["index.html", "main.js", "styles.css", "engine", "modes"]
   }
   ```

   Leave `live: null` for desktop / CLI / server apps — they render as a brochure with
   their screenshots. (Free-tier hosting is static-only: anything needing a running
   backend stays a brochure.)

4. **Build & deploy.** `npm run build` to preview locally; push to `main` to ship.

## Deploying to Firebase (free tier)

One-time setup:

```bash
firebase login
firebase use --add        # pick/select your Firebase project (updates .firebaserc)
npm run build
firebase deploy --only hosting
```

`.firebaserc` currently has a placeholder project id — `firebase use --add` overwrites it.

### Automated deploys (CI)

Two workflows drive CI/CD — both run `npm run build` + `npm run validate` first, so a
broken build never deploys:

- [`deploy.yml`](.github/workflows/deploy.yml) — on push to `main`, deploys to the **live** channel.
- [`preview.yml`](.github/workflows/preview.yml) — on every PR, deploys to a throwaway **preview channel** (7-day expiry) and comments the URL on the PR.

They need two repository settings (Settings → Secrets and variables → Actions):

| Kind     | Name                       | Value |
|----------|----------------------------|-------|
| Variable | `FIREBASE_PROJECT_ID`      | your Firebase project id |
| Secret   | `FIREBASE_SERVICE_ACCOUNT` | a Firebase service-account JSON (Project settings → Service accounts → Generate new private key) |

The build step clones the public source repos itself, so no other secrets are required.

## Layout

```
data/repos.json            the manifest — the single source of truth
scripts/build.mjs          manifest → dist/ (clone, vendor live apps, render pages)
scripts/sync.mjs           discover public repos via `gh`, append manifest stubs
scripts/serve.mjs          zero-dep local preview server (emulates Firebase cleanUrls)
scripts/lib/templates.mjs  HTML templates (landing grid + project pages)
assets/                    styles.css + app.js (copied into dist/assets/)
firebase.json              Firebase Hosting config (serves dist/)
.cache/                    shallow clones of source repos (git-ignored, rebuilt on demand)
dist/                      build output (git-ignored)
```
