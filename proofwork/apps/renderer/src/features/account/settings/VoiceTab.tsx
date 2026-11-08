import { useCallback } from "react";
import type { UserSettings } from "@pw/shared";
import { Button } from "@/components/ui/Button";
import { Slider, Switch } from "@/components/ui/Fields";
import { cancel, speak } from "@/lib/voice/tts";
import { FieldRow, Segmented, SettingsGroup, SettingsSection, useDraftValue } from "../ui";
import { useSettingsSaver } from "./saver";

const STT_OPTIONS: { value: UserSettings["voice"]["stt"]; label: string }[] = [
  { value: "apple", label: "On-device (Apple)" },
  { value: "typed", label: "Typed" },
];

const PREVIEW_LINE = "Hi, I am your manager. Walk me through what you have done so far on this brief.";

export function VoiceTab() {
  const { settings, save } = useSettingsSaver();
  const commitRate = useCallback((rate: number) => void save({ voice: { ttsRate: rate } }), [save]);
  const [shownRate, onRateDraft] = useDraftValue(settings?.voice.ttsRate ?? 1, commitRate);
  if (!settings) return null;

  const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Speech to text" description="How your spoken answers are transcribed.">
        <SettingsGroup>
          <FieldRow label="Transcription" hint="On-device keeps audio on this Mac.">
            <Segmented
              label="Speech to text"
              value={settings.voice.stt}
              options={STT_OPTIONS}
              onChange={(stt) => void save({ voice: { stt } })}
            />
          </FieldRow>
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Manager voice" description="The voice your AI manager uses when speaking.">
        <SettingsGroup>
          <Switch
            checked={settings.voice.ttsEnabled}
            onCheckedChange={(on) => {
              if (!on) cancel();
              void save({ voice: { ttsEnabled: on } });
            }}
            label="Speak replies aloud"
            description={speechAvailable ? undefined : "Speech synthesis is not available in this window."}
          />
          <Slider
            label="Speaking rate"
            value={Math.round(shownRate * 10) / 10}
            min={0.5}
            max={2}
            step={0.1}
            unit="x"
            disabled={!settings.voice.ttsEnabled}
            onValueChange={onRateDraft}
          />
          <div>
            <Button
              variant="glass"
              size="sm"
              disabled={!settings.voice.ttsEnabled || !speechAvailable}
              onClick={() => speak(PREVIEW_LINE)}
            >
              Preview voice
            </Button>
          </div>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
