// Native OS notifications. Clicking one opens the in-app route in the main window.
import { Notification } from "electron";
import { focusMain } from "../windows/mainWindow.ts";

const live = new Set<Notification>(); // keep references so the notification is not garbage collected before it is clicked

export function showNative(opts: { title: string; body: string; route?: string }): void {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title: opts.title, body: opts.body });
  live.add(n);
  n.on("click", () => {
    if (opts.route && opts.route.startsWith("/") && !opts.route.startsWith("//")) focusMain(opts.route);
    else focusMain();
  });
  n.on("close", () => live.delete(n));
  n.show();
}
