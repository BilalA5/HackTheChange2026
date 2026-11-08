import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { PanelName, PanelProps } from "@/stores/ui";

/** Panel name to feature component. Each feature module default-exports a component taking PanelProps. */
export const PANEL_COMPONENTS: Record<PanelName, LazyExoticComponent<ComponentType<PanelProps>>> = {
  settings: lazy(() => import("@/features/account/SettingsModal")),
  credits: lazy(() => import("@/features/account/CreditsPopover")),
  notifications: lazy(() => import("@/features/account/NotificationsPanel")),
  bug: lazy(() => import("@/features/account/BugReporter")),
  support: lazy(() => import("@/features/account/SupportPanel")),
  coach: lazy(() => import("@/features/account/CoachPanel")),
  xp: lazy(() => import("@/features/home/XpPopover")),
  vision: lazy(() => import("@/features/home/VisionBoardPanel")),
};
