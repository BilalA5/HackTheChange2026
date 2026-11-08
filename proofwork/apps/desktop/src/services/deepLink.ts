// proofwork:// links: auth callbacks and in-app routes. Handles links that arrive before ready and second instances.
import { app } from "electron";
import path from "node:path";
import { PROTOCOL_SCHEME } from "@pw/shared";
import { log, errorMessage } from "../log.ts";
import { focusMain } from "../windows/mainWindow.ts";
import { handleLoginCallback, type AuthDeps } from "./authFlow.ts";

let ready = false;
const queued: string[] = [];
let authDeps: AuthDeps | null = null;

export function registerProtocolClient(): void {
  const ok = app.isPackaged
    ? app.setAsDefaultProtocolClient(PROTOCOL_SCHEME)
    : app.setAsDefaultProtocolClient(PROTOCOL_SCHEME, process.execPath, [path.resolve(app.getAppPath())]);
  if (!ok) log.warn("could not register the proofwork:// protocol handler");
}

/** Must be called once at startup, before ready, so macOS open-url events are never missed. */
export function listenForOpenUrl(): void {
  app.on("open-url", (event, url) => {
    event.preventDefault();
    deliver(url);
  });
}

export function setDeepLinkDeps(deps: AuthDeps): void {
  authDeps = deps;
}

export function markReady(): void {
  ready = true;
  for (const url of queued.splice(0)) handleUrl(url);
}

export function deliver(url: string): void {
  if (!ready) {
    queued.push(url);
    return;
  }
  handleUrl(url);
}

export function handleUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    log.warn("ignored a malformed proofwork:// link");
    return;
  }
  if (url.protocol !== `${PROTOCOL_SCHEME}:`) return;

  if (url.host === "auth" && url.pathname === "/callback") {
    if (!authDeps) return;
    const token = url.searchParams.get("token") ?? "";
    const state = url.searchParams.get("state") ?? "";
    handleLoginCallback(authDeps, token, state).catch((err: unknown) => {
      log.error(`auth callback failed: ${errorMessage(err)}`);
    });
    return;
  }

  if (url.host === "open") {
    focusMain(url.pathname || "/");
    return;
  }

  log.info(`ignored an unknown proofwork:// link (host ${url.host})`);
}

/** Second instance on win/linux: the link is in argv. */
export function handleSecondInstance(argv: string[]): void {
  const link = argv.find((a) => a.startsWith(`${PROTOCOL_SCHEME}://`));
  if (link) deliver(link);
  focusMain();
}
