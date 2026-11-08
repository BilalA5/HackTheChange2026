// User file uploads (served from data/uploads) and text extraction for grading.
import { closeSync, existsSync, openSync, readSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import type { UploadResult } from "@pw/shared";
import { one, run, type Db } from "../db.ts";
import { badRequest } from "../errors.ts";
import type { Core } from "../types.ts";
import { nowIso, uid } from "../util.ts";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_BYTES = 200 * 1024;
const TEXT_EXTENSIONS = [".md", ".txt", ".py", ".js", ".ts", ".tsx", ".json", ".csv", ".sql", ".ipynb"];
const STORED_NAME = /^[A-Za-z0-9._-]+$/;

function safeName(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "").slice(0, 120);
  return cleaned || "file";
}

export function saveUpload(core: Core, userId: string, origin: string, file: { buffer: Buffer; fileName: string; mime: string }): UploadResult {
  if (file.buffer.length === 0) throw badRequest("The uploaded file is empty.");
  if (file.buffer.length > MAX_UPLOAD_BYTES) throw badRequest("File is larger than 25 MB.");
  const id = uid();
  const storedName = `${id}-${safeName(file.fileName)}`;
  const mime = file.mime || "application/octet-stream";
  writeFileSync(join(core.paths.uploadsDir, storedName), file.buffer);
  run(core.db, "INSERT INTO uploads (id, user_id, stored_name, file_name, size, mime, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    id,
    userId,
    storedName,
    file.fileName,
    file.buffer.length,
    mime,
    nowIso(),
  ]);
  return { id, url: `${origin}/files/${storedName}`, fileName: file.fileName, size: file.buffer.length, mime };
}

/** Upload metadata for a publicly served stored name, or null. */
export function findUploadByStoredName(db: Db, storedName: string): { mime: string; file_name: string } | null {
  if (!STORED_NAME.test(storedName) || storedName.startsWith(".")) return null;
  return one<{ mime: string; file_name: string }>(db, "SELECT mime, file_name FROM uploads WHERE stored_name = ?", [storedName]) ?? null;
}

export function uploadPath(core: Core, storedName: string): string | null {
  if (!STORED_NAME.test(storedName)) return null;
  const path = join(core.paths.uploadsDir, storedName);
  return existsSync(path) ? path : null;
}

/** Reads the first 200 KB of one of the learner's own text uploads referenced by a submission URL. */
export function readUploadText(core: Core, userId: string, value: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(value, "http://local.invalid").pathname;
  } catch {
    return null;
  }
  const match = /^\/files\/([A-Za-z0-9._-]+)$/.exec(pathname);
  const storedName = match?.[1];
  if (!storedName || !TEXT_EXTENSIONS.includes(extname(storedName).toLowerCase())) return null;
  const owned = one<{ id: string }>(core.db, "SELECT id FROM uploads WHERE stored_name = ? AND user_id = ?", [storedName, userId]);
  if (!owned) return null;
  const path = uploadPath(core, storedName);
  if (!path || statSync(path).size === 0) return null;
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(MAX_TEXT_BYTES);
    const read = readSync(fd, buffer, 0, MAX_TEXT_BYTES, 0);
    return buffer.subarray(0, read).toString("utf8");
  } finally {
    closeSync(fd);
  }
}
