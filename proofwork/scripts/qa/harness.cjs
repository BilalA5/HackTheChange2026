// Invisible QA browser: an offscreen Electron window driven over a tiny local HTTP API.
// Start:  npx electron scripts/qa/harness.cjs [port=9555] [width=1280] [height=800]
// API (all GET, 127.0.0.1 only):
//   /goto?url=…            navigate and wait for load
//   /eval?js=…             run JS in the page, returns JSON result
//   /shot?out=/abs/path.png[&full=1]  save a screenshot
//   /click?x=…&y=…         real mouse click at CSS px
//   /type?text=…           type text into the focused element
//   /key?key=Enter         press a key
//   /size?w=…&h=…          resize the viewport
//   /quit
const { app, BrowserWindow } = require("electron");
const http = require("node:http");
const fs = require("node:fs");

const [port = "9555", width = "1280", height = "800"] = process.argv.slice(2).filter((a) => !a.startsWith("-") && !a.endsWith(".cjs"));
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.dock?.hide();

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: Number(width),
    height: Number(height),
    show: false,
    webPreferences: { offscreen: true, backgroundThrottling: false },
  });
  win.webContents.setFrameRate(30);
  const wc = win.webContents;
  const logs = [];
  wc.on("console-message", (_e, level, message) => { logs.push(`[${level}] ${message}`); if (logs.length > 300) logs.shift(); });

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://x");
    const q = Object.fromEntries(u.searchParams);
    const send = (code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
    try {
      switch (u.pathname) {
        case "/goto":
          await wc.loadURL(q.url);
          await new Promise((r) => setTimeout(r, Number(q.wait ?? 800)));
          return send(200, { ok: true, url: wc.getURL() });
        case "/eval": {
          const v = await wc.executeJavaScript(q.js, true);
          return send(200, { ok: true, value: v ?? null });
        }
        case "/shot": {
          await new Promise((r) => setTimeout(r, Number(q.wait ?? 250)));
          const img = await wc.capturePage();
          fs.writeFileSync(q.out, img.toPNG());
          return send(200, { ok: true, out: q.out, size: img.getSize() });
        }
        case "/click": {
          const x = Number(q.x), y = Number(q.y);
          wc.sendInputEvent({ type: "mouseMove", x, y });
          wc.sendInputEvent({ type: "mouseDown", x, y, button: "left", clickCount: 1 });
          wc.sendInputEvent({ type: "mouseUp", x, y, button: "left", clickCount: 1 });
          await new Promise((r) => setTimeout(r, 120));
          return send(200, { ok: true });
        }
        case "/drag": {
          // pts=x1,y1;x2,y2;…  (CSS px) — press at the first point, move through the rest, release at the last.
          const pts = String(q.pts).split(";").map((p) => p.split(",").map(Number));
          const [sx, sy] = pts[0];
          wc.sendInputEvent({ type: "mouseMove", x: sx, y: sy });
          wc.sendInputEvent({ type: "mouseDown", x: sx, y: sy, button: "left", clickCount: 1 });
          for (const [x, y] of pts.slice(1)) {
            wc.sendInputEvent({ type: "mouseMove", x, y, modifiers: ["leftButtonDown"] });
            await new Promise((r) => setTimeout(r, 16));
          }
          const [ex, ey] = pts[pts.length - 1];
          wc.sendInputEvent({ type: "mouseUp", x: ex, y: ey, button: "left", clickCount: 1 });
          return send(200, { ok: true, points: pts.length });
        }
        case "/type":
          await wc.insertText(q.text);
          return send(200, { ok: true });
        case "/key":
          wc.sendInputEvent({ type: "keyDown", keyCode: q.key });
          if (q.key.length === 1) wc.sendInputEvent({ type: "char", keyCode: q.key });
          wc.sendInputEvent({ type: "keyUp", keyCode: q.key });
          return send(200, { ok: true });
        case "/size":
          win.setContentSize(Number(q.w), Number(q.h));
          return send(200, { ok: true });
        case "/logs":
          return send(200, { ok: true, logs: logs.splice(0) });
        case "/quit":
          send(200, { ok: true });
          return setTimeout(() => app.exit(0), 50);
        default:
          return send(404, { ok: false });
      }
    } catch (err) {
      return send(500, { ok: false, error: String(err && err.message || err) });
    }
  });
  server.listen(Number(port), "127.0.0.1", () => console.log(`qa harness on http://127.0.0.1:${port}`));
});
app.on("window-all-closed", (e) => e.preventDefault());
