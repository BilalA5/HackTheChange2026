import type { PwBridge } from "@pw/shared";
import { errorMessage } from "@/lib/errors";

/** The recording part of the desktop bridge. Electron writes to disk; the web fallback keeps chunks in memory. */
export type RecordingBridge = PwBridge["recording"];

export const CHUNK_MS = 1000;

export interface RecordingOutcome {
  url: string | null;
  error: string | null;
}

/**
 * MediaRecorder that streams 1 s chunks into pw.recording. Writes run one at a time, in order.
 * Call stop() to flush, wait for the last write and finish the file.
 */
export class ChunkedRecorder {
  private recorder: MediaRecorder | null = null;
  private fileId: string | null = null;
  private chain: Promise<void> = Promise.resolve();
  private failure: string | null = null;

  constructor(
    private readonly bridge: RecordingBridge,
    private readonly mimeType: string | null,
  ) {}

  async start(stream: MediaStream, name: string): Promise<void> {
    if (this.recorder) throw new Error("Recorder already started.");
    const { id } = await this.bridge.begin(name);
    this.fileId = id;
    const recorder = this.createRecorder(stream);
    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) this.enqueue(e.data);
    };
    recorder.onerror = () => {
      this.failure = this.failure ?? "The recorder stopped unexpectedly.";
    };
    this.recorder = recorder;
    recorder.start(CHUNK_MS);
  }

  private createRecorder(stream: MediaStream): MediaRecorder {
    if (this.mimeType) {
      try {
        return new MediaRecorder(stream, { mimeType: this.mimeType });
      } catch {
        // Unsupported option: let the browser choose.
      }
    }
    return new MediaRecorder(stream);
  }

  private enqueue(blob: Blob): void {
    const id = this.fileId;
    if (!id) return;
    this.chain = this.chain
      .then(async () => {
        if (this.failure) return;
        const buf = await blob.arrayBuffer();
        await this.bridge.write(id, buf);
      })
      .catch((e: unknown) => {
        this.failure = this.failure ?? errorMessage(e);
      });
  }

  get state(): RecordingState {
    return this.recorder?.state ?? "inactive";
  }

  pause(): void {
    if (this.recorder?.state === "recording") this.recorder.pause();
  }

  resume(): void {
    if (this.recorder?.state === "paused") this.recorder.resume();
  }

  /** Stops the recorder, flushes the write queue and finishes the file. Never throws. */
  async stop(): Promise<RecordingOutcome> {
    const recorder = this.recorder;
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.addEventListener("stop", () => resolve(), { once: true });
        recorder.stop();
      });
    }
    await this.chain;
    this.recorder = null;
    const id = this.fileId;
    this.fileId = null;
    if (!id) return { url: null, error: "Recording did not start." };
    if (this.failure) return { url: null, error: `The recording could not be saved: ${this.failure}` };
    try {
      const { url } = await this.bridge.finish(id);
      return { url, error: null };
    } catch (e) {
      return { url: null, error: `The recording could not be saved: ${errorMessage(e)}` };
    }
  }
}

export type RecordingState = "inactive" | "recording" | "paused";
