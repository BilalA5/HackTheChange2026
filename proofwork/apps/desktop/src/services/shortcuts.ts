// Global shortcuts. Each fires a "press" to every window; unregistered on quit.
import { globalShortcut } from "electron";
import type { ShortcutName } from "@pw/shared";
import { log } from "../log.ts";

const BINDINGS: [accelerator: string, name: ShortcutName][] = [
  ["CommandOrControl+Shift+B", "bug-report"],
  ["CommandOrControl+Shift+P", "toggle-pip"],
  ["Alt+Space", "push-to-talk"],
];

export function registerShortcuts(onFire: (name: ShortcutName, phase: "press") => void): void {
  for (const [accelerator, name] of BINDINGS) {
    const ok = globalShortcut.register(accelerator, () => onFire(name, "press"));
    if (!ok) log.warn(`shortcut ${name} could not be registered (already taken?)`);
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
