import { useCallback } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Slider, Switch } from "@/components/ui/Fields";
import { toast } from "@/components/ui/Toaster";
import { errorMessage } from "@/lib/errors";
import { SettingsGroup, SettingsSection, useDraftValue } from "../ui";
import { useSettingsSaver } from "./saver";

/** Short two-note chime through WebAudio. Volume is 0..1. */
export function playChime(volume: number): void {
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    toast({ title: "Sound unavailable", body: "This window cannot play audio.", tone: "warning" });
    return;
  }
  try {
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const peak = Math.max(0.0002, Math.min(1, volume) * 0.3);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    [880, 1320].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(now + i * 0.12);
      osc.stop(now + 0.6 + i * 0.12);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch (e) {
    toast({ title: "Sound failed", body: errorMessage(e), tone: "danger" });
  }
}

export function SoundsTab() {
  const { settings, save } = useSettingsSaver();
  const commitVolume = useCallback((pct: number) => void save({ sounds: { volume: pct / 100 } }), [save]);
  const [shownPct, onVolumeDraft] = useDraftValue(Math.round((settings?.sounds.volume ?? 0) * 100), commitVolume);
  if (!settings) return null;

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Sound effects" description="Chimes for XP, notifications and milestones.">
        <SettingsGroup>
          <Switch
            checked={settings.sounds.enabled}
            onCheckedChange={(on) => void save({ sounds: { enabled: on } })}
            label="Play sound effects"
          />
          <Slider
            label="Volume"
            value={shownPct}
            min={0}
            max={100}
            step={1}
            unit="%"
            disabled={!settings.sounds.enabled}
            onValueChange={onVolumeDraft}
          />
          <div>
            <Button variant="glass" size="sm" icon={<Volume2 size={15} strokeWidth={1.75} />} onClick={() => playChime(shownPct / 100)}>
              Test sound
            </Button>
          </div>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
