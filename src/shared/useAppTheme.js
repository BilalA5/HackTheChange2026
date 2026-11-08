import { useLayoutEffect } from 'react';

/**
 * Tags <html> with the app that is on screen, so each app's page-level styles
 * (background, fonts, scrolling) apply only while it is mounted.
 */
export function useAppTheme(name) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.app = name;
    return () => {
      delete root.dataset.app;
    };
  }, [name]);
}
