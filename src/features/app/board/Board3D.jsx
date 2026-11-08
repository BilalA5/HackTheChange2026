import { useLayoutEffect, useRef, useState } from 'react';
import { companies } from '@/data/companies.js';
import { CORNER, boardGeometry } from './geometry.js';
import { CheckGlyph, LockGlyph } from './glyphs.jsx';
import { usePawnWalk } from './usePawnWalk.js';

const TILT = 54;
const FOCUS_PULL = 0.5;
const LEAN = { left: -10, right: 10, top: 0, bottom: 0 };
const CAMPUS = { src: '/assets/board/campus.jpg', ratio: 1671 / 941 };

function useSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/** The camera glides toward the selected tile and leans a little toward its side of the board. */
function cameraFor(geometry, focusSlot, overview) {
  const center = { x: geometry.width / 2, y: geometry.height / 2 };
  const pull = overview || !focusSlot ? 0 : FOCUS_PULL;
  return {
    spin: overview || !focusSlot ? 0 : (LEAN[focusSlot.side] ?? 0),
    focus: {
      x: center.x + ((focusSlot?.cx ?? center.x) - center.x) * pull,
      y: center.y + ((focusSlot?.cy ?? center.y) - center.y) * pull,
    },
    zoom: overview ? 0.86 : 1.12,
  };
}

/** The campus image covers the middle of the board; `at` places a point given in percent of the image. */
function campusLayout(geometry) {
  const area = { width: geometry.width - 2 * CORNER, height: geometry.height - 2 * CORNER };
  const width = Math.max(area.width, area.height * CAMPUS.ratio);
  const height = width / CAMPUS.ratio;
  const left = (area.width - width) / 2;
  const top = (area.height - height) / 2;
  return {
    area,
    image: { left, top, width, height },
    at: ({ x, y }) => ({ x: CORNER + left + (x / 100) * width, y: CORNER + top + (y / 100) * height }),
  };
}

/** Something standing up off the board, turned to face the camera wherever it moves. */
function Standee({ x, y, spin, ground, className = '', children }) {
  return (
    <span className={`board-standee absolute ${className}`} style={{ left: x, top: y }}>
      {ground}
      <span
        className="board-ease board-standee-face"
        style={{ transform: `rotateZ(${-spin}deg) rotateX(${-TILT}deg)` }}
      >
        {children}
      </span>
    </span>
  );
}

function Tile({ slot, stop, number, status, selected, onSelect }) {
  const locked = status === 'locked';

  return (
    <button
      type="button"
      onClick={() => onSelect(stop.id)}
      aria-pressed={selected}
      aria-label={`Stop ${number}: ${stop.title}${locked ? ', locked' : status === 'done' ? ', done' : ''}`}
      className={`board-tile absolute ${selected ? 'is-selected' : ''} ${locked ? 'is-locked' : ''}`}
      style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
    >
      <span className="absolute inset-0 flex flex-col text-left">
        <span
          className="flex h-[34px] shrink-0 items-center justify-between px-3 font-mono text-[11px] tabular-nums tracking-[0.12em] text-black/60"
          style={{ background: stop.color }}
        >
          <span>{String(number).padStart(2, '0')}</span>
          {status === 'done' && <CheckGlyph className="h-[13px] w-[13px] text-black/70" />}
          {locked && <LockGlyph className="h-[13px] w-[13px]" />}
        </span>
        <span className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-[10px]">
          <span className="flex items-center gap-[6px] text-[11.5px] text-ink-3">
            <img src={stop.logo} alt="" className="board-logo h-[13px] w-[13px] object-contain" />
            <span className="truncate">{stop.company}</span>
          </span>
          <span className="mt-[6px] line-clamp-3 text-[15px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
            {stop.shortTitle}
          </span>
          <span className="mt-auto text-[11.5px] tabular-nums text-ink-3">
            Wk {stop.week} · +{stop.xp} XP
          </span>
        </span>
      </span>
    </button>
  );
}

function Corner({ slot, label, onClick, children }) {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element
      {...(onClick ? { type: 'button', onClick } : {})}
      className="board-tile board-corner absolute"
      style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
    >
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-3">{label}</span>
        {children}
      </span>
    </Element>
  );
}

function House({ slot, color }) {
  return (
    <span className="board-house absolute" style={{ left: slot.x + slot.w - 26, top: slot.y + 17, '--house': color }}>
      <i className="face top" />
      <i className="face front" />
      <i className="face back" />
      <i className="face left" />
      <i className="face right" />
    </span>
  );
}

