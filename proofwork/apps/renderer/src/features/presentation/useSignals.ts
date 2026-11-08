import { useEffect, useRef, useState } from "react";
import { rms } from "@/lib/voice/mic";
import {
  SAMPLE_HEIGHT,
  SAMPLE_INTERVAL_MS,
  SAMPLE_WIDTH,
  analyzeFrame,
  centreRatio,
  classifyFrame,
} from "./framing";
import type { FramingReason } from "./types";

export interface FramingVerdict {
  /** Null until the first usable sample arrives. */
  reason: FramingReason | null;
  /** Centre-weight ratio of the last sample (null before the first sample). */
  ratio: number | null;
}

/**
 * Lighting and framing check. Samples the stream every 500 ms into a 64x36 canvas.
 * `onSample` receives every classified sample (used for the framing score during recording).
 */
export function useFramingCheck(stream: MediaStream | null, onSample?: (reason: FramingReason) => void): FramingVerdict {
  const [verdict, setVerdict] = useState<FramingVerdict>({ reason: null, ratio: null });
  const onSampleRef = useRef(onSample);
  useEffect(() => {
    onSampleRef.current = onSample;
  });

  useEffect(() => {
    if (!stream) {
      setVerdict({ reason: null, ratio: null });
      return;
    }
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    void video.play().catch(() => undefined);

    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_WIDTH;
    canvas.height = SAMPLE_HEIGHT;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const id = setInterval(() => {
      if (!ctx || video.readyState < 2 || video.videoWidth === 0) return;
      ctx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      const { data } = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      const stats = analyzeFrame(data, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      const reason = classifyFrame(stats);
      setVerdict({ reason, ratio: centreRatio(stats) });
      onSampleRef.current?.(reason);
    }, SAMPLE_INTERVAL_MS);

    return () => {
      clearInterval(id);
      video.pause();
      video.srcObject = null;
    };
  }, [stream]);

  return verdict;
}

/** Smoothed microphone level 0..1 from an AnalyserNode on the stream's audio track. */
export function useMicLevel(stream: MediaStream | null): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setLevel(0);
      return;
    }
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    void ctx.resume().catch(() => undefined);
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    let smoothed = 0;
    const id = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      smoothed = smoothed * 0.6 + Math.min(1, rms(buf) * 4) * 0.4;
      setLevel(smoothed);
    }, 100);

    return () => {
      clearInterval(id);
      source.disconnect();
      void ctx.close();
    };
  }, [stream]);

  return level;
}
