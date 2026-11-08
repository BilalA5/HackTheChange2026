import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Bug,
  CreditCard,
  Gauge,
  Info,
  Lock,
  Mic,
  Briefcase,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Volume2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import type { PanelProps } from "@/stores/ui";
import { SaveIndicator } from "./ui";
import { SettingsSaverProvider, useSettingsSaverState } from "./settings/saver";
import { GeneralTab } from "./settings/GeneralTab";
import { CareerTab } from "./settings/CareerTab";
import { AccountTab } from "./settings/AccountTab";
import { UpdatesTab } from "./settings/UpdatesTab";
import { UsageTab } from "./settings/UsageTab";
import { BillingTab } from "./settings/BillingTab";
import { NotificationsTab } from "./settings/NotificationsTab";
import { SoundsTab } from "./settings/SoundsTab";
import { VoiceTab } from "./settings/VoiceTab";
import { PermissionsTab } from "./settings/PermissionsTab";
import { PrivacyTab } from "./settings/PrivacyTab";
import { BugsTab } from "./settings/BugsTab";
import { AboutTab } from "./settings/AboutTab";

export const SETTINGS_TAB_IDS = [
  "general",
  "career",
  "account",
  "updates",
  "usage",
  "billing",
  "notifications",
  "sounds",
  "voice",
  "permissions",
  "privacy",
  "bugs",
  "about",
] as const;
export type SettingsTab = (typeof SETTINGS_TAB_IDS)[number];

const ICON = { size: 16, strokeWidth: 1.75 } as const;

const SETTINGS_TABS: TabItem<SettingsTab>[] = [
  { id: "general", label: "General", icon: <SlidersHorizontal {...ICON} /> },
  { id: "career", label: "Career", icon: <Briefcase {...ICON} /> },
  { id: "account", label: "Account", icon: <User {...ICON} /> },
  { id: "updates", label: "Updates", icon: <RefreshCw {...ICON} /> },
  { id: "usage", label: "Usage", icon: <Gauge {...ICON} /> },
  { id: "billing", label: "Billing", icon: <CreditCard {...ICON} /> },
  { id: "notifications", label: "Notifications", icon: <Bell {...ICON} /> },
  { id: "sounds", label: "Sounds", icon: <Volume2 {...ICON} /> },
  { id: "voice", label: "Voice", icon: <Mic {...ICON} /> },
  { id: "permissions", label: "Permissions", icon: <ShieldCheck {...ICON} /> },
  { id: "privacy", label: "Privacy", icon: <Lock {...ICON} /> },
  { id: "bugs", label: "Bugs", icon: <Bug {...ICON} /> },
  { id: "about", label: "About", icon: <Info {...ICON} /> },
];

/** Unknown or missing values fall back to General, so a stale caller never opens a blank modal. */
export function asSettingsTab(value: unknown): SettingsTab {
  return SETTINGS_TAB_IDS.find((id) => id === value) ?? "general";
}

/** Centred settings dialog. Opened with openPanel("settings", { initialTab }). */
export default function SettingsModal(props: PanelProps) {
  const { onClose } = props;
  const [tab, setTab] = useState<SettingsTab>(() => asSettingsTab(props.initialTab));
  const saver = useSettingsSaverState();

  // A second openPanel("settings", { initialTab }) while open should jump to that tab.
  useEffect(() => {
    setTab(asSettingsTab(props.initialTab));
  }, [props.initialTab]);

  return (
    <Modal open onClose={onClose} title="Settings" widthClass="max-w-[920px]" className="h-[620px]">
      <SettingsSaverProvider value={saver}>
        <div className="flex h-full min-h-0 gap-6">
          <nav aria-label="Settings sections" className="w-[200px] shrink-0 overflow-y-auto border-r border-line pr-4">
            <Tabs tabs={SETTINGS_TABS} value={tab} onChange={(next) => setTab(next)} orientation="vertical" label="Settings sections" />
          </nav>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-7 shrink-0 items-center justify-end">
              <SaveIndicator status={saver.status} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-2 pb-2">
              {renderTab(tab, { goTo: setTab, onClose })}
            </div>
          </div>
        </div>
      </SettingsSaverProvider>
    </Modal>
  );
}

function renderTab(tab: SettingsTab, nav: { goTo(t: SettingsTab): void; onClose(): void }): ReactNode {
  switch (tab) {
    case "general":
      return <GeneralTab />;
    case "career":
      return <CareerTab />;
    case "account":
      return <AccountTab onClose={nav.onClose} />;
    case "updates":
      return <UpdatesTab />;
    case "usage":
      return <UsageTab />;
    case "billing":
      return <BillingTab />;
    case "notifications":
      return <NotificationsTab />;
    case "sounds":
      return <SoundsTab />;
    case "voice":
      return <VoiceTab />;
    case "permissions":
      return <PermissionsTab />;
    case "privacy":
      return <PrivacyTab onGoToAccount={() => nav.goTo("account")} />;
    case "bugs":
      return <BugsTab />;
    case "about":
      return <AboutTab />;
  }
}
