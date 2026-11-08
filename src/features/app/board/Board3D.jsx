import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Wordmark from '@/shared/Wordmark.jsx';
import { CORNER, boardGeometry, facing, nearestTurn } from './geometry.js';
import { CheckGlyph, LockGlyph } from './glyphs.jsx';
import { usePawnWalk } from './usePawnWalk.js';

const TILT = 54;
const FOCUS_PULL = 0.5;

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

function useCamera(geometry, focusSlot, overview) {
  const [spin, setSpin] = useState(() => (focusSlot ? facing[focusSlot.side] * -1 : 0));
  const target = overview || !focusSlot || focusSlot.side === 'corner' ? null : -facing[focusSlot.side];

  useEffect(() => {
    if (target !== null) setSpin((current) => nearestTurn(current, target));
  }, [target]);

  const center = { x: geometry.width / 2, y: geometry.height / 2 };
  const pull = overview || !focusSlot ? 0 : FOCUS_PULL;
  return {
    spin,
    focus: {
      x: center.x + ((focusSlot?.cx ?? center.x) - center.x) * pull,
      y: center.y + ((focusSlot?.cy ?? center.y) - center.y) * pull,
    },
    zoom: overview ? 0.8 : 1.08,
  };
}

/** Text printed on the board stays readable: it turns against the camera so it always faces the player. */
function Upright({ spin, className = '', children }) {
  return (
    <div className={`board-ease absolute inset-0 ${className}`} style={{ transform: `rotate(${-spin}deg)` }}>
      {children}
    </div>
  );
}

function Tile({ slot, stop, number, status, selected, onSelect }) {
  const sideways = slot.side === 'left' || slot.side === 'right';
  const width = sideways ? slot.h : slot.w;
  const height = sideways ? slot.w : slot.h;
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
      <span
        className="absolute left-1/2 top-1/2 flex flex-col text-left"
        style={{ width, height, transform: `translate(-50%, -50%) rotate(${facing[slot.side]}deg)` }}
      >
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

function Corner({ slot, spin, label, onClick, children }) {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element
      {...(onClick ? { type: 'button', onClick } : {})}
      className="board-tile board-corner absolute"
      style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
    >
      <Upright spin={spin} className="flex flex-col items-center justify-center gap-1 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-3">{label}</span>
        {children}
      </Upright>
    </Element>
  );
}

function House({ slot, color }) {
  const inward = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] }[slot.side];
  const reach = CORNER / 2 - 22;
  return (
    <span
      className="board-house absolute"
      style={{
        left: slot.cx + inward[0] * reach,
        top: slot.cy + inward[1] * reach,
        '--house': color,
      }}
    >
      <i className="face top" />
      <i className="face front" />
      <i className="face back" />
      <i className="face left" />
      <i className="face right" />
    </span>
  );
}

/** Where the pawn stands on a tile: its lower-right corner as the tile reads, clear of the title. */
function standingSpot(slot) {
  if (slot.side === 'corner') return { x: slot.cx, y: slot.cy };
  const angle = (facing[slot.side] * Math.PI) / 180;
  const [right, down] = [44, 40];
  return {
    x: slot.cx + right * Math.cos(angle) - down * Math.sin(angle),
    y: slot.cy + right * Math.sin(angle) + down * Math.cos(angle),
  };
}

function Pawn({ slot, spin, hop, initials }) {
  if (!slot) return null;
  const spot = standingSpot(slot);
  return (
    <span className="board-pawn absolute" style={{ left: spot.x, top: spot.y }}>
      <i className="board-pawn-shadow" key={`shadow-${hop}`} />
      <span className="board-ease board-pawn-stand" style={{ transform: `rotateZ(${-spin}deg) rotateX(${-TILT}deg)` }}>
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
      </span>
    </span>
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

export default function Board3D({
  plan,
  standing,
  selectedId,
  onSelect,
  overview,
  initials,
  corners,
  centerTitle,
  centerLine,
}) {
  const scene = useRef(null);
  const size = useSize(scene);
  const geometry = boardGeometry(plan.stops.length);
  const slotOf = (stopId) => geometry.slots[plan.stops.findIndex((stop) => stop.id === stopId)];
  const currentIndex = standing.current ? plan.stops.indexOf(standing.current) : plan.stops.length - 1;
  const { at: pawnIndex, hop } = usePawnWalk(plan.createdAt, currentIndex);
  const pawnSlot = pawnIndex < 0 ? geometry.corners.start : geometry.slots[pawnIndex];
  const camera = useCamera(geometry, slotOf(selectedId), overview);

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
            className="board-print-area absolute"
            style={{
              left: CORNER,
              top: CORNER,
              width: geometry.width - 2 * CORNER,
              height: geometry.height - 2 * CORNER,
            }}
          >
            <Upright spin={camera.spin} className="flex flex-col items-center justify-center gap-3 text-center">
              <span className="board-print">
                <Wordmark size={46} tone="dark" />
              </span>
              <span className="max-w-[78%] font-serif text-[30px] leading-[1.05] tracking-[-0.03em] text-ink">
                {centerTitle}
              </span>
              <span className="text-[14px] text-ink-3">{centerLine}</span>
            </Upright>
          </div>

          {plan.stops.map((stop, i) => (
            <Tile
              key={stop.id}
              slot={geometry.slots[i]}
              stop={stop}
              number={i + 1}
              status={standing.statusOf(stop)}
              selected={stop.id === selectedId}
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
            <Corner
              key={key}
              slot={geometry.corners[key]}
              spin={camera.spin}
              label={corner.label}
              onClick={corner.onClick}
            >
              {corner.children}
            </Corner>
          ))}

          {plan.stops.map(
            (stop, i) =>
              standing.statusOf(stop) === 'done' && <House key={stop.id} slot={geometry.slots[i]} color={stop.color} />,
          )}

          <Pawn slot={pawnSlot} spin={camera.spin} hop={hop} initials={initials} />
        </div>
      )}
    </div>
  );
}
