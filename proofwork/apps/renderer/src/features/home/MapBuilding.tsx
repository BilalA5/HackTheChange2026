// One company building on the world map: stacked isometric prisms with lit and dark windows, a rooftop
// sign, a soft cast shadow and (when selected) a violet beam and pulse ring. Focusable, keyboard selectable.
import { motion } from "motion/react";
import type { ScenarioCard } from "@pw/shared";
import { BUILDING_SPECS, type BuildingCap } from "./buildings";
import { buildingPalette, facePointAt, isoBlock, polygonPath, windowSplit, type BuildingPalette, type IsoBlock, type Pt } from "./geometry";
import { statusLabel } from "./model";

export { MAP_HEIGHT, MAP_WIDTH } from "./map/lattice";

const LIT_WINDOW = "#FFD98A";
const DARK_WINDOW = "#070A12";

function Cap({ cap, top, half, palette }: { cap: BuildingCap; top: IsoBlock; half: number; palette: BuildingPalette }) {
  const cx = top.B.x;
  // The top face is a diamond whose left and right corners share the centre height.
  const yt = (top.topL.y + top.topR.y) / 2;
  switch (cap) {
    case "dome":
    case "barrel": {
      const ry = cap === "dome" ? half * 0.85 : half * 0.5;
      return (
        <path
          d={`M ${top.topL.x} ${yt} A ${half} ${ry} 0 0 1 ${top.topR.x} ${yt} Z`}
          fill={palette.top}
          stroke="#000"
          strokeOpacity={0.2}
          strokeWidth={1}
        />
      );
    }
    case "roof": {
      const apex = { x: cx, y: yt - half * 0.9 };
      return (
        <g stroke="#000" strokeOpacity={0.2} strokeWidth={1}>
          <path d={polygonPath([top.topL, top.topF, apex])} fill={palette.left} />
          <path d={polygonPath([top.topF, top.topR, apex])} fill={palette.right} />
        </g>
      );
    }
    case "spire": {
      const tip = yt - 60;
      return (
        <g>
          <path d={`M ${cx - 2} ${yt} L ${cx} ${tip} L ${cx + 2} ${yt} Z`} fill={palette.right} />
          <circle cx={cx} cy={tip} r={3.5} fill="#7B6CF6" />
        </g>
      );
    }
    default:
      return null;
  }
}

/** Where the rooftop sign stands: on the roof, or on the apex of a dome, barrel or roof cap. */
function roofAnchor(cap: BuildingCap, top: IsoBlock, half: number): Pt {
  const cx = top.B.x;
  const yt = (top.topL.y + top.topR.y) / 2;
  switch (cap) {
    case "dome":
      return { x: cx, y: yt - half * 0.85 };
    case "barrel":
      return { x: cx, y: yt - half * 0.5 };
    case "roof":
      return { x: cx, y: yt - half * 0.9 };
    default:
      return { x: cx, y: yt };
  }
}

function RoofSign({ at, glyph, palette }: { at: Pt; glyph: string; palette: BuildingPalette }) {
  return (
    <g aria-hidden="true">
      <line x1={at.x} y1={at.y} x2={at.x} y2={at.y - 7} stroke={palette.sign} strokeWidth={2} />
      <rect x={at.x - 13} y={at.y - 27} width={26} height={17} rx={3} fill="#FFF3D6" stroke={palette.sign} strokeWidth={1} />
      <text
        x={at.x}
        y={at.y - 18.5}
        fontSize={10.5}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fill: palette.sign, fontFamily: "var(--font-mono)", fontWeight: 600 }}
      >
        {glyph}
      </text>
    </g>
  );
}

export interface MapBuildingProps {
  card: ScenarioCard;
  /** Top surface centre of the block this building stands on. */
  ground: Pt;
  /** True when the project belongs to the learner's career (fully coloured). Others are muted. */
  current: boolean;
  selected: boolean;
  reduced: boolean;
  onSelect: (id: string) => void;
  onActivate: (id: string | null) => void;
}

