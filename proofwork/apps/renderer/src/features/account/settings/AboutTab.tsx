import { useEffect, useState } from "react";
import type { AppInfo } from "@pw/shared";
import { Spinner } from "@/components/ui/Feedback";
import { pw } from "@/lib/bridge";
import { SettingsGroup, SettingsSection } from "../ui";

export function AboutTab() {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    let alive = true;
    pw.app
      .getInfo()
      .then((i) => alive && setInfo(i))
      .catch(() => alive && setInfo(null));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="About">
        <SettingsGroup className="items-start">
          <div className="font-serif text-[36px] leading-none font-medium text-fg">Proofwork</div>
          <div className="font-mono text-[12px] tracking-[0.06em] text-fg-muted">
            {info ? `Version ${info.version}` : <Spinner size={12} label="Loading version" />}
          </div>
          <p className="text-[14px] leading-relaxed text-fg-muted">
            Proofwork is an AI job simulation. You work through realistic projects with an AI manager, then prove what you understood.
          </p>
          <p className="text-[13px] text-fg-muted">
            This is a clean-room educational build. All companies, people and projects in it are fictional.
          </p>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
