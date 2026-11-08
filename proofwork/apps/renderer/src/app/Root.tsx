import { Outlet } from "react-router";
import { pw } from "@/lib/bridge";
import { useSession } from "@/stores/session";
import { Spinner } from "@/components/ui/Feedback";
import { Toaster } from "@/components/ui/Toaster";
import { OverlayHost } from "@/components/overlay/OverlayHost";
import { PanelHost } from "./PanelHost";
import { WebTitlebar } from "./WebTitlebar";
import { GlobalEffects } from "./GlobalEffects";

/** Root route element. Shows a spinner until the stored session is read, then renders the matching route. */
export function Root() {
  const hydrated = useSession((s) => s.hydrated);
  return (
    <div className="flex h-full min-h-0 flex-col bg-night text-fg">
      <GlobalEffects />
      {!pw.isElectron && <WebTitlebar />}
      <div className="min-h-0 flex-1">
        {hydrated ? (
          <Outlet />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Spinner size={22} label="Starting Proofwork" />
          </div>
        )}
      </div>
      <PanelHost />
      <Toaster />
      {!pw.isElectron && <OverlayHost />}
    </div>
  );
}
