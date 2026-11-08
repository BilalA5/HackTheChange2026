import { useState } from "react";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Fields";
import { toast } from "@/components/ui/Toaster";
import { SettingsGroup, SettingsSection } from "../ui";
import { useSettingsSaver } from "./saver";

export function PrivacyTab({ onGoToAccount }: { onGoToAccount: () => void }) {
  const { settings, save } = useSettingsSaver();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await api("GET /me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proofwork-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: "Export ready", body: "Your data was saved as JSON.", tone: "success" });
    } catch (e) {
      toast({ title: "Export failed", body: errorMessage(e), tone: "danger" });
    } finally {
      setExporting(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Data">
        <SettingsGroup>
          <Switch
            checked={settings.privacy.shareAnalytics}
            onCheckedChange={(on) => void save({ privacy: { shareAnalytics: on } })}
            label="Share anonymous usage analytics"
            description="Helps us find rough edges. Never includes your work or recordings."
          />
          <Switch
            checked={settings.privacy.storeRecordings}
            onCheckedChange={(on) => void save({ privacy: { storeRecordings: on } })}
            label="Keep presentation recordings"
            description="When off, recordings are deleted once your feedback is ready."
          />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Your data" description="Download a copy of everything Proofwork holds about you.">
        <SettingsGroup>
          <div className="flex items-center justify-between gap-4">
            <div className="text-[14px] text-fg">Export my data</div>
            <Button variant="glass" size="sm" loading={exporting} icon={<Download size={15} strokeWidth={1.75} />} onClick={() => void exportData()}>
              Export my data
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="text-[14px] text-fg-muted">Want your account removed?</div>
            <Button variant="ghost" size="sm" className="text-danger" onClick={onGoToAccount}>
              Delete account
            </Button>
          </div>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
