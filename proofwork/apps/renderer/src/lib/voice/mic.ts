/*
 * Microphone capture. Produces 16 kHz mono Float32 PCM chunks (about 100 ms each) and an RMS level (0..1).
 * Uses an AudioWorklet built from an inline Blob. Falls back to ScriptProcessorNode when worklets are unavailable.
 * Downsampling is nearest-sample decimation. That is adequate for speech recognition input.
 */

export const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 1600;

export interface MicHandle {
  readonly sampleRate: number;
  stop(): void;
}

export interface StartMicOptions {
  deviceId?: string;
  onPcm(chunk: Float32Array): void;
  onLevel?(level: number): void;
}

/** Returns a stateful function that converts blocks captured at inputRate into outputRate. */
export function createDownsampler(inputRate: number, outputRate = TARGET_SAMPLE_RATE): (input: Float32Array) => Float32Array {
  const ratio = inputRate / outputRate;
  let pos = 0;
  return (input: Float32Array) => {
    const out: number[] = [];
    while (pos < input.length) {
      out.push(input[Math.floor(pos)] ?? 0);
      pos += ratio;
    }
    pos -= input.length;
    return Float32Array.from(out);
  };
}

export function rms(x: Float32Array): number {
  if (x.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
  return Math.sqrt(sum / x.length);
}

const WORKLET_SOURCE = `
class PwPcm extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${TARGET_SAMPLE_RATE};
    this.pos = 0;
    this.pending = [];
    this.pendingLen = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch || ch.length === 0) return true;
    let sum = 0;
    for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
    this.port.postMessage({ level: Math.sqrt(sum / ch.length) });
    const out = [];
    while (this.pos < ch.length) {
      out.push(ch[Math.floor(this.pos)]);
      this.pos += this.ratio;
    }
    this.pos -= ch.length;
    if (out.length) {
      this.pending.push(Float32Array.from(out));
      this.pendingLen += out.length;
    }
    if (this.pendingLen >= ${CHUNK_SAMPLES}) {
      const buf = new Float32Array(this.pendingLen);
      let o = 0;
      for (const p of this.pending) { buf.set(p, o); o += p.length; }
      this.pending = [];
      this.pendingLen = 0;
      this.port.postMessage({ pcm: buf }, [buf.buffer]);
    }
    return true;
  }
}
registerProcessor("pw-pcm", PwPcm);
`;

export async function startMic(opts: StartMicOptions): Promise<MicHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: opts.deviceId ? { ideal: opts.deviceId } : undefined,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  const Ctx: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  if (ctx.state === "suspended") await ctx.resume();

  const source = ctx.createMediaStreamSource(stream);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  mute.connect(ctx.destination);

  let level = 0;
  const pushLevel = (r: number) => {
    level = level * 0.6 + Math.min(1, r * 4) * 0.4;
    opts.onLevel?.(level);
  };

  let disconnectCapture: () => void = () => {};
  let workletOk = false;

  if (ctx.audioWorklet) {
    try {
      const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
      try {
        await ctx.audioWorklet.addModule(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      const node = new AudioWorkletNode(ctx, "pw-pcm");
      node.port.onmessage = (e: MessageEvent<{ level?: number; pcm?: Float32Array }>) => {
        if (typeof e.data.level === "number") pushLevel(e.data.level);
        if (e.data.pcm) opts.onPcm(e.data.pcm);
      };
      source.connect(node);
      node.connect(mute);
      disconnectCapture = () => node.disconnect();
      workletOk = true;
    } catch {
      workletOk = false;
    }
  }

  if (!workletOk) {
    const downsample = createDownsampler(ctx.sampleRate);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    proc.onaudioprocess = (ev: AudioProcessingEvent) => {
      const input = ev.inputBuffer.getChannelData(0);
      pushLevel(rms(input));
      opts.onPcm(downsample(input));
    };
    source.connect(proc);
    proc.connect(mute);
    disconnectCapture = () => proc.disconnect();
  }

  let stopped = false;
  return {
    sampleRate: ctx.sampleRate,
    stop() {
      if (stopped) return;
      stopped = true;
      disconnectCapture();
      source.disconnect();
      mute.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      opts.onLevel?.(0);
    },
  };
}
