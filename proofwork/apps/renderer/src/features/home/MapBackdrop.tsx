// Everything under the buildings: sea and shoreline, a raised isometric city district, parks, a plaza,
// street lamps, a pier and boats, clouds, and dusk lighting. Pure SVG, no raster art.
import { motion } from "motion/react";
import { COAST_BAND, COAST_PATH, SEA_PATH } from "./map/coast";
import { DISTRICT } from "./map/district";
import { MAP_HEIGHT, MAP_WIDTH, SIDEWALK_H, cellCentre } from "./map/lattice";

const LAND_MASK_ID = "pw-land-mask";
const SEA_CLIP_ID = "pw-sea-clip";

const SLATE_ROAD = "#2A2F3A";
const SAND = "#E9D8B4";

/** Wave crest path across the full width. Clipped to the sea, so only the water shows. */
function wavePath(y: number): string {
  let d = `M -160 ${y} q 36 -6 72 0`;
  for (let x = 0; x < 2000; x += 72) d += " t 72 0";
  return d;
}
const WAVE_ROWS = [16, 40, 64, 88, 112, 220, 360, 500, 640, 780, 900];

function Shimmer({ reduced }: { reduced: boolean }) {
  return (
    <g clipPath={`url(#${SEA_CLIP_ID})`} className="pointer-events-none">
      <motion.g
        initial={{ x: -60 }}
        animate={reduced ? { x: -60 } : { x: [-60, 60, -60] }}
        transition={reduced ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        {WAVE_ROWS.map((y, i) => (
          <path key={y} d={wavePath(y)} fill="none" strokeWidth={2} stroke="#CFEFF2" opacity={i % 2 ? 0.1 : 0.18} />
        ))}
      </motion.g>
    </g>
  );
}

const CLOUDS: { x: number; y: number; s: number; drift: number }[] = [
  { x: 520, y: 52, s: 0.9, drift: 40 },
  { x: 1200, y: 40, s: 0.8, drift: 56 },
  { x: 300, y: 228, s: 1, drift: 46 },
];

function Clouds({ reduced }: { reduced: boolean }) {
  return (
    <g fill="#FFFFFF" opacity={0.1} className="pointer-events-none">
      {CLOUDS.map((c, i) => (
        <motion.g
          key={i}
          animate={reduced ? { x: 0 } : { x: [0, c.drift, 0] }}
          transition={reduced ? undefined : { duration: 38 + i * 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx={c.x} cy={c.y} rx={92 * c.s} ry={24 * c.s} />
          <ellipse cx={c.x - 46 * c.s} cy={c.y + 6 * c.s} rx={58 * c.s} ry={26 * c.s} />
          <ellipse cx={c.x + 52 * c.s} cy={c.y + 8 * c.s} rx={50 * c.s} ry={20 * c.s} />
        </motion.g>
      ))}
    </g>
  );
}

function Trees() {
  return (
    <g>
      {DISTRICT.trees.map((t, i) => (
        <g key={i}>
          <ellipse cx={t.x + 5} cy={t.y + 7} rx={t.r + 3} ry={t.r * 0.55} fill="#000" opacity={0.3} />
          <circle cx={t.x} cy={t.y} r={t.r} fill="#3D8F5E" />
          <circle cx={t.x - t.r * 0.3} cy={t.y - t.r * 0.35} r={t.r * 0.42} fill="#86D6A0" opacity={0.5} />
        </g>
      ))}
    </g>
  );
}

function Lamps() {
  return (
    <g>
      {DISTRICT.lamps.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={8} fill="#FFC766" opacity={0.2} />
          <circle cx={p.x} cy={p.y} r={2.4} fill="#FFE2A0" />
        </g>
      ))}
    </g>
  );
}

function Plaza({ reduced }: { reduced: boolean }) {
  const plaza = DISTRICT.plaza;
  if (!plaza) return null;
  const c = cellCentre(plaza.cell);
  const x = c.x;
  const y = c.y - SIDEWALK_H;
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={30} ry={15} fill="#4A5260" stroke="#B8C2D0" strokeWidth={2} />
      <ellipse cx={x} cy={y} rx={24} ry={12} fill="#3B6F7E" stroke="#A9DDE3" strokeWidth={1.5} />
      <motion.ellipse
        cx={x}
        cy={y}
        rx={14}
        ry={7}
        fill="#CFF3F7"
        initial={{ opacity: 0.45 }}
        animate={reduced ? { opacity: 0.6 } : { opacity: [0.35, 0.7, 0.35] }}
        transition={reduced ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <rect x={x - 2} y={y - 16} width={4} height={12} fill="#B8C2D0" />
      <circle cx={x} cy={y - 18} r={3} fill="#CFF3F7" opacity={0.8} />
    </g>
  );
}

/** A small sailboat and a motorboat in the top sea. The bob uses transform only. */
function Boats({ reduced }: { reduced: boolean }) {
  const bob = (dur: number) =>
    reduced ? undefined : { duration: dur, repeat: Infinity, ease: "easeInOut" as const };
  return (
    <g className="pointer-events-none">
      <g transform="translate(640 40)">
        <motion.g animate={reduced ? { y: 0 } : { y: [0, -1.5, 0] }} transition={bob(4)}>
          <path d="M -12 0 L 12 0 L 8 6 L -8 6 Z" fill="#1D2A33" />
          <path d="M 0 -2 L 0 -26 L 13 -4 Z" fill="#F4F1EA" opacity={0.92} />
          <path d="M -6 -2 L -6 -14 L -14 -3 Z" fill="#E9D8B4" opacity={0.9} />
        </motion.g>
      </g>
      <g transform="translate(1230 36)">
        <motion.g animate={reduced ? { y: 0 } : { y: [0, 1.5, 0] }} transition={bob(3.2)}>
          <path d="M -10 0 L 10 0 L 7 5 L -7 5 Z" fill="#E4572E" />
          <rect x={-4} y={-6} width={8} height={6} fill="#F4F1EA" />
        </motion.g>
      </g>
    </g>
  );
}

/** Wooden pier reaching into the top sea. Drawn above the sand so it reads as built over the water. */
function Pier() {
  return (
    <g>
      <rect x={1024} y={74} width={10} height={54} fill="#8B6A4B" />
      <rect x={1022} y={72} width={14} height={4} fill="#5E4632" />
      <rect x={1020} y={96} width={3} height={8} fill="#5E4632" />
      <rect x={1032} y={96} width={3} height={8} fill="#5E4632" />
      <rect x={1030} y={60} width={14} height={10} rx={2} fill="#5E4632" />
      <rect x={1033} y={63} width={8} height={4} fill="#F2A33A" opacity={0.85} />
    </g>
  );
}

export interface MapBackdropProps {
  reduced: boolean;
}

/** Everything under the buildings, in layers: sea, shoreline, masked land, pier, boats, clouds, lighting. */
export function MapBackdrop({ reduced }: MapBackdropProps) {
  const p = DISTRICT.paths;
  return (
    <g>
      <defs>
        <linearGradient id="pw-sea" x1="1" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#12505A" />
          <stop offset="1" stopColor="#0E3B43" />
        </linearGradient>
        <radialGradient id="pw-dusk" cx={0} cy={0} r={820} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B1B45" stopOpacity={0.6} />
          <stop offset="1" stopColor="#1B1B45" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pw-horizon" cx={1200} cy={40} r={640} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFB36B" stopOpacity={0.32} />
          <stop offset="0.5" stopColor="#FF8A5B" stopOpacity={0.08} />
          <stop offset="1" stopColor="#FF8A5B" stopOpacity={0} />
        </radialGradient>
        <clipPath id={SEA_CLIP_ID}>
          <path d={SEA_PATH} />
        </clipPath>
        {/* White where there is land, minus the sand band. Sea and sand stay visible through the holes. */}
        <mask id={LAND_MASK_ID} maskUnits="userSpaceOnUse" x={-200} y={-200} width={2000} height={1400}>
          <rect x={-200} y={-200} width={2000} height={1400} fill="#fff" />
          <path d={SEA_PATH} fill="#000" />
          <path d={COAST_PATH} fill="none" stroke="#000" strokeWidth={COAST_BAND} />
        </mask>
      </defs>

      {/* Sea */}
      <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#pw-sea)" />
      <Shimmer reduced={reduced} />
      <Boats reduced={reduced} />

      {/* Foam, then sand, along the shoreline */}
      <motion.path
        d={COAST_PATH}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={COAST_BAND + 12}
        strokeLinejoin="round"
        initial={{ opacity: 0.35 }}
        animate={reduced ? { opacity: 0.4 } : { opacity: [0.3, 0.55, 0.3] }}
        transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <path d={COAST_PATH} fill="none" stroke={SAND} strokeWidth={COAST_BAND} strokeLinejoin="round" />

      {/* Land: road base, dashes, raised blocks, lots, parks, plaza, lamps */}
      <g mask={`url(#${LAND_MASK_ID})`}>
        <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill={SLATE_ROAD} />
        <path d={p.roads} fill="none" stroke="#6B7385" strokeWidth={2} strokeDasharray="14 12" opacity={0.7} />
        <path d={p.lotTops} fill="#303643" />
        <path d={p.sidesLeft} fill="#23283A" stroke="#15181F" strokeWidth={1} />
        <path d={p.sidesRight} fill="#2C3140" stroke="#15181F" strokeWidth={1} />
        <path d={p.blockTops} fill="#3A404C" stroke="#4D5567" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={p.parkTops} fill="#2F5E4C" stroke="#4E8A6B" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={p.plazaTops} fill="#5B606C" stroke="#8A909D" strokeWidth={2.5} strokeLinejoin="round" />
        <Trees />
        <Plaza reduced={reduced} />
        <Lamps />
      </g>

      <Pier />
      <Clouds reduced={reduced} />

      {/* Dusk lighting: a cool wash top-left, a warm glow at the horizon top-right */}
      <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#pw-dusk)" className="pointer-events-none" />
      <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#pw-horizon)" className="pointer-events-none" />
    </g>
  );
}
