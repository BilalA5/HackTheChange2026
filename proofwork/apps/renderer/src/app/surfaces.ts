import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { OverlayKind } from "@pw/shared";

/** Overlay surface name (?surface=) to the component rendered in that window. */
export const SURFACE_COMPONENTS: Record<OverlayKind, LazyExoticComponent<ComponentType>> = {
  pip: lazy(() => import("@/features/overlays/PipSurface")),
  hud: lazy(() => import("@/features/overlays/HudSurface")),
  island: lazy(() => import("@/features/overlays/IslandSurface")),
  cowork: lazy(() => import("@/features/overlays/CoworkSurface")),
  region: lazy(() => import("@/features/overlays/RegionSurface")),
  camera: lazy(() => import("@/features/presentation/CameraSurface")),
  recordbar: lazy(() => import("@/features/presentation/RecordBarSurface")),
};
