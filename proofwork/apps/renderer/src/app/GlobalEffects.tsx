import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { pw } from "@/lib/bridge";
import { useSession } from "@/stores/session";
import { useProgress } from "@/stores/progress";
import { useCredits } from "@/stores/credits";
import { useNotifications } from "@/stores/notifications";
import { useUi, PANEL_NAMES, type PanelName } from "@/stores/ui";
import { titleForPath } from "./titles";

/**
 * App-wide wiring that needs the router: session data, the titlebar sync with the native shell,
 * navigation and titlebar actions from the main process, and global shortcuts. Renders nothing.
 */
export function GlobalEffects() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSession((s) => s.token);
  const openPanel = useUi((s) => s.openPanel);
  const credits = useCredits((s) => (s.data ? s.data.balance : undefined));
  const level = useProgress((s) => s.data?.level);

  // Data that depends on being signed in.
  useEffect(() => {
    if (!token) return;
    void useProgress.getState().refresh();
    void useCredits.getState().refresh();
    void useNotifications.getState().load();
    const notifications = useNotifications.getState();
    notifications.start();
    return () => notifications.stop();
  }, [token]);

  // Keep the titlebar (native or web) in sync with the current screen.
  const title = titleForPath(location.pathname);
  const canGoBack = location.key !== "default";
  useEffect(() => {
    pw.window.setTitlebar({ title, credits, level, canGoBack });
  }, [title, credits, level, canGoBack]);

  // Navigation requested by overlays, deep links or the native shell.
  useEffect(() => pw.window.onNavigate((route) => navigate(route)), [navigate]);

  useEffect(
    () =>
      pw.window.onTitlebarAction((action) => {
        if (action === "back") navigate(-1);
        else if ((PANEL_NAMES as readonly string[]).includes(action)) openPanel(action as PanelName);
      }),
    [navigate, openPanel],
  );

  // Global shortcuts. ⌘⇧B (web) or the native accelerator opens the bug reporter.
  useEffect(
    () =>
      pw.shortcuts.onShortcut((name, phase) => {
        if (name === "bug-report" && (phase === "press" || phase === "down")) openPanel("bug");
      }),
    [openPanel],
  );

  return null;
}
