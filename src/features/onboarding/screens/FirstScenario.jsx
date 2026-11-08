import { Link } from 'react-router';
import { Wordmark } from '../components/brand.jsx';
import { GuideCursor, TurnHint } from '../components/hints.jsx';
import { BriefcaseIcon } from '../components/icons.jsx';
import WorldMap from '../components/WorldMap.jsx';

const frosted = (blur, tint) => ({
  background: `rgba(14,14,16,${tint})`,
  backdropFilter: blur,
  WebkitBackdropFilter: blur,
});

function WorldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" {...props}>
      <rect x="5" y="5" width="14" height="14" rx="4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TeamIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="8" cy="15" r="3" />
      <circle cx="16" cy="8" r="3" />
    </svg>
  );
}

function Sidebar() {
  return (
    <aside
      className="absolute bottom-[calc(-1*var(--by,0px))] left-[calc(-1*var(--bx,0px))] top-[calc(-1*var(--by,0px))] z-10"
      style={{
        width: 'calc(181px + var(--bx, 0px))',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,.06)',
        ...frosted('blur(44px) saturate(1.1) brightness(.85)', 0.5),
      }}
    >
      <div className="absolute right-[62px] top-[calc(46px+var(--by,0px))]">
        <Wordmark size={22} />
      </div>
      <nav className="absolute right-[101px] top-[calc(334px+var(--by,0px))] flex flex-col items-center gap-[22px]">
        <span className="grid h-[36px] w-[36px] place-items-center rounded-[9px] bg-white text-[#141416]">
          <WorldIcon className="h-[17px] w-[17px]" />
        </span>
        <TeamIcon className="h-[17px] w-[17px] text-white/60" />
        <BriefcaseIcon className="h-[17px] w-[17px] text-white/60" />
      </nav>
    </aside>
  );
}

function LevelBadge() {
  return (
    <span
      className="absolute right-[32px] top-[33px] flex h-[37px] items-center gap-[10px] rounded-full pl-[8px] pr-[14px] text-[12px] text-white"
      style={frosted('blur(14px)', 0.6)}
    >
      <span className="grid h-[20px] w-[20px] place-items-center rounded-full text-[9px] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.6)]">
        1
      </span>
      <span className="flex flex-col">
        Level 1
        <i className="mt-[2px] h-[2px] w-[36px] rounded-full bg-white/25" />
      </span>
    </span>
  );
}

export default function FirstScenario() {
  return (
    <WorldMap>
      <Sidebar />
      <LevelBadge />
      <Link
        to="/workspace"
        aria-label="Open your first scenario"
        className="absolute left-[847px] top-[453px] h-[168px] w-[166px] rounded-[24px] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.85)] transition hover:bg-white/10"
      />
      <TurnHint className="pointer-events-none absolute left-[928px] top-[402px] -translate-x-1/2" />
      <GuideCursor x={922} y={485} />
    </WorldMap>
  );
}