export function MapBuilding({ card, ground, current, selected, reduced, onSelect, onActivate }: MapBuildingProps) {
  const spec = BUILDING_SPECS[card.company.building];
  const base = ground;
  const palette = buildingPalette(card.company.color, !current);
  const lockedHere = current && card.status === "locked";
  const label = `${card.company.name}: ${card.title}, ${statusLabel(card.status)}${current ? "" : ", another career"}`;
  const seed = Array.from(card.id).reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) | 0, 7);
  const litShare = current ? 0.42 : 0.28;

  const blocks = spec.blocks.map((b, i) => ({
    ...b,
    index: i,
    geom: isoBlock({ x: base.x + b.dx, y: base.y - b.lift }, b.half, b.height),
  }));
  const lastBlock = blocks[blocks.length - 1];
  const first = blocks[0];
  const padlock = facePointAt(first.geom.L, first.geom.F, first.height, 0.5, 0.82);
  const roof = roofAnchor(spec.cap, lastBlock.geom, lastBlock.half);
  const groundHalf = Math.max(...spec.blocks.map((b) => b.half));

  return (
    <g>
      {selected && (
        <g aria-hidden="true" className="pointer-events-none">
          <rect
            x={base.x - 12}
            y={base.y - 520}
            width={24}
            height={520}
            fill="url(#pw-beam)"
            filter="url(#pw-soft)"
            opacity={0.8}
          />
          <motion.ellipse
            cx={base.x}
            cy={base.y}
            rx={groundHalf * 1.5}
            ry={groundHalf * 0.75}
            fill="none"
            strokeWidth={3}
            style={{ stroke: "var(--color-accent)", transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={reduced ? { scale: 1, opacity: 0.5 } : { scale: [0.6, 2.1], opacity: [0.9, 0] }}
            transition={reduced ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        </g>
      )}

      {/* Soft cast shadow on the block, falling to the lower right */}
      <ellipse
        cx={base.x + 16}
        cy={base.y + 5}
        rx={groundHalf + 8}
        ry={groundHalf * 0.5}
        fill="#05070C"
        opacity={0.45}
        filter="url(#pw-soft)"
        className="pointer-events-none"
      />

      <g
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-pressed={selected}
        className="group cursor-pointer outline-none transition-transform duration-200 ease-out hover:-translate-y-1 focus-visible:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        style={{ opacity: current ? 1 : 0.86 }}
        onClick={() => onSelect(card.id)}
        onMouseEnter={() => onActivate(card.id)}
        onMouseLeave={() => onActivate(null)}
        onFocus={() => onActivate(card.id)}
        onBlur={() => onActivate(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(card.id);
          }
        }}
      >
        {blocks.map((b) => {
          const cols = Math.max(2, Math.round(b.half / 9));
          const rows = Math.max(2, Math.floor(b.height / 24));
          const wl = windowSplit(b.geom.L, b.geom.F, b.height, cols, rows, seed + b.index * 7, litShare);
          const wr = windowSplit(b.geom.F, b.geom.R, b.height, cols, rows, seed + b.index * 7 + 3, litShare);
          return (
            <g key={b.index}>
              <path d={polygonPath(b.geom.left)} fill={palette.left} stroke="#000" strokeOpacity={0.2} strokeWidth={1} />
              <path d={polygonPath(b.geom.right)} fill={palette.right} stroke="#000" strokeOpacity={0.2} strokeWidth={1} />
              <path d={wl.dark} fill={DARK_WINDOW} opacity={0.4} />
              <path d={wl.lit} fill={LIT_WINDOW} opacity={0.9} />
              <path d={wr.dark} fill={DARK_WINDOW} opacity={0.4} />
              <path d={wr.lit} fill={LIT_WINDOW} opacity={0.9} />
              <path d={polygonPath(b.geom.top)} fill={palette.top} stroke="#000" strokeOpacity={0.2} strokeWidth={1} />
            </g>
          );
        })}

        <Cap cap={spec.cap} top={lastBlock.geom} half={lastBlock.half} palette={palette} />
        <RoofSign at={roof} glyph={card.company.glyph} palette={palette} />

        {lockedHere && (
          <g aria-hidden="true" fill="#FFFFFF" opacity={0.9} stroke="#FFFFFF" strokeWidth={1.6}>
            <rect x={padlock.x - 5} y={padlock.y - 3} width={10} height={8} rx={2} />
            <path d={`M ${padlock.x - 3} ${padlock.y - 3} V ${padlock.y - 6} a 3 3 0 0 1 6 0 V ${padlock.y - 3}`} fill="none" />
          </g>
        )}

        <ellipse
          cx={base.x}
          cy={base.y + groundHalf / 4}
          rx={groundHalf + 16}
          ry={groundHalf * 0.66}
          fill="none"
          strokeWidth={2}
          style={{ stroke: "var(--color-accent)" }}
          className="pointer-events-none opacity-0 transition-opacity duration-200 group-focus-visible:opacity-100"
        />
      </g>
    </g>
  );
}
