import { Suspense } from "react";
import { useUi, type PanelProps } from "@/stores/ui";
import { PANEL_COMPONENTS } from "./panels";

/** Renders the open panel (at most one). Each feature component draws its own container. */
export function PanelHost() {
  const panel = useUi((s) => s.panel);
  const closePanel = useUi((s) => s.closePanel);
  if (!panel) return null;
  const Panel = PANEL_COMPONENTS[panel.name];
  const props: PanelProps = { ...panel.props, onClose: closePanel };
  return (
    <Suspense fallback={null}>
      <Panel {...props} />
    </Suspense>
  );
}
