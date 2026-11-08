import { guide } from '../content.js';

export function TurnHint({ action = 'Click here', className = '' }) {
  return (
    <div
      className={`inline-flex items-center rounded-[10px] bg-white text-[14px] shadow-[0_0_0_1px_rgba(0,0,0,.08),0_10px_24px_-10px_rgba(0,0,0,.35)] ${className}`}
    >
      <span className="px-[14px] py-[9px] text-[#8A8A90]">Your turn</span>
      <span className="h-5 w-px bg-black/10" />
      <span className="px-[10px] py-[9px] font-medium text-[#141416]">{action}</span>
    </div>
  );
}

export function GuideCursor({ x, y }) {
  return (
    <div className="pointer-events-none absolute z-20" style={{ left: x, top: y }}>
      <svg viewBox="0 0 16 16" className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]" aria-hidden="true">
        <path d="M2 1.5v12l3.4-3.1 2.3 4.8 2-1-2.3-4.7h4.6z" fill="#fff" stroke="#141416" strokeWidth="1" />
      </svg>
      <span className="absolute left-[11px] top-[16px] rounded-[7px] bg-white px-[9px] py-[4px] text-[12.5px] font-medium text-[#141416] shadow-[0_6px_16px_-6px_rgba(0,0,0,.6)]">
        {guide.name}
      </span>
    </div>
  );
}
