import { useState } from "react";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Fields";
import { Kbd } from "@/components/ui/Kbd";
import { useUi } from "@/stores/ui";
import { readIncludeLogs, writeIncludeLogs } from "../lib/prefs";
import { SettingsGroup, SettingsSection } from "../ui";

export function BugsTab() {
  const [includeLogs, setIncludeLogs] = useState(() => readIncludeLogs());

  const toggleLogs = (on: boolean) => {
    writeIncludeLogs(on);
    setIncludeLogs(on);
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Report a bug" description="Tell the team what went wrong. A screenshot helps.">
        <SettingsGroup>
          <div className="flex items-center justify-between gap-4">
            <div className="text-[14px] text-fg">
              Shortcut
              <div className="text-[12px] text-fg-muted">Opens the bug reporter from anywhere in the app.</div>
            </div>
            <div className="flex items-center gap-1" aria-label="Command Shift B">
              <Kbd>⌘</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>B</Kbd>
            </div>
          </div>
          <div>
            <Button icon={<Bug size={15} strokeWidth={1.75} />} size="sm" onClick={() => useUi.getState().openPanel("bug")}>
              Open bug reporter
            </Button>
          </div>
          <Switch
            checked={includeLogs}
            onCheckedChange={toggleLogs}
            label="Include app logs"
            description="Recent log lines, with secrets removed. On by default."
          />
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
