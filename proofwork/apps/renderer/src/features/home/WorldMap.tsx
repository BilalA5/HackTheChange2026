// The Home world map: every company building, placed at its scenario's position on a stylised isometric district.
import { useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { ScenarioCard } from "@pw/shared";
import { buildingHeight } from "./buildings";
import type { Pt } from "./geometry";
import { MapBackdrop } from "./MapBackdrop";
import { MapBuilding, MAP_HEIGHT, MAP_WIDTH } from "./MapBuilding";
import { DISTRICT } from "./map/district";
import { layoutBuildings, percentToCanvas } from "./map/lattice";
import { cn } from "@/lib/cn";

export interface WorldMapProps {
  cards: readonly ScenarioCard[];
  /** The learner's career. Its buildings are fully coloured; the rest are muted. */
  currentCareerId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

const LABEL_W = 240;
const LABEL_H = 56;

function BuildingLabel({ card, ground }: { card: ScenarioCard; ground: Pt }) {
  const top = ground.y - buildingHeight(card.company.building);
  const x = Math.min(MAP_WIDTH - LABEL_W - 8, Math.max(8, ground.x - LABEL_W / 2));
  const y = Math.max(8, top - LABEL_H - 14);
  return (
    <foreignObject x={x} y={y} width={LABEL_W} height={LABEL_H} style={{ pointerEvents: "none", overflow: "visible" }}>
      <div className="glass flex h-full flex-col items-center justify-center gap-0.5 rounded-2xl px-3 text-center">
        <span className="font-mono text-[10px] tracking-[0.08em] text-fg-muted uppercase">{card.company.name}</span>
        <span className="max-w-full truncate text-[13px] font-medium text-fg">{card.title}</span>
      </div>
    </foreignObject>
  );
}

/** Full-bleed SVG map (viewBox 1600×1000, slice). Buildings are focusable buttons with aria-labels. */
export function WorldMap({ cards, currentCareerId, selectedId, onSelect, className }: WorldMapProps) {
  const reduced = useReducedMotion() ?? false;
  const [activeId, setActiveId] = useState<string | null>(null);

  // Each company snaps to its own block. Draw back-to-front: buildings lower on the canvas are closer.
  const placed = useMemo(() => {
    const layout = layoutBuildings(cards, DISTRICT.isFree);
    const items = cards.map((card) => ({
      card,
      ground: layout.get(card.id)?.ground ?? percentToCanvas(card.map.x, card.map.y),
    }));
    return items.sort((a, b) => a.ground.y - b.ground.y);
  }, [cards]);
  const active = activeId ? placed.find((p) => p.card.id === activeId) ?? null : null;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full select-none"
        role="group"
        aria-label="City map of company projects"
      >
        <defs>
          <linearGradient id="pw-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" style={{ stopColor: "var(--color-accent)", stopOpacity: 0.85 }} />
            <stop offset="1" style={{ stopColor: "var(--color-accent)", stopOpacity: 0 }} />
          </linearGradient>
          <filter id="pw-soft" x="-100%" y="-10%" width="300%" height="120%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <MapBackdrop reduced={reduced} />

        <g>
          {placed.map(({ card, ground }) => (
            <MapBuilding
              key={card.id}
              card={card}
              ground={ground}
              current={currentCareerId !== null && card.careerId === currentCareerId}
              selected={card.id === selectedId}
              reduced={reduced}
              onSelect={onSelect}
              onActivate={setActiveId}
            />
          ))}
        </g>

        <g>{active && <BuildingLabel card={active.card} ground={active.ground} />}</g>
      </svg>

      {/* Subtle vignette keeps the floating UI readable */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.5)_100%)]" />
    </div>
  );
}