function Pawn({ slot, spin, hop, initials }) {
  const corner = slot.side === 'corner';
  return (
    <Standee
      x={corner ? slot.cx : slot.x + slot.w - 34}
      y={corner ? slot.cy + 30 : slot.y + slot.h - 30}
      spin={spin}
      ground={<i className="board-pawn-shadow" key={`shadow-${hop}`} />}
      className="board-pawn"
    >
      <span className="board-pawn-hop" key={hop}>
        <span className="board-pawn-label">{initials}</span>
        <svg viewBox="0 0 48 76" className="h-[76px] w-[48px] drop-shadow-[0_8px_10px_rgba(0,0,0,.35)]">
          <defs>
            <linearGradient id="pawn" x1="0" x2="1">
              <stop offset="0" stopColor="#2E9A48" />
              <stop offset="0.45" stopColor="#7BE08F" />
              <stop offset="1" stopColor="#1F7A37" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="14" r="11" fill="url(#pawn)" />
          <path d="M15 27h18l-3 6c6 6 9 18 11 33H7c2-15 5-27 11-33z" fill="url(#pawn)" />
          <rect x="4" y="64" width="40" height="10" rx="5" fill="url(#pawn)" />
        </svg>
      </span>
    </Standee>
  );
}

function CampusPin({ stop, at, spin }) {
  const map = companies[stop.companyId]?.map;
  if (!map) return null;
  const point = at(map);
  return (
    <Standee x={point.x} y={point.y} spin={spin} className="board-pin">
      <span className="board-pin-body" key={stop.companyId}>
        <span className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white py-[6px] pl-[8px] pr-[14px] text-[15px] font-semibold text-[#141416] shadow-[0_10px_24px_-8px_rgba(0,0,0,.6)]">
          <img src={stop.logo} alt="" className="h-[18px] w-[18px] object-contain brightness-0" />
          {stop.company}
        </span>
        <i className="board-pin-stem" />
      </span>
    </Standee>
  );
}

function Slab({ width, height }) {
  return (
    <>
      <i className="board-table" style={{ left: -80, top: -80, width: width + 160, height: height + 160 }} />
      <i className="board-side is-long" style={{ left: 0, top: 0, width }} />
      <i className="board-side is-long is-front" style={{ left: 0, top: height, width }} />
      <i className="board-side is-short" style={{ left: 0, top: 0, height }} />
      <i className="board-side is-short" style={{ left: width, top: 0, height }} />
    </>
  );
}

export default function Board3D({ plan, standing, selectedId, onSelect, overview, initials, corners }) {
  const scene = useRef(null);
  const size = useSize(scene);
  const geometry = boardGeometry(plan.stops.length);
  const selectedIndex = plan.stops.findIndex((stop) => stop.id === selectedId);
  const currentIndex = standing.current ? plan.stops.indexOf(standing.current) : plan.stops.length - 1;
  const { at: pawnIndex, hop } = usePawnWalk(plan.createdAt, currentIndex);
  const pawnSlot = pawnIndex < 0 ? geometry.corners.start : geometry.slots[pawnIndex];
  const camera = cameraFor(geometry, geometry.slots[selectedIndex], overview);
  const campus = campusLayout(geometry);

  const span = Math.max(geometry.width, geometry.height);
  const fit = Math.min(size.width / span, size.height / (span * 0.68));
  const scale = fit * camera.zoom;

  return (
    <div ref={scene} className="board-scene absolute inset-0">
      {size.width > 0 && (
        <div
          className="board-ease board-plane absolute left-1/2 top-[54%]"
          style={{
            width: geometry.width,
            height: geometry.height,
            transform: `scale3d(${scale}, ${scale}, ${scale}) rotateX(${TILT}deg) rotateZ(${camera.spin}deg) translate(${-camera.focus.x}px, ${-camera.focus.y}px)`,
          }}
        >
          <Slab width={geometry.width} height={geometry.height} />
          <div className="board-top absolute inset-0" />

          <div
            className="board-campus absolute overflow-hidden"
            style={{ left: CORNER, top: CORNER, width: campus.area.width, height: campus.area.height }}
          >
            <img src={CAMPUS.src} alt="" className="absolute max-w-none" style={campus.image} />
          </div>

          {plan.stops.map((stop, i) => (
            <Tile
              key={stop.id}
              slot={geometry.slots[i]}
              stop={stop}
              number={i + 1}
              status={standing.statusOf(stop)}
              selected={i === selectedIndex}
              onSelect={onSelect}
            />
          ))}
          {geometry.slots.slice(plan.stops.length).map((slot) => (
            <div
              key={`${slot.x}-${slot.y}`}
              className="board-tile is-blank absolute"
              style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
            />
          ))}

          {Object.entries(corners).map(([key, corner]) => (
            <Corner key={key} slot={geometry.corners[key]} label={corner.label} onClick={corner.onClick}>
              {corner.children}
            </Corner>
          ))}

          {plan.stops.map(
            (stop, i) =>
              standing.statusOf(stop) === 'done' && <House key={stop.id} slot={geometry.slots[i]} color={stop.color} />,
          )}

          {!overview && selectedIndex >= 0 && (
            <CampusPin stop={plan.stops[selectedIndex]} at={campus.at} spin={camera.spin} />
          )}
          <Pawn slot={pawnSlot} spin={camera.spin} hop={hop} initials={initials} />
        </div>
      )}
    </div>
  );
}
