// Builds the Fastify application: plugins, the /api REST surface, sockets and file serving.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import { createAiEngine } from "./ai/index.ts";
import type { AiEngine } from "./contracts.ts";
import { registerCoworkSocket } from "./ai/cowork.ts";
import { buildContentIndex, loadDefaultContent, type ContentSource } from "./core/content.ts";
import { openDatabase } from "./core/db.ts";
import { HttpError, codeForStatus } from "./core/errors.ts";
import { Hub } from "./core/hub.ts";
import { registerApiRoutes } from "./core/routes/index.ts";
import { registerFileRoutes, registerUploadRoutes } from "./core/routes/files.ts";
import { jwtSecretFromEnv } from "./core/services/auth.ts";
import { MAX_UPLOAD_BYTES } from "./core/services/uploads.ts";
import { createServerContext } from "./core/server-context.ts";
import type { Core, Paths } from "./core/types.ts";
import { registerNotificationsSocket } from "./core/ws/notifications.ts";
import { errorMessage } from "./core/util.ts";

const DEFAULT_DATA_DIR = fileURLToPath(new URL("../data", import.meta.url));

export interface BuildOptions {
  /** SQLite file. Defaults to <dataDir>/proofwork.db (":memory:" is allowed). */
  dbPath?: string;
  ai?: AiEngine;
  content?: ContentSource;
  /** Root for uploads and screenshots. Defaults to apps/server/data, or the dbPath folder when only dbPath is given. */
  dataDir?: string;
  logger?: boolean;
}

export async function buildServer(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const dataDir = opts.dataDir ?? (opts.dbPath && opts.dbPath !== ":memory:" ? dirname(opts.dbPath) : DEFAULT_DATA_DIR);
  const dbPath = opts.dbPath ?? join(dataDir, "proofwork.db");
  const paths: Paths = {
    dataDir,
    uploadsDir: join(dataDir, "uploads"),
    screenshotsDir: join(dataDir, "bug-screenshots"),
  };
  mkdirSync(paths.uploadsDir, { recursive: true });
  mkdirSync(paths.screenshotsDir, { recursive: true });

  // Path generation can take 30-90 s with a live model, so the server allows up to 180 s per request.
  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 12 * 1024 * 1024, connectionTimeout: 200_000, requestTimeout: 200_000 });
  const content = buildContentIndex(opts.content ?? (await loadDefaultContent()));
  const ai = opts.ai ?? createAiEngine();
  const db = openDatabase(dbPath);
  const core: Core = {
    db,
    content,
    ai,
    paths,
    jwtSecret: jwtSecretFromEnv(),
    hub: new Hub(),
    log: (msg, extra) => app.log.info(extra ?? {}, msg),
  };

  app.addHook("onClose", async () => {
    db.close();
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HttpError) {
      return reply.code(err.status).send({ error: err.code, message: err.message });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (typeof status === "number" && status >= 400 && status < 500) {
      return reply.code(status).send({ error: codeForStatus(status), message: errorMessage(err) });
    }
    app.log.error({ reason: errorMessage(err) }, "unhandled request error");
    return reply.code(500).send({ error: "internal", message: "Something went wrong on the server." });
  });
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: "not_found", message: "No such route." }));

  // Lenient JSON: an empty body with a JSON content type is treated as "no body" instead of a 400.
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, raw, done) => {
    const text = typeof raw === "string" ? raw.trim() : raw.toString("utf8").trim();
    if (!text) return done(null, undefined);
    try {
      done(null, JSON.parse(text));
    } catch {
      const err = new Error("Request body is not valid JSON.") as Error & { statusCode?: number };
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  await app.register(cors, { origin: true, methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] });
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });
  await app.register(websocket);
  app.decorateRequest("userId", "");

  await app.register(
    async (api) => {
      registerApiRoutes(api, core);
      registerUploadRoutes(api, core);
    },
    { prefix: "/api" },
  );
  registerFileRoutes(app, core);
  registerNotificationsSocket(app, core);
  registerCoworkSocket(app, createServerContext(core));

  return app;
}
