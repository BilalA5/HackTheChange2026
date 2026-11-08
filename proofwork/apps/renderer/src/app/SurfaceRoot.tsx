import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/Toaster";
import { useSession } from "@/stores/session";

/**
 * Wrapper for every overlay window (?surface=…). Keeps html/body transparent (see app.css) and
 * provides the toaster. Overlays draw their own rounded glass containers.
 */
export function SurfaceRoot({ children }: { children: ReactNode }) {
  // Overlay windows are separate renderers: load the stored session so API calls and sockets are authenticated.
  useEffect(() => {
    void useSession.getState().hydrate();
  }, []);
  return (
    <div className="theme-night h-full w-full bg-transparent text-fg">
      {children}
      <Toaster />
    </div>
  );
}
