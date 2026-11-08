import { useEffect, useState } from 'react';
import { CANVAS } from '../canvas.js';

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function useViewport() {
  const [viewport, setViewport] = useState(readViewport);
  useEffect(() => {
    const update = () => setViewport(readViewport());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return viewport;
}

/**
 * Draws every screen on one fixed 1600 x 840 canvas, scaled to fit the window and centred.
 * The canvas is not clipped, so backgrounds marked `.bleed` can run out to the window edges.
 */
export default function Stage({ children }) {
  const viewport = useViewport();
  const scale = Math.min(viewport.width / CANVAS.width, viewport.height / CANVAS.height);
  const letterboxX = Math.max(0, (viewport.width / scale - CANVAS.width) / 2);
  const letterboxY = Math.max(0, (viewport.height / scale - CANVAS.height) / 2);

  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-page">
      <div className="relative" style={{ width: CANVAS.width * scale, height: CANVAS.height * scale }}>
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: CANVAS.width,
            height: CANVAS.height,
            transform: `scale(${scale})`,
            '--bx': `${letterboxX}px`,
            '--by': `${letterboxY}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
