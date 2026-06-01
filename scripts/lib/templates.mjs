// HTML templates for the portfolio. Pure functions, no dependencies.
// All asset/links are root-absolute ("/assets/…", "/<slug>") so pages work
// at any depth on Firebase Hosting and the local preview server alike.

export function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escape a shell snippet and dim trailing "  # comment" segments.
function shell(code = "") {
  return code
    .split("\n")
    .map((line) => {
      const m = line.match(/^(.*?)(\s#.*)$/);
      if (m) return escapeHtml(m[1]) + '<span class="tok-comment">' + escapeHtml(m[2]) + "</span>";
      return escapeHtml(line);
    })
    .join("\n");
}

const GH_ICON =
  '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

const PLAY_ICON =
  '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11a.5.5 0 00.76.43l9-5.5a.5.5 0 000-.86l-9-5.5A.5.5 0 004 2.5z"/></svg>';

function kindLabel(repo) {
  if (repo.live) return "Live demo";
  const p = repo.platform || "";
  if (/desktop/i.test(p)) return "Desktop app";
  if (/cli/i.test(p)) return "CLI tool";
  if (/local app/i.test(p)) return "Local app";
  return "Project";
}

function tagsHtml(tags = [], limit = 99) {
  return tags
    .slice(0, limit)
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");
}

// ---------- shared chrome ----------

function head({ title, description, accent, canonical, ogImage }) {
  const favicon =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='4' fill='#0a0c12'/><rect x='3' y='3' width='10' height='3' rx='1.5' fill='${accent}'/><rect x='3' y='7' width='6' height='3' rx='1.5' fill='#b692ff'/><rect x='3' y='11' width='8' height='2.5' rx='1.25' fill='#39d98a'/></svg>`
    );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="${escapeHtml(accent)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">\n<meta property="og:url" content="${escapeHtml(canonical)}">` : ""}
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">\n<meta name="twitter:card" content="summary_large_image">` : ""}
<link rel="icon" href="${favicon}">
<link rel="stylesheet" href="/assets/styles.css">
</head>`;
}

function siteHeader(site) {
  return `<header class="site-header"><div class="wrap">
  <a class="brand-mark" href="/"><span class="dot"></span>${escapeHtml(site.author)}</a>
  <nav class="nav-links">
    <a href="/#projects">Projects</a>
    <a href="${escapeHtml(site.githubUrl)}" target="_blank" rel="noopener">GitHub ↗</a>
  </nav>
</div></header>`;
}

function siteFooter(site, count) {
  return `<footer class="site-footer"><div class="wrap">
  <span>${escapeHtml(site.author)} — ${count} project${count === 1 ? "" : "s"} and counting.</span>
  <span>Built as one repo · static · <a href="${escapeHtml(site.githubUrl)}" target="_blank" rel="noopener">@${escapeHtml(site.owner)}</a></span>
</div></footer>`;
}

// ---------- landing ----------

export function landingPage(site) {
  const repos = site.repos;
  const liveCount = repos.filter((r) => r.live).length;
  const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))];

  const cards = repos.map((repo) => card(repo)).join("\n");

  const body = `<body>
${siteHeader(site)}
<main>
  <section class="wrap hero">
    <h1>${escapeHtml(site.tagline)}</h1>
    <p class="lede">${escapeHtml(site.intro)}</p>
    <div class="meta-row">
      <span class="stat"><b>${repos.length}</b> projects</span>
      <span class="stat"><b>${liveCount}</b> playable live</span>
      <span class="stat"><b>${langs.length}</b> languages</span>
    </div>
  </section>

  <section class="wrap" id="projects">
    <div class="section-head">
      <h2>Projects <span class="hint">(<span id="result-count">${repos.length}</span>)</span></h2>
      <input class="btn ghost" id="filter" placeholder="Filter projects —  press /" autocomplete="off" style="min-width:220px;color:var(--text)">
    </div>
    <div class="grid">
${cards}
    </div>
  </section>
</main>
${siteFooter(site, repos.length)}
<script src="/assets/app.js" defer></script>
</body></html>`;

  return (
    head({
      title: site.siteTitle,
      description: site.intro,
      accent: "#6ea8fe",
      canonical: site.siteUrl ? `${site.siteUrl}/` : undefined,
      ogImage: (() => { const r = repos.find((x) => x.screenshots && x.screenshots[0] && x.screenshots[0].file); return r ? `${site.siteUrl}/assets/shots/${r.slug}/${r.screenshots[0].file}` : undefined; })(),
    }) + body
  );
}

function card(repo) {
  const shot = repo.screenshots && repo.screenshots[0];
  const search = [repo.name, repo.tagline, repo.language, ...(repo.tags || [])]
    .join(" ")
    .toLowerCase();
  const badge = repo.live
    ? '<span class="badge live"><span class="pulse"></span>LIVE DEMO</span>'
    : `<span class="badge">${escapeHtml(kindLabel(repo))}</span>`;
  const img = shot
    ? `<img src="/assets/shots/${repo.slug}/${shot.file}" alt="${escapeHtml(shot.alt || repo.name)}" loading="lazy">`
    : "";
  return `      <article class="card" style="--accent:${escapeHtml(repo.accent)}" data-search="${escapeHtml(search)}">
        <a class="stretch" href="/${repo.slug}/" aria-label="${escapeHtml(repo.name)} — view project"></a>
        <span class="accent-bar"></span>
        <div class="shot">${badge}${img}</div>
        <div class="body">
          <h3>${escapeHtml(repo.name)}</h3>
          <p class="tagline">${escapeHtml(repo.tagline)}</p>
          <div class="tags">${tagsHtml(repo.tags, 4)}</div>
          <div class="foot">
            <span class="lang"><span class="swatch"></span>${escapeHtml(repo.language)}</span>
            <span class="arrow">→</span>
          </div>
        </div>
      </article>`;
}

// ---------- detail / brochure ----------

export function detailPage(repo, site) {
  const accent = repo.accent;
  const liveUrl = repo.live
    ? repo.live.type === "external"
      ? repo.live.url
      : `/apps/${repo.slug}/${repo.live.entry === "index.html" ? "" : repo.live.entry}`
    : null;
  const liveLabel = repo.live
    ? repo.live.type === "external"
      ? repo.live.url.replace(/^https?:\/\//, "")
      : `/apps/${repo.slug}/`
    : "";
  const frameH = repo.live && repo.live.frameHeight ? repo.live.frameHeight : "clamp(460px,72vh,720px)";
  const liveNote =
    repo.live && repo.live.note
      ? repo.live.note
      : `This is the live <b>${escapeHtml(repo.name)}</b> app, running right here in the page.`;

  const actions = [
    `<a class="btn" href="${escapeHtml(repo.repoUrl)}" target="_blank" rel="noopener">${GH_ICON} View source</a>`,
  ];
  if (repo.live) {
    actions.unshift(
      `<a class="btn primary" href="${liveUrl}" target="_blank" rel="noopener">${PLAY_ICON} Open full screen</a>`
    );
  }

  // visual block: live embed, or hero screenshot gallery
  let visual = "";
  if (repo.live) {
    visual = `<section class="wrap live-stage">
    <div class="frame-wrap">
      <div class="frame-bar">
        <span class="dots"><i></i><i></i><i></i></span>
        <span class="label">${escapeHtml(liveLabel)}</span>
        <a class="open" href="${liveUrl}" target="_blank" rel="noopener">Open full screen ↗</a>
      </div>
      <iframe src="${liveUrl}" title="${escapeHtml(repo.name)} — live" loading="lazy" style="height:${frameH}"></iframe>
    </div>
    <p class="live-note">${liveNote}</p>
  </section>`;
  } else if (repo.screenshots && repo.screenshots.length) {
    visual = `<section class="wrap"><div class="gallery">` +
      repo.screenshots
        .map(
          (s) =>
            `<figure><img src="/assets/shots/${repo.slug}/${s.file}" alt="${escapeHtml(s.alt || repo.name)}" loading="lazy"><figcaption>${escapeHtml(s.alt || repo.name)}</figcaption></figure>`
        )
        .join("") +
      `</div></section>`;
  }

  const howItWorks = (repo.howItWorks || [])
    .map((step, i) => `<li><span class="n">${i + 1}</span>${escapeHtml(step)}</li>`)
    .join("");

  const runBlocks = (repo.run || [])
    .map(
      (r) =>
        `<div class="run-block"><div class="run-label">${escapeHtml(r.label)}</div><pre class="code">${shell(r.code)}</pre></div>`
    )
    .join("");

  const summaryParas = repo.summary
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");

  // extra gallery under prose for live projects (their screenshot wasn't the hero)
  const proseGallery =
    repo.live && repo.screenshots && repo.screenshots.length
      ? `<h2>Screenshot</h2><div class="gallery">` +
        repo.screenshots
          .map(
            (s) =>
              `<figure><img src="/assets/shots/${repo.slug}/${s.file}" alt="${escapeHtml(s.alt || repo.name)}" loading="lazy"><figcaption>${escapeHtml(s.alt || repo.name)}</figcaption></figure>`
          )
          .join("") +
        `</div>`
      : "";

  const body = `<body style="--accent:${escapeHtml(accent)}">
${siteHeader(site)}
<main>
  <div class="wrap"><a class="back-link" href="/">← All projects</a></div>

  <section class="wrap detail-hero">
    <span class="eyebrow"><span class="swatch"></span>${escapeHtml(repo.language)} · ${escapeHtml(kindLabel(repo))}</span>
    <h1>${escapeHtml(repo.name)}</h1>
    <p class="tagline">${escapeHtml(repo.tagline)}</p>
    <div class="actions">${actions.join("")}</div>
    <div class="tags">${tagsHtml(repo.tags)}</div>
  </section>

  ${visual}

  <section class="wrap">
    <div class="detail-grid">
      <div class="prose">
        <h2>What it is</h2>
        ${summaryParas}
        <h2>How it works</h2>
        <ol class="steps">${howItWorks}</ol>
        <h2>How to run it</h2>
        ${runBlocks}
        ${proseGallery}
      </div>
      <aside>
        <div class="meta-card">
          <div class="row"><span class="k">Language</span><span class="v">${escapeHtml(repo.language)}</span></div>
          <div class="row"><span class="k">Runs on</span><span class="v">${escapeHtml(repo.platform)}</span></div>
          <div class="row"><span class="k">Status</span><span class="v">${repo.live ? "Live in browser" : "Documented · run locally"}</span></div>
          <a class="btn primary repo-btn" href="${escapeHtml(repo.repoUrl)}" target="_blank" rel="noopener">${GH_ICON} Open on GitHub</a>
        </div>
      </aside>
    </div>
  </section>
</main>
${siteFooter(site, site.repos.length)}
</body></html>`;

  return (
    head({
      title: `${repo.name} — ${site.author}`,
      description: repo.tagline,
      accent,
      canonical: site.siteUrl ? `${site.siteUrl}/${repo.slug}/` : undefined,
      ogImage: (() => { const s = repo.screenshots && repo.screenshots[0]; return s && s.file ? `${site.siteUrl}/assets/shots/${repo.slug}/${s.file}` : undefined; })(),
    }) + body
  );
}
