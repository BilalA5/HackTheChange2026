// Static server for the renderer dist (127.0.0.1 only) with SPA fallback and a built-in page when the renderer is not built.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const FALLBACK_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Proofwork</title>
<style>
  html, body { margin: 0; height: 100%; background: #0F1115; color: #E6E8EE; font: 14px/1.5 system-ui, -apple-system, sans-serif; }
  main { min-height: 100%; display: grid; place-items: center; padding: 16px; box-sizing: border-box; text-align: center; }
  code { font-family: ui-monospace, Menlo, monospace; color: #B9B3FF; }
  p { margin: 6px 0; }
  small { color: #9BA0AA; }
</style>
</head>
<body>
<main>
  <div>
    <p><strong>Renderer not built</strong></p>
    <p>Run <code>npm run build -w @pw/renderer</code>, then restart.</p>
    <p><small id="bridge">Checking desktop bridge...</small></p>
  </div>
</main>
<script>
  document.getElementById("bridge").textContent = window.pw ? "Desktop bridge: connected" : "Desktop bridge: not available";
</script>
</body>
</html>
`;

export interface ProdServer {
  url: string;
  close(): Promise<void>;
}

export function startProdServer(opts: { distDir: string; port: number }): Promise<ProdServer> {
  const distRoot = path.resolve(opts.distDir);
  const hasDist = fs.existsSync(path.join(distRoot, "index.html"));

  const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? "/", "http://127.0.0.1").pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }

    const common = { "X-Content-Type-Options": "nosniff" };

    if (!hasDist) {
      res.writeHead(200, { ...common, "Content-Type": MIME[".html"], "Cache-Control": "no-cache" });
      res.end(req.method === "HEAD" ? undefined : FALLBACK_HTML);
      return;
    }

    const file = path.resolve(distRoot, `.${pathname}`);
    if (file !== distRoot && !file.startsWith(distRoot + path.sep)) {
      res.writeHead(403).end();
      return;
    }

    let target = file;
    let isFile = false;
    try {
      isFile = fs.statSync(file).isFile();
    } catch {
      isFile = false;
    }
    if (!isFile) {
      // Missing assets must 404 (a JS request must not receive HTML); extensionless routes fall back to the SPA shell.
      if (path.extname(pathname)) {
        res.writeHead(404, common).end();
        return;
      }
      target = path.join(distRoot, "index.html");
    }

    const ext = path.extname(target).toLowerCase();
    const hashed = /\/assets\/.+-[\w-]{8,}\.\w+$/.test(pathname);
    res.writeHead(200, {
      ...common,
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": hashed ? "public, max-age=31536000, immutable" : "no-cache",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    const stream = fs.createReadStream(target);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once("error", (err: NodeJS.ErrnoException) => {
      reject(
        err.code === "EADDRINUSE"
          ? new Error(`renderer port ${opts.port} is already in use`)
          : err,
      );
    });
    server.listen(opts.port, "127.0.0.1", () => {
      resolve({
        url: `http://127.0.0.1:${opts.port}`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}
