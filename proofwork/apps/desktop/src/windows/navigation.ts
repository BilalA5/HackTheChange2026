// Only the renderer origin may load inside our windows. Everything else goes to the system browser.
export function isAllowedNavigation(url: string, rendererOrigin: string): boolean {
  try {
    return new URL(url).origin === rendererOrigin;
  } catch {
    return false;
  }
}
