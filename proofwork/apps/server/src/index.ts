// Entry point: loads ../../.env, then listens on 127.0.0.1:${PW_PORT || 8787}.
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildServer } from "./app.ts";
import { createAiEngine } from "./ai/index.ts";
import { createTtsService, enginesFromEnv } from "./ai/tts/index.ts";
import { loadDotEnv } from "./core/env.ts";

loadDotEnv(fileURLToPath(new URL("../../../.env", import.meta.url)));

const port = Number(process.env.PW_PORT || 8787);
const ai = createAiEngine();
const dataDir = process.env.PW_DATA_DIR ?? fileURLToPath(new URL("../data", import.meta.url));
const log = (msg: string) => console.log(msg);
const tts = createTtsService({ engines: enginesFromEnv(dataDir, process.env, log), cacheDir: join(dataDir, "tts-cache"), log });
const app = await buildServer({ ai, tts, dataDir, logger: true });
await app.listen({ port, host: "127.0.0.1" });
const address = app.server.address();
const actualPort = typeof address === "object" && address ? address.port : port;
console.log(`Proofwork server: http://127.0.0.1:${actualPort} (ai mode: ${ai.mode}, voices: ${tts.engines().join(" > ") || "system only"})`);
// Load the local voice model now (a one-time ~330 MB download on first run) so the first line plays promptly.
tts.warm();

// Shut down in order: stop taking requests and close the database, release the voice model, then exit.
// onnxruntime-node (the local voice model) aborts inside its own exit-time cleanup on macOS ("libc++abi ... mutex lock
// failed") even after its sessions are released, so once the model has been loaded the process ends with SIGKILL,
// which skips that cleanup. Everything that matters (requests, the SQLite database) is closed before that point.
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    if (stopping) return;
    stopping = true;
    const force = setTimeout(() => process.exit(0), 3000);
    force.unref();
    void app
      .close()
      .catch(() => undefined)
      .then(() => tts.close())
      .then((nativeLoaded) => (nativeLoaded ? process.kill(process.pid, "SIGKILL") : process.exit(0)))
      .catch(() => process.exit(0));
  });
}
