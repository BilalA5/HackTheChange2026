import type { DeepPartial, NotificationCategory, UserSettings } from "@pw/shared";
import { NOTIFICATION_CATEGORIES } from "@pw/shared";
import { Switch } from "@/components/ui/Fields";
import { NOTIFICATION_LABEL } from "../lib/labels";
import { SettingsGroup, SettingsSection } from "../ui";
import { useSettingsSaver } from "./saver";

const DESCRIPTIONS: Record<NotificationCategory, string> = {
  progress: "Stage completed, objective finished, level up.",
  feedback: "New evaluations and rubric results.",
  manager: "Messages from your AI manager and team.",
  coaching: "Short tips from your career coach.",
  jobs: "Job portal unlocks and application updates.",
  billing: "Plan changes and credit alerts.",
  product: "New projects and release notes.",
};

export function NotificationsTab() {
  const { settings, save } = useSettingsSaver();
  if (!settings) return null;

  const setCategory = (category: NotificationCategory, on: boolean) => {
    const change: DeepPartial<UserSettings["notifications"]> = {};
    change[category] = on;
    void save({ notifications: change });
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Categories" description="Choose what Proofwork tells you about.">
        <SettingsGroup>
          {NOTIFICATION_CATEGORIES.map((category) => (
            <Switch
              key={category}
              checked={settings.notifications[category]}
              onCheckedChange={(on) => setCategory(category, on)}
              label={NOTIFICATION_LABEL[category]}
              description={DESCRIPTIONS[category]}
            />
          ))}
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Delivery">
        <SettingsGroup>
          <Switch
            checked={settings.notifications.osDelivery}
            onCheckedChange={(on) => void save({ notifications: { osDelivery: on } })}
            label="Deliver to macOS notification center"
            description="Also send these as system notifications when the app is in the background."
          />
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
