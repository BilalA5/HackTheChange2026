import type { UserSettings } from "@pw/shared";
import { Switch } from "@/components/ui/Fields";
import { pw } from "@/lib/bridge";
import { errorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/Toaster";
import { FieldRow, Segmented, SettingsGroup, SettingsSection } from "../ui";
import { useSettingsSaver } from "./saver";

const THEME_OPTIONS: { value: UserSettings["theme"]; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function GeneralTab() {
  const { settings, save } = useSettingsSaver();
  if (!settings) return null;

  const onLaunchAtLogin = (on: boolean) => {
    if (pw.isElectron) {
      pw.app.setLaunchAtLogin(on).catch((e: unknown) =>
        toast({ title: "Could not change launch at login", body: errorMessage(e), tone: "danger" }),
      );
    }
    void save({ launchAtLogin: on });
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Startup" description="How Proofwork starts on this computer.">
        <SettingsGroup>
          <Switch
            checked={settings.launchAtLogin}
            onCheckedChange={onLaunchAtLogin}
            label="Launch at login"
            description={pw.isElectron ? "Open Proofwork when you sign in." : "Available in the desktop app."}
            disabled={!pw.isElectron}
          />
          <Switch
            checked={settings.menuBarStatus}
            onCheckedChange={(v) => void save({ menuBarStatus: v })}
            label="Menu-bar status"
            description="Show Proofwork's status item in the menu bar."
          />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingsGroup>
          <FieldRow label="Theme" hint="System follows your operating system.">
            <Segmented label="Theme" value={settings.theme} options={THEME_OPTIONS} onChange={(theme) => void save({ theme })} />
          </FieldRow>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
