#!/usr/bin/env node
// Minimal static preview server for dist/ that emulates Firebase Hosting's
// cleanUrls (so /brick-innit serves /brick-innit/index.html). Zero deps.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const DIST = path.join(ROOT, "dist");
const PORT = process.env.PORT || 5050;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const candidates = [p];
  if (!path.extname(p)) candidates.push(p + ".html", path.join(p, "index.html"));
  for (const c of candidates) {
    const full = path.join(DIST, c);
    if (full.startsWith(DIST) && fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolve(req.url === "/" ? "/index.html" : req.url);
  if (!file) {
    const f404 = path.join(DIST, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.existsSync(f404) ? fs.readFileSync(f404) : "404");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  if (!fs.existsSync(DIST)) {
    console.error("dist/ not found — run `npm run build` first.");
    process.exit(1);
  }
  console.log(`\n  Portfolio preview → http://localhost:${PORT}\n  (Ctrl+C to stop)\n`);
});
