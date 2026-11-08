import { useEffect, useRef } from "react";
import { OVERLAY_DEFAULTS, type OverlayKind } from "@pw/shared";
import { useOverlayHost, type OverlayItem } from "@/stores/overlayHost";
import { cn } from "@/lib/cn";

/*
 * Web-only overlay simulation. Each open overlay is an <iframe src="/?surface=kind"> placed at its
 * OVERLAY_DEFAULTS anchor. The iframe is a full renderer, so it reads its payload from sessionStorage
 * or from the postMessage sent here. Read the limitations in web-bridge.ts before relying on this.
 * Electron never renders this component: it opens real BrowserWindows.
 */

const PAYLOAD_MSG = "pwOverlayPayload";

function placement(kind: OverlayKind): string {
  const d = OVERLAY_DEFAULTS[kind];
  switch (d.anchor) {
    case "fullscreen":
      return "inset-0";
    case "center":
      return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    case "top-center":
      return "top-3 left-1/2 -translate-x-1/2";
    case "top-right":
      return "top-3 right-3";
    case "bottom-center":
      return "bottom-6 left-1/2 -translate-x-1/2";
    case "bottom-right":
      return "right-6 bottom-6";
  }
}

function OverlayFrame({ item }: { item: OverlayItem }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const d = OVERLAY_DEFAULTS[item.kind];
  const sized = d.anchor !== "fullscreen";

  const postPayload = () => {
    ref.current?.contentWindow?.postMessage({ [PAYLOAD_MSG]: true, kind: item.kind, payload: item.payload }, location.origin);
  };

  // Push payload changes into the running iframe.
  useEffect(() => {
    postPayload();
    // postPayload reads the latest item through closure on each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.payload]);

  return (
    <iframe
      ref={ref}
      key={item.id}
      title={`Overlay: ${item.kind}`}
      src={`/?surface=${item.kind}`}
      onLoad={postPayload}
      className={cn(
        "absolute border-0 bg-transparent",
        placement(item.kind),
        d.clickThrough ? "pointer-events-none" : "pointer-events-auto",
      )}
      style={sized ? { width: d.width, height: d.height } : { width: "100%", height: "100%" }}
      allow="camera; microphone; display-capture"
    />
  );
}

/** Mounts overlay iframes for the web build. Render once, near the root of the main window. */
export function OverlayHost() {
  const items = useOverlayHost((s) => s.items);
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      {items.map((item) => (
        <OverlayFrame key={item.id} item={item} />
      ))}
    </div>
  );
}
