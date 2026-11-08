import { useCallback, useEffect, useRef, useState } from "react";
import type { PermissionKind, PermissionStatus } from "@pw/shared";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Fields";
import { Pill, type Tone } from "@/components/ui/Labels";
import { ProgressBar } from "@/components/ui/Progress";
import { pw } from "@/lib/bridge";
import { errorMessage } from "@/lib/errors";
import { rms } from "@/lib/voice/mic";
import { toast } from "@/components/ui/Toaster";
import { SettingsGroup, SettingsSection } from "../ui";
import { useSettingsSaver } from "./saver";

const KINDS: { kind: PermissionKind; label: string; hint: string }[] = [
  { kind: "screen", label: "Screen recording", hint: "Lets the co-worker see the app you are working in." },
  { kind: "microphone", label: "Microphone", hint: "Speech input and push to talk." },
  { kind: "camera", label: "Camera", hint: "Framing feedback for presentations." },
  { kind: "speech", label: "Speech recognition", hint: "On-device transcription on macOS." },
];

const STATUS_TONE: Record<PermissionStatus, Tone> = {
  granted: "success",
  denied: "danger",
  restricted: "danger",
  "not-determined": "warning",
  unknown: "neutral",
};

const STATUS_LABEL: Record<PermissionStatus, string> = {
  granted: "Granted",
  denied: "Denied",
  restricted: "Restricted",
  "not-determined": "Not asked",
  unknown: "Unknown",
};

type Statuses = Partial<Record<PermissionKind, PermissionStatus>>;

export function PermissionsTab() {
  const { settings, save } = useSettingsSaver();
  const [statuses, setStatuses] = useState<Statuses>({});
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [busyKind, setBusyKind] = useState<PermissionKind | null>(null);

  const readAll = useCallback(async () => {
    const next: Statuses = {};
    for (const { kind } of KINDS) {
      next[kind] = await pw.capture.permission(kind).catch((): PermissionStatus => "unknown");
    }
    setStatuses(next);
  }, []);

  const readDevices = useCallback(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then(setDevices)
      .catch(() => setDevices([]));
  }, []);

  useEffect(() => {
    void readAll();
    readDevices();
  }, [readAll, readDevices]);

  const request = async (kind: PermissionKind) => {
    setBusyKind(kind);
    try {
      const status = await pw.capture.requestPermission(kind);
      setStatuses((s) => ({ ...s, [kind]: status }));
      readDevices();
    } catch (e) {
      toast({ title: "Permission request failed", body: errorMessage(e), tone: "danger" });
    } finally {
      setBusyKind(null);
    }
  };

  const openSettings = (kind: PermissionKind) => {
    pw.capture.openPermissionSettings(kind).catch((e: unknown) =>
      toast({ title: "Could not open System Settings", body: errorMessage(e), tone: "danger" }),
    );
  };

  if (!settings) return null;

  const inputs = devices.filter((d) => d.kind === "audioinput");
  const cameras = devices.filter((d) => d.kind === "videoinput");
  const speakers = devices.filter((d) => d.kind === "audiooutput");

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="System permissions" description="Proofwork asks for these only when a feature needs them.">
        {!pw.isElectron && (
          <p className="rounded-card border border-line bg-white/4 p-4 text-[13px] text-fg-muted">
            In the browser, Proofwork cannot read or request system permissions. The statuses below show as unknown. Use the desktop app
            to grant screen, microphone and camera access.
          </p>
        )}
        <SettingsGroup>
          {KINDS.map(({ kind, label, hint }) => {
            const status = statuses[kind] ?? "unknown";
            return (
              <div key={kind} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[14px] text-fg">{label}</div>
                  <div className="text-[12px] text-fg-muted">{hint}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>
                  <Button size="sm" variant="glass" loading={busyKind === kind} disabled={!pw.isElectron} onClick={() => void request(kind)}>
                    Request
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!pw.isElectron} onClick={() => openSettings(kind)}>
                    Open System Settings
                  </Button>
                </div>
              </div>
            );
          })}
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Devices" description="Used for new sessions. System default follows your Mac.">
        <SettingsGroup>
          <DevicePicker
            label="Microphone"
            value={settings.devices.micId ?? ""}
            devices={inputs}
            onChange={(micId) => void save({ devices: { micId } })}
          />
          <DevicePicker
            label="Camera"
            value={settings.devices.cameraId ?? ""}
            devices={cameras}
            onChange={(cameraId) => void save({ devices: { cameraId } })}
          />
          <DevicePicker
            label="Speaker"
            value={settings.devices.speakerId ?? ""}
            devices={speakers}
            onChange={(speakerId) => void save({ devices: { speakerId } })}
          />
          {devices.length > 0 && devices.every((d) => !d.label) && (
            <p className="text-[12px] text-fg-muted">Device names appear after you grant microphone or camera access.</p>
          )}
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Microphone test" description="Speak and watch the level move. Nothing is recorded.">
        <SettingsGroup>
          <MicTest micId={settings.devices.micId} />
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}

function DevicePicker({
  label,
  value,
  devices,
  onChange,
}: {
  label: string;
  value: string;
  devices: MediaDeviceInfo[];
  onChange(deviceId: string): void;
}) {
  const options = [
    { value: "", label: "System default" },
    ...devices.map((d, i) => ({ value: d.deviceId, label: d.label || `${label} ${i + 1}` })),
  ];
  // A saved device that is no longer connected still shows as an option, so the select does not lie.
  if (value && !devices.some((d) => d.deviceId === value)) options.push({ value, label: `${label} (not connected)` });
  return <Select label={label} value={value} options={options} onValueChange={onChange} disabled={devices.length === 0 && !value} />;
}

/** Live input level from an AnalyserNode. Tracks and the audio context are released on stop and on unmount. */
function MicTest({ micId }: { micId: string | undefined }) {
  const [running, setRunning] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number>(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    setRunning(false);
    setLevel(0);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not available in this window.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        setLevel(Math.min(1, rms(buf) * 4));
        frameRef.current = requestAnimationFrame(tick);
      };
      setRunning(true);
      tick();
    } catch (e) {
      stop();
      setError(errorMessage(e));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <ProgressBar value={level} label="Microphone level" />
      <div className="flex items-center gap-3">
        {running ? (
          <Button size="sm" variant="glass" onClick={stop}>
            Stop test
          </Button>
        ) : (
          <Button size="sm" variant="glass" onClick={() => void start()}>
            Start microphone test
          </Button>
        )}
        {error && (
          <span role="alert" className="text-[13px] text-danger">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
