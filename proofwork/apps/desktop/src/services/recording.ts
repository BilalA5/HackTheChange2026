// Presentation recordings: streamed to userData/recordings/<id>.webm and served through local-video:// with Range support.
import { app, type Protocol } from "electron";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { log, errorMessage } from "../log.ts";

const ID = /^[a-f0-9-]{36}$/;
const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_ACTIVE = 4;

interface Active {
  stream: fs.WriteStream;
  file: string;
  bytes: number;
}
const active = new Map<string, Active>();

export function recordingsDir(): string {
  return path.join(app.getPath("userData"), "recordings");
}

function recordingFile(id: string): string {
  if (!ID.test(id)) throw new Error("invalid recording id");
  return path.join(recordingsDir(), `${id}.webm`);
}

export function beginRecording(name: string): { id: string } {
  if (typeof name !== "string" || name.length > 120) throw new Error("invalid recording name");
  if (active.size >= MAX_ACTIVE) throw new Error("too many recordings in progress");
  const id = randomUUID();
  fs.mkdirSync(recordingsDir(), { recursive: true });
  const file = recordingFile(id);
  const stream = fs.createWriteStream(file, { flags: "wx" });
  stream.on("error", (err) => log.error(`recording ${id} write error: ${errorMessage(err)}`));
  active.set(id, { stream, file, bytes: 0 });
  return { id };
}

export function writeRecording(id: string, chunk: ArrayBuffer): Promise<void> {
  const rec = active.get(id);
  if (!rec) return Promise.reject(new Error("unknown recording"));
  const buf = Buffer.from(chunk);
  if (rec.bytes + buf.length > MAX_BYTES) return Promise.reject(new Error("recording too large"));
  rec.bytes += buf.length;
  return new Promise((resolve, reject) => {
    rec.stream.write(buf, (err) => (err ? reject(err) : resolve()));
  });
}

export function finishRecording(id: string): Promise<{ url: string; path: string; bytes: number }> {
  const rec = active.get(id);
  if (!rec) return Promise.reject(new Error("unknown recording"));
  active.delete(id);
  return new Promise((resolve, reject) => {
    rec.stream.end((err?: Error | null) => {
      if (err) reject(err);
      else resolve({ url: `local-video://${id}`, path: rec.file, bytes: rec.bytes });
    });
  });
}

/** Must run before app ready. */
export function registerRecordingScheme(protocol: Protocol): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: "local-video", privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true } },
  ]);
}

export function serveRecording(request: Request): Response {
  const id = new URL(request.url).hostname;
  let file: string;
  let size: number;
  try {
    file = recordingFile(id);
    size = fs.statSync(file).size;
  } catch {
    return new Response("not found", { status: 404 });
  }

  let start = 0;
  let end = size - 1;
  let status = 200;
  const range = request.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === "" && m[2] === "")) return rangeNotSatisfiable(size);
    if (m[1] === "") {
      start = Math.max(0, size - Number(m[2]));
    } else {
      start = Number(m[1]);
      end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    }
    if (start > end || start >= size) return rangeNotSatisfiable(size);
    status = 206;
  }

  const headers: Record<string, string> = {
    "Content-Type": "video/webm",
    "Accept-Ranges": "bytes",
    "Content-Length": String(end - start + 1),
  };
  if (status === 206) headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  if (request.method === "HEAD") return new Response(null, { status, headers });

  const stream = fs.createReadStream(file, { start, end });
  return new Response(Readable.toWeb(stream) as unknown as BodyInit, { status, headers });
}

function rangeNotSatisfiable(size: number): Response {
  return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
}
