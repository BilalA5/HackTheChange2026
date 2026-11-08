import InitialsAvatar from '@/shared/InitialsAvatar.jsx';
import { glass } from './glass.js';
import { CheckGlyph, LockGlyph } from './glyphs.jsx';

const band = {
  top: 'bottom-0 inset-x-0 h-[9px]',
  bottom: 'top-0 inset-x-0 h-[9px]',
  left: 'right-0 inset-y-0 w-[9px]',
  right: 'left-0 inset-y-0 w-[9px]',
};

const padding = {
  top: 'pb-[17px] pt-3 px-3',
  bottom: 'pt-[17px] pb-3 px-3',
  left: 'pr-[17px] pl-3 py-3',
  right: 'pl-[17px] pr-3 py-3',
};

export function TileFrame({ slot, className = '', style, children, ...props }) {
  return (
    <div
      className={`pointer-events-auto relative min-h-0 min-w-0 overflow-hidden rounded-[16px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08),0_18px_40px_-24px_rgba(0,0,0,.9)] ${className}`}
      style={{ gridRow: slot.row, gridColumn: slot.column, ...glass, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export default function Tile({ stop, number, slot, status, selected, userName, onSelect }) {
  const locked = status === 'locked';

  return (
    <TileFrame slot={slot} className={selected ? 'shadow-[inset_0_0_0_2px_#F4F4F3]' : ''}>
      <button
        type="button"
        onClick={() => onSelect(stop.id)}
        aria-pressed={selected}
        aria-label={`Stop ${number}: ${stop.title}${locked ? ', locked' : status === 'done' ? ', done' : ''}`}
        className={`flex h-full w-full flex-col text-left transition-colors hover:bg-white/[0.05] ${padding[slot.side]}`}
      >
        <i className={`absolute ${band[slot.side]}`} style={{ background: stop.color }} />
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-[7px]">
            <span className="grid h-[24px] w-[24px] shrink-0 place-items-center rounded-[7px] bg-white/[0.08]">
              <img src={stop.logo} alt="" className="h-[13px] w-[13px] object-contain" />
            </span>
            <span className="truncate text-[11.5px] text-tx-3">{stop.company}</span>
          </span>
          <span className="font-mono text-[10.5px] tabular-nums text-tx-4">{String(number).padStart(2, '0')}</span>
        </span>
        <span
          className={`mt-2 line-clamp-2 text-[13.5px] font-medium leading-[1.2] tracking-[-0.015em] ${
            locked ? 'text-tx-3' : 'text-tx'
          }`}
        >
          {stop.shortTitle}
        </span>
        <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11.5px] tabular-nums text-tx-3">
          <span className="truncate">
            Wk {stop.week} · +{stop.xp} XP
          </span>
          {status === 'done' && (
            <i className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-spark text-spark-ink">
              <CheckGlyph className="h-[10px] w-[10px]" />
            </i>
          )}
          {locked && <LockGlyph className="h-[13px] w-[13px] shrink-0 text-tx-4" />}
        </span>
      </button>
      {status === 'current' && (
        <span className="board-token pointer-events-none absolute right-2 top-2 rounded-full shadow-[0_0_0_2px_#49BA61,0_6px_16px_-4px_rgba(0,0,0,.8)]">
          <InitialsAvatar name={userName} size={26} />
        </span>
      )}
    </TileFrame>
  );
}
