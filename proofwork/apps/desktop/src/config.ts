import { app } from "electron";
import { DEFAULT_SERVER_URL, RENDERER_PORTS, type ReleaseChannel } from "@pw/shared";

const CHANNELS = Object.keys(RENDERER_PORTS) as ReleaseChannel[];

function resolveChannel(): ReleaseChannel {
  const fromEnv = process.env.PW_CHANNEL;
  if (fromEnv !== undefined && fromEnv !== "") {
    if (!(CHANNELS as string[]).includes(fromEnv)) throw new Error(`PW_CHANNEL must be one of ${CHANNELS.join(", ")}`);
    return fromEnv as ReleaseChannel;
  }
  return app.isPackaged ? "production" : "dev";
}

const channel = resolveChannel();
/** The packaged renderer port. Dev uses the production slot because Vite (5173) is only used through PW_RENDERER_URL. */
const prodServerPort = RENDERER_PORTS[channel === "dev" ? "production" : channel];

export const config = {
  channel,
  isPackaged: app.isPackaged,
  smoke: process.argv.includes("--smoke") || process.env.PW_SMOKE === "1",
  serverUrl: process.env.PW_SERVER_URL ?? DEFAULT_SERVER_URL,
  prodServerPort,
  rendererUrl: process.env.PW_RENDERER_URL ?? `http://127.0.0.1:${prodServerPort}`,
  rendererDist: app.isPackaged
    ? `${process.resourcesPath}/renderer`
    : `${__dirname}/../../renderer/dist`,
  preloadPath: `${__dirname}/preload.cjs`,
  shellHtmlPath: `${__dirname}/shell/shell.html`,
  sttHelperPath: app.isPackaged
    ? `${process.resourcesPath}/stt-stream-helper/STTStreamHelper.app/Contents/MacOS/STTStreamHelper`
    : `${__dirname}/../../../native/stt-helper/build/STTStreamHelper.app/Contents/MacOS/STTStreamHelper`,
} as const;

export const rendererOrigin = new URL(config.rendererUrl).origin;
