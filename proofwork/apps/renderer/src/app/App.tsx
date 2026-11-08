import { RouterProvider } from "react-router";
import { useEffect } from "react";
import { useSession } from "@/stores/session";
import { router } from "./router";

/** Main window. Hydrates the session once, then mounts the router. */
export default function App() {
  useEffect(() => {
    void useSession.getState().hydrate();
  }, []);
  return <RouterProvider router={router} />;
}
