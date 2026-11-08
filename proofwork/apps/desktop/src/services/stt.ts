// On-device speech via the STTStreamHelper daemon. Protocol (BUILD-GUIDE 9.3):
//   stdin  : "warmup" | "vocab a|b|c" | "start <turnId>" | "stop"
//   fd 3   : 16 kHz mono Float32 PCM (little-endian)
//   stdout : "PARTIAL|FINAL <turn> <seq>: text" | "ERROR <turn|-> <code>: message" | "STATUS: Ready|Started|Stopped ..."
import { execFile, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import type { Writable } from "node:stream";
import type { PermissionStatus, SttEvent } from "@pw/shared";

export interface SttStatus {
  available: boolean;
  reason?: string;
  permission: PermissionStatus;
}
import { config } from "../config.ts";
import { log, errorMessage } from "../log.ts";

const PARTIAL_LINE = /^(PARTIAL|FINAL) (\S+) \d+: ?(.*)$/;
const ERROR_LINE = /^ERROR (\S+) ([^:]+): ?(.*)$/;
const STATUS_LINE = /^STATUS: (Ready|Started|Stopped|Unavailable)\b/i;
const AUTH_LINE = /AUTH:\s*(\w+)/;
const MAX_PENDING_PCM_BYTES = 4_000_000;

export const TURN_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function mapAuth(raw: string | undefined): PermissionStatus {
  switch (raw) {
    case "authorized":
      return "granted";
    case "denied":
      return "denied";
    case "restricted":
      return "restricted";
    case "notDetermined":
      return "not-determined";
    default:
      return "unknown";
  }
}

export type SttEmit = (ownerId: number | null, event: SttEvent) => void;

export class SttBridge {
  private child: ChildProcess | null = null;
  private restartsLeft = 1;
  private disabled = false;
  private stopping = false;
  private owner: number | null = null;
  private stdoutBuffer = "";

  constructor(private readonly emit: SttEmit) {}

  private helperExists(): boolean {
    return process.platform === "darwin" && fs.existsSync(config.sttHelperPath);
  }

  /** Permission from `<helper> check`, which prints "AUTH: authorized|denied|restricted|notDetermined". */
  checkPermission(): Promise<PermissionStatus> {
    if (!this.helperExists()) return Promise.resolve("unknown");
    return new Promise((resolve) => {
      execFile(config.sttHelperPath, ["check"], { timeout: 5_000 }, (err, stdout) => {
        if (err && !stdout) return resolve("unknown");
        const match = AUTH_LINE.exec(String(stdout));
        resolve(mapAuth(match?.[1]));
      });
    });
  }

  async status(): Promise<SttStatus> {
    if (process.platform !== "darwin") {
      return { available: false, reason: "on-device speech is macOS only", permission: "unknown" };
    }
    if (!fs.existsSync(config.sttHelperPath)) {
      this.emit(null, { type: "status", status: "unavailable" });
      return { available: false, reason: "speech helper is not built (npm run stt:build)", permission: "unknown" };
    }
    return { available: true, permission: await this.checkPermission() };
  }

  start(ownerId: number, turnId: string, vocabulary: string[] = []): void {
    if (!TURN_ID.test(turnId)) throw new Error("invalid turn id");
    if (!this.ensureRunning()) {
      this.emit(null, { type: "status", status: "unavailable" });
      throw new Error("speech helper unavailable");
    }
    this.owner = ownerId;
    if (vocabulary.length > 0) {
      const words = vocabulary
        .map((w) => w.replace(/[\r\n|]/g, " ").trim())
        .filter((w) => w.length > 0)
        .slice(0, 200);
      if (words.length > 0) this.write(`vocab ${words.join("|")}`);
    }
    this.write(`start ${turnId}`);
  }

  pushAudio(chunk: Float32Array): void {
    const fd3 = this.child?.stdio[3] as Writable | undefined;
    if (!fd3 || fd3.destroyed || !fd3.writable) return;
    if (fd3.writableLength > MAX_PENDING_PCM_BYTES) return; // helper is behind; drop rather than grow without bound
    fd3.write(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
  }

  stop(): void {
    this.write("stop");
  }

  shutdown(): void {
    this.stopping = true;
    this.child?.kill();
    this.child = null;
  }

  private write(line: string): void {
    const stdin = this.child?.stdin;
    if (stdin && stdin.writable) stdin.write(`${line}\n`);
  }

  private ensureRunning(): boolean {
    if (this.disabled) return false;
    if (this.child && this.child.exitCode === null && this.child.signalCode === null) return true;
    if (!this.helperExists()) return false;

    const child = spawn(config.sttHelperPath, [], {
      stdio: ["pipe", "pipe", "pipe", "pipe"],
      env: process.env,
    });
    this.child = child;
    this.stopping = false;
    this.stdoutBuffer = "";

    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => this.onStdout(chunk));
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      // Helper stderr may echo speech; log only its size.
      log.info(`stt helper stderr (${chunk.length} chars)`);
    });
    child.on("error", (err) => log.error(`stt helper error: ${errorMessage(err)}`));
    child.on("exit", (code, signal) => this.onExit(child, code, signal));

    this.write("warmup");
    log.info("stt helper started");
    return true;
  }

  private onExit(child: ChildProcess, code: number | null, signal: NodeJS.Signals | null): void {
    if (this.child !== child) return;
    this.child = null;
    if (this.stopping) return;

    const turnOwner = this.owner;
    this.owner = null;
    log.warn(`stt helper exited (code ${code ?? "null"}, signal ${signal ?? "none"})`);
    if (turnOwner !== null) {
      this.emit(turnOwner, { type: "error", turnId: null, code: "helper_exited", message: "speech helper stopped" });
    }
    if (this.restartsLeft > 0) {
      this.restartsLeft -= 1;
      this.ensureRunning();
    } else {
      this.disabled = true;
      this.emit(null, { type: "status", status: "unavailable" });
    }
  }

  private onStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    let idx: number;
    while ((idx = this.stdoutBuffer.indexOf("\n")) >= 0) {
      const line = this.stdoutBuffer.slice(0, idx).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(idx + 1);
      if (line) this.handleLine(line);
    }
    if (this.stdoutBuffer.length > 64_000) this.stdoutBuffer = ""; // protocol violation guard
  }

  private handleLine(line: string): void {
    const partial = PARTIAL_LINE.exec(line);
    if (partial) {
      const [, kind, turnId, text] = partial;
      const event: SttEvent = kind === "FINAL" ? { type: "final", turnId, text } : { type: "partial", turnId, text };
      this.emit(this.owner, event);
      return;
    }
    const error = ERROR_LINE.exec(line);
    if (error) {
      const [, turn, code, message] = error;
      this.emit(this.owner, { type: "error", turnId: turn === "-" ? null : turn, code, message });
      return;
    }
    const status = STATUS_LINE.exec(line);
    if (status) {
      const word = status[1].toLowerCase();
      const mapped: "ready" | "started" | "stopped" | "unavailable" =
        word === "ready" ? "ready" : word === "started" ? "started" : word === "stopped" ? "stopped" : "unavailable";
      if (mapped === "stopped") this.owner = null;
      this.emit(null, { type: "status", status: mapped });
    }
  }
}
