/** Title shown in the titlebar for a route. Feature screens can override by calling pw.window.setTitlebar. */
export function titleForPath(pathname: string): string {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/training")) return "Training";
  if (pathname.startsWith("/portfolio")) return "Portfolio";
  if (pathname.startsWith("/jobs")) return "Jobs";
  if (pathname.startsWith("/onboarding")) return "Onboarding";
  if (/^\/objective\/[^/]+\/review/.test(pathname)) return "Review";
  if (/^\/objective\/[^/]+\/feedback/.test(pathname)) return "Feedback";
  if (/\/present$/.test(pathname)) return "Presentation";
  if (/^\/objective\/[^/]+\/stage\//.test(pathname)) return "Stage";
  if (pathname.startsWith("/objective/")) return "Project";
  if (pathname.startsWith("/login")) return "Sign in";
  return "Proofwork";
}
