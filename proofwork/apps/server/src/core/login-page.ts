// Self-contained sign-in page used by the desktop app's browser hand-off.
const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);

export function renderLoginPage(state: string): string {
  // JSON-encoded and "<"-escaped so the value can never close the script block.
  const stateLiteral = JSON.stringify(state).replace(/</g, "\\u003c");
  const stateText = escapeHtml(state);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sign in to Proofwork</title>
<style>
  :root { color-scheme: dark; --bg: #0d0d12; --panel: #16161f; --line: #262634; --text: #ecebf5; --muted: #8d8ba3; --accent: #7B6CF6; --danger: #f47b7b; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--text);
    font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .card { width: min(400px, 100%); background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 32px 28px; }
  .mark { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 22px; letter-spacing: -0.02em; }
  .dot { width: 14px; height: 14px; border-radius: 5px; background: var(--accent); box-shadow: 0 0 24px rgba(123, 108, 246, 0.6); }
  h1 { font-size: 18px; margin: 22px 0 6px; font-weight: 600; }
  p.lede { margin: 0 0 22px; color: var(--muted); font-size: 14px; }
  label { display: block; font-size: 13px; color: var(--muted); margin: 14px 0 6px; }
  input { width: 100%; padding: 11px 12px; border-radius: 10px; border: 1px solid var(--line); background: #0f0f16; color: var(--text); font: inherit; }
  input:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }
  button { margin-top: 22px; width: 100%; padding: 12px; border: 0; border-radius: 12px; background: var(--accent); color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
  button:disabled { opacity: 0.6; cursor: default; }
  .error { min-height: 20px; margin-top: 14px; color: var(--danger); font-size: 14px; }
  .done { display: none; text-align: center; }
  .done.show { display: block; }
  .done h1 { margin-top: 10px; }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); text-align: center; }
  code { color: var(--muted); }
</style>
</head>
<body>
<main class="card">
  <div class="mark"><span class="dot"></span>Proofwork</div>
  <form id="form" novalidate>
    <h1>Sign in to continue</h1>
    <p class="lede">Learn by doing real work. Your progress stays on this server.</p>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" required autofocus>
    <label for="name">Display name <span>(optional)</span></label>
    <input id="name" name="name" type="text" autocomplete="name" maxlength="80">
    <button id="submit" type="submit">Continue to Proofwork</button>
    <div class="error" id="error" role="alert"></div>
  </form>
  <section class="done" id="done">
    <div class="dot" style="margin: 0 auto"></div>
    <h1>You are signed in</h1>
    <p class="lede">You can return to Proofwork now.</p>
  </section>
  <div class="foot">Request <code>${stateText.slice(0, 8)}</code></div>
</main>
<script>
(function () {
  var STATE = ${stateLiteral};
  var form = document.getElementById("form");
  var errorBox = document.getElementById("error");
  var button = document.getElementById("submit");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorBox.textContent = "";
    var email = document.getElementById("email").value.trim().toLowerCase();
    var name = document.getElementById("name").value.trim();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      errorBox.textContent = "Enter a valid email address.";
      return;
    }
    button.disabled = true;
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(name ? { email: email, name: name } : { email: email })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Sign-in failed. Try again.");
        return res.json();
      })
      .then(function (data) {
        form.style.display = "none";
        document.getElementById("done").classList.add("show");
        window.location = "proofwork://auth/callback?token=" + encodeURIComponent(data.token) + "&state=" + encodeURIComponent(STATE);
      })
      .catch(function (err) {
        button.disabled = false;
        errorBox.textContent = err && err.message ? err.message : "Sign-in failed. Try again.";
      });
  });
})();
</script>
</body>
</html>`;
}
