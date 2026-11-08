// Main process entry: boot order, lifecycle, single instance, deep links and service wiring.
import { app, dialog, protocol, shell, webContents } from "electron";
import path from "node:path";
import { APP_NAME, IPC, type SttEvent } from "@pw/shared";
import { config } from "./config.ts";
import { log, errorMessage } from "./log.ts";
import { startProdServer, type ProdServer } from "./services/prodServer.ts";
import { OfflineCache } from "./services/cache.ts";
import { AuthStore } from "./services/authStore.ts";
import { SttBridge } from "./services/stt.ts";
import { CaptureService } from "./services/capture.ts";
import { NotificationsClient } from "./services/notifications.ts";
import { registerRecordingScheme, serveRecording } from "./services/recording.ts";
import { registerShortcuts, unregisterShortcuts } from "./services/shortcuts.ts";
import { startUpdateSchedule } from "./services/updater.ts";
import { loadOrCreateDeviceId } from "./services/device.ts";
import { showNative } from "./services/nativeNotify.ts";
import { registerIpc, type Services } from "./ipc/register.ts";
import { createMainWindow, mainWindow } from "./windows/mainWindow.ts";
import { closeAllOverlays } from "./windows/overlays.ts";
import { broadcast } from "./windows/registry.ts";
import { installMenu } from "./menu.ts";
import {
  handleSecondInstance,
  listenForOpenUrl,
  markReady,
  registerProtocolClient,
  setDeepLinkDeps,
} from "./services/deepLink.ts";
import { runSmoke, type SmokeContext } from "./smoke.ts";

// Per-channel userData keeps dev, staging and production apart (including the single-instance lock).
app.setName(APP_NAME);
app.setPath(
  "userData",
  path.join(app.getPath("appData"), config.channel === "production" ? APP_NAME : `${APP_NAME} (${config.channel})`),
);

// Must be registered before ready.
registerRecordingScheme(protocol);
listenForOpenUrl();

let services: Services | null = null;
let prodServer: ProdServer | null = null;
let prodServerError: string | null = null;
let quitting = false;

function emitStt(ownerId: number | null, event: SttEvent): void {
  if (ownerId === null) {
    // Only status changes are unowned; transcript text goes solely to the window that started the turn.
    if (event.type === "status") broadcast(IPC.stt.event, event);
    return;
  }
  const wc = webContents.fromId(ownerId);
  if (wc && !wc.isDestroyed()) wc.send(IPC.stt.event, event);
}

async function boot(): Promise<void> {
  installMenu();
  protocol.handle("local-video", serveRecording);

  const userData = app.getPath("userData");
  const cache = OfflineCache.open(userData);
  const auth = new AuthStore(path.join(userData, "auth-session.enc.json"));
  const deviceId = loadOrCreateDeviceId(userData);

  const notifications = new NotificationsClient({
    serverUrl: config.serverUrl,
    deviceId,
    onMessage: (msg) => broadcast(IPC.notifications.push, msg),
    onNotification: (item) => showNative({ title: item.title, body: item.body, route: item.link }),
  });

  const stt = new SttBridge(emitStt);
  const capture = new CaptureService({ speechPermission: async () => (await stt.status()).permission });
  const authDeps = () => ({
    serverUrl: config.serverUrl,
    store: auth,
    openExternal: (url: string) => shell.openExternal(url),
  });

  services = { cache, auth, authDeps, stt, capture };
  registerIpc(services);

  auth.onChange((session) => {
    notifications.setSession(session);
    broadcast(IPC.auth.sessionChanged, session);
  });
  notifications.setSession(auth.get());

  setDeepLinkDeps(authDeps());
  if (!config.smoke) registerProtocolClient();

  try {
    prodServer = await startProdServer({ distDir: config.rendererDist, port: config.prodServerPort });
    log.info(`renderer server on ${prodServer.url}`);
  } catch (err) {
    prodServerError = errorMessage(err);
    log.error(`renderer server failed: ${prodServerError}`);
    if (!config.smoke) {
      dialog.showErrorBox("Proofwork cannot start", prodServerError);
      app.quit();
      return;
    }
  }

  createMainWindow();
  markReady();

  if (!config.smoke) {
    registerShortcuts((name, phase) => broadcast(IPC.shortcuts.fired, { name, phase }));
    startUpdateSchedule(() => auth.get()?.token ?? null);
  }

  if (config.smoke) {
    const ctx: SmokeContext = {
      services,
      userData,
      prodServerUrl: prodServer?.url ?? null,
      prodServerError,
    };
    await runSmoke(ctx);
  }
}

if (!config.smoke && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => handleSecondInstance(argv));

  app.whenReady().then(boot).catch((err: unknown) => {
    log.error(`boot failed: ${errorMessage(err)}`);
    app.exit(1);
  });

  app.on("activate", () => {
    if (!mainWindow() && services) createMainWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("will-quit", () => {
    unregisterShortcuts();
    services?.stt.shutdown();
  });

  app.on("before-quit", () => {
    if (quitting) return;
    quitting = true;
    closeAllOverlays();
    void prodServer?.close();
  });
}
