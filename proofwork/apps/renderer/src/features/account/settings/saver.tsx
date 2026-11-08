import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DeepPartial, UserSettings } from "@pw/shared";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/Toaster";
import { useSession } from "@/stores/session";
import { buildSettingsPatch, deepMerge, hasChanges } from "../lib/settingsPatch";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SettingsSaver {
  settings: UserSettings | null;
  status: SaveStatus;
  /** Optimistic PATCH /me {settings}. Sends only the changed leaves, then refreshes the user. */
  save(changes: DeepPartial<UserSettings>): Promise<void>;
}

const SettingsContext = createContext<SettingsSaver | null>(null);

const SAVED_FLASH_MS = 1500;

/** Owns the save state for the whole Settings modal. Mounted once by SettingsModal. */
export function useSettingsSaverState(): SettingsSaver {
  const settings = useSession((s) => s.user?.settings ?? null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const save = useCallback(async (changes: DeepPartial<UserSettings>) => {
    const session = useSession.getState();
    const user = session.user;
    if (!user) return;
    const patch = buildSettingsPatch(user.settings, changes);
    if (!hasChanges(patch)) return;

    session.setUser({ ...user, settings: deepMerge(user.settings, patch) });
    window.clearTimeout(flashTimer.current);
    setStatus("saving");
    try {
      await api("PATCH /me", { body: { settings: patch } });
    } catch (e) {
      useSession.getState().setUser(user);
      setStatus("error");
      toast({ title: "Setting not saved", body: errorMessage(e), tone: "danger" });
      return;
    }
    setStatus("saved");
    flashTimer.current = window.setTimeout(() => setStatus("idle"), SAVED_FLASH_MS);
    void useSession.getState().refreshUser().catch(() => undefined);
  }, []);

  return useMemo(() => ({ settings, status, save }), [settings, status, save]);
}

export function SettingsSaverProvider({ value, children }: { value: SettingsSaver; children: ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsSaver(): SettingsSaver {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsSaver must be used inside SettingsModal");
  return ctx;
}
