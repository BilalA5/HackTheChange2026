import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles/app.css";
import { pw } from "@/lib/bridge";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { getServerUrl } from "@/lib/api";
import AppRoot from "@/app/App";
import { SurfaceRoot } from "@/app/SurfaceRoot";
import { SURFACE_COMPONENTS } from "@/app/surfaces";

const surface = pw.surface;
document.documentElement.dataset.surface = surface;
// Resolve the server origin early so WebSocket URLs are ready when the first socket opens.
void getServerUrl();

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

const tree =
  surface === "main" ? (
    <ErrorBoundary>
      <AppRoot />
    </ErrorBoundary>
  ) : (
    <SurfaceRoot>
      <ErrorBoundary>
        <Suspense fallback={null}>
          {(() => {
            const Surface = SURFACE_COMPONENTS[surface];
            return <Surface />;
          })()}
        </Suspense>
      </ErrorBoundary>
    </SurfaceRoot>
  );

createRoot(container).render(<StrictMode>{tree}</StrictMode>);
