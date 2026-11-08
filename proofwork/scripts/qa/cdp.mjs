// Minimal Chrome DevTools Protocol helper for a locally running Proofwork desktop build started with --remote-debugging-port (loopback only).
// Usage:
//   node cdp.mjs list
//   node cdp.mjs shot  <urlSubstring> <out.png> [--full]
//   node cdp.mjs eval  <urlSubstring> '<js expression>'
//   node cdp.mjs text  <urlSubstring>
//   node cdp.mjs click <urlSubstring> '<visible text or css:selector>'
//   node cdp.mjs reload <urlSubstring>
const PORT = process.env.CDP_PORT || 9333;
const BASE = `http://127.0.0.1:${PORT}`;

async function targets() {
  const r = await fetch(`${BASE}/json/list`);
  return (await r.json()).filter((t) => t.type === "page");
}

function pick(list, sub) {
  // "main" = the app view; "shell" = the titlebar page; otherwise a substring of the URL (e.g. "surface=island").
  if (sub === "main") return list.find((t) => t.url.includes("surface=main"));
  if (sub === "shell") return list.find((t) => t.url.includes("/shell.html"));
  return list.find((t) => t.url.includes(sub)) || list.find((t) => t.id === sub);
}

async function session(t) {
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const { res, rej } = pending.get(d.id);
      pending.delete(d.id);
      d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  return { send, close: () => ws.close() };
}

async function evaluate(s, expr) {
  const r = await s.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 500));
  return r.result.value;
}

const [cmd, sub, a1, a2] = process.argv.slice(2);
const list = await targets();
if (cmd === "list") {
  for (const t of list) console.log(t.id, t.url);
  process.exit(0);
}
const t = pick(list, sub);
if (!t) {
  console.error("no target for", sub, list.map((x) => x.url));
  process.exit(2);
}
const s = await session(t);
try {
  if (cmd === "shot") {
    const fs = await import("node:fs");
    const params = { format: "png", captureBeyondViewport: false };
    if (a2 === "--full") {
      const m = await s.send("Page.getLayoutMetrics");
      params.clip = { x: 0, y: 0, width: m.cssContentSize.width, height: m.cssContentSize.height, scale: 1 };
      params.captureBeyondViewport = true;
    }
    const r = await s.send("Page.captureScreenshot", params);
    fs.writeFileSync(a1, Buffer.from(r.data, "base64"));
    console.log("saved", a1);
  } else if (cmd === "eval") {
    const v = await evaluate(s, a1);
    console.log(typeof v === "string" ? v : JSON.stringify(v, null, 1));
  } else if (cmd === "text") {
    console.log(await evaluate(s, "document.body.innerText"));
  } else if (cmd === "move" || cmd === "tap") {
    const x = Number(a1),
      y = Number(a2);
    await s.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    if (cmd === "tap") {
      await s.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await s.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    }
    console.log(cmd, x, y);
  } else if (cmd === "key") {
    await s.send("Input.dispatchKeyEvent", { type: "keyDown", key: a1, code: a1 });
    await s.send("Input.dispatchKeyEvent", { type: "keyUp", key: a1, code: a1 });
    console.log("key", a1);
  } else if (cmd === "tapl") {
    // tap the centre of the first visible element whose aria-label/text equals a1
    const r = await evaluate(
      s,
      `(()=>{const w=${JSON.stringify(a1)}.toLowerCase();const el=[...document.querySelectorAll('button,a,[role=button],[role=tab],[aria-label],div,span')].find(e=>e.offsetParent!==null&&((e.getAttribute('aria-label')||'').toLowerCase()===w||(e.innerText||'').trim().toLowerCase()===w));if(!el)return null;const b=el.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()`,
    );
    if (!r) {
      console.log("not found", a1);
    } else {
      const [x, y] = r;
      await s.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await s.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await s.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
      console.log("tapped", a1, Math.round(x), Math.round(y));
    }
  } else if (cmd === "reload") {
    await s.send("Page.reload", { ignoreCache: false });
    console.log("reloaded");
  } else if (cmd === "click") {
    const js = a1.startsWith("css:")
      ? `(()=>{const el=document.querySelector(${JSON.stringify(a1.slice(4))}); if(!el) return 'not found'; el.scrollIntoView({block:'center'}); el.click(); return 'clicked '+el.tagName+' '+(el.innerText||'').slice(0,60);})()`
      : `(()=>{const want=${JSON.stringify(a1)}.toLowerCase();
          const els=[...document.querySelectorAll('button,a,[role=button],[role=tab],[role=menuitem],div,span,p,li')]
            .filter(e=>e.offsetParent!==null && (e.innerText||e.getAttribute('aria-label')||'').trim().toLowerCase()===want);
          const el=els.find(e=>['BUTTON','A'].includes(e.tagName)||e.getAttribute('role'))||els[els.length-1];
          if(!el) return 'not found';
          el.scrollIntoView({block:'center'});
          const r=el.getBoundingClientRect();
          for (const type of ['pointerdown','mousedown','pointerup','mouseup','click'])
            el.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));
          return 'clicked '+el.tagName+' '+(el.innerText||el.getAttribute('aria-label')||'').slice(0,60);})()`;
    console.log(await evaluate(s, js));
  }
} finally {
  s.close();
}
