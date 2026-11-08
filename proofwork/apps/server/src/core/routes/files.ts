import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { badRequest, notFound } from "../errors.ts";
import { findUploadByStoredName, saveUpload, MAX_UPLOAD_BYTES } from "../services/uploads.ts";
import type { Core } from "../types.ts";
import { originOf, param } from "./helpers.ts";

const UNSAFE_TYPES = /html|svg|xml|javascript/i;

/** POST /api/uploads (authenticated). */
export function registerUploadRoutes(api: FastifyInstance, core: Core): void {
  api.post("/uploads", async (req) => {
    const part = await req.file();
    if (!part || part.fieldname !== "file") throw badRequest("Attach a file in the 'file' field.");
    let buffer: Buffer;
    try {
      buffer = await part.toBuffer();
    } catch (err) {
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") throw badRequest("File is larger than 25 MB.");
      throw err;
    }
    if (buffer.length > MAX_UPLOAD_BYTES) throw badRequest("File is larger than 25 MB.");
    return saveUpload(core, req.userId, originOf(req), { buffer, fileName: part.filename, mime: part.mimetype });
  });
}

/** GET /files/:name (public, unguessable stored names). Active content types are served as downloads. */
export function registerFileRoutes(app: FastifyInstance, core: Core): void {
  app.get("/files/:name", async (req, reply) => {
    const name = param(req, "name");
    const meta = findUploadByStoredName(core.db, name);
    const path = join(core.paths.uploadsDir, name);
    if (!meta || !existsSync(path)) throw notFound("File not found.");
    const unsafe = UNSAFE_TYPES.test(meta.mime);
    reply.header("Content-Type", unsafe ? "application/octet-stream" : meta.mime);
    reply.header("Content-Disposition", `${unsafe ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(meta.file_name)}`);
    reply.header("X-Content-Type-Options", "nosniff");
    return reply.send(createReadStream(path));
  });
}
