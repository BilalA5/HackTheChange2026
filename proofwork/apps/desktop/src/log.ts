// Main-process logger: writes to stderr (stdout is reserved for the smoke JSON) and keeps a redacted ring buffer.

const MAX_LINES = 500;
const lines: string[] = [];

const JWT = /eyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}/g;
const BEARER = /(bearer\s+)[A-Za-z0-9._~+/=-]+/gi;
const SECRET_PARAM = /((?:token|access_token|refresh_token|state|session_id)=)[^&\s"'<>]+/gi;

export function redact(text: string): string {
  return text.replace(JWT, "[jwt]").replace(BEARER, "$1[redacted]").replace(SECRET_PARAM, "$1[redacted]");
}

function write(level: "INFO" | "WARN" | "ERROR", message: string): void {
  const line = `${new Date().toISOString()} ${level} ${redact(message)}`;
  lines.push(line);
  if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES);
  process.stderr.write(`${line}\n`);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const log = {
  info: (message: string) => write("INFO", message),
  warn: (message: string) => write("WARN", message),
  error: (message: string) => write("ERROR", message),
};

export function logText(): string {
  return lines.join("\n");
}
