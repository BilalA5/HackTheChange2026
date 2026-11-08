// Shell titlebar script: renders titlebar state and forwards button clicks to the main process.
// Bridge members used here are the shell-only extension exposed by preload.ts (window.pw.shell).

interface ShellTitlebarState {
  title?: string;
  credits?: number | null;
  level?: number;
  canGoBack?: boolean;
}

interface ShellBridge {
  window: { toggleMaximize(): void };
  shell?: {
    titlebarAction(action: string): void;
    onTitlebarState(cb: (state: ShellTitlebarState) => void): () => void;
  };
}

const pw = (window as unknown as { pw?: ShellBridge }).pw;
const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const titleEl = byId<HTMLDivElement>("title");
const backBtn = byId<HTMLButtonElement>("back");
const creditsBtn = byId<HTMLButtonElement>("credits");
const creditsValue = byId<HTMLSpanElement>("credits-value");
const levelValue = byId<HTMLSpanElement>("level-value");
const bar = byId<HTMLDivElement>("bar");

function render(state: ShellTitlebarState): void {
  if (typeof state.title === "string") {
    titleEl.textContent = state.title;
    document.title = state.title;
  }
  if (state.credits !== undefined) {
    creditsValue.textContent = state.credits === null ? "∞" : state.credits.toLocaleString("en-US");
    creditsBtn.setAttribute("aria-label", state.credits === null ? "Credits: unlimited" : `Credits: ${state.credits}`);
  }
  if (typeof state.level === "number") levelValue.textContent = `L${Math.max(0, Math.floor(state.level))}`;
  if (typeof state.canGoBack === "boolean") backBtn.disabled = !state.canGoBack;
}

if (pw?.shell) {
  pw.shell.onTitlebarState(render);
  document.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action) pw.shell?.titlebarAction(action);
    });
  });
}

// Double-click on empty bar space maximizes, like a native titlebar.
bar.addEventListener("dblclick", (event) => {
  if (event.target instanceof Element && event.target.closest("button, .pill")) return;
  pw?.window.toggleMaximize();
});
