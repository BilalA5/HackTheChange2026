// Entry point: loads ../../.env, then listens on 127.0.0.1:${PW_PORT || 8787}.
import { fileURLToPath } from "node:url";
import { buildServer } from "./app.ts";
import { createAiEngine } from "./ai/index.ts";
import { loadDotEnv } from "./core/env.ts";

loadDotEnv(fileURLToPath(new URL("../../../.env", import.meta.url)));

const port = Number(process.env.PW_PORT || 8787);
const ai = createAiEngine();
const dataDir = process.env.PW_DATA_DIR ?? fileURLToPath(new URL("../data", import.meta.url));
const app = await buildServer({ ai, dataDir, logger: true });
await app.listen({ port, host: "127.0.0.1" });
const address = app.server.address();
const actualPort = typeof address === "object" && address ? address.port : port;
console.log(`Proofwork server: http://127.0.0.1:${actualPort} (ai mode: ${ai.mode})`);
