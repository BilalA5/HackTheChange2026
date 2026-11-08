import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@/stores/session";
import { Spinner } from "@/components/ui/Feedback";
import { LeftRail } from "./LeftRail";

/** Route guard. No user goes to /login. Users who have not finished onboarding go to /onboarding. */
export function RequireAuth() {
  const user = useSession((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!user.onboardingComplete && !location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

function Fallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size={22} label="Loading screen" />
    </div>
  );
}

/** Main app: left rail plus the page on the right. */
export function AppShell() {
  return (
    <div className="flex h-full min-h-0">
      <LeftRail />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Suspense fallback={<Fallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

/** Full-bleed layout (no rail) for onboarding, objectives, stages and presentations. */
export function FocusLayout() {
  return (
    <div className="h-full min-h-0">
      <Suspense fallback={<Fallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
