import { lines } from '../content.js';
import Wordmark from '@/shared/Wordmark.jsx';
import WorldMap from '../components/WorldMap.jsx';

const captionGlass = {
  background: 'rgba(14,14,16,.74)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.08), 0 14px 34px -12px rgba(0,0,0,.6)',
};

export default function YourWorld() {
  return (
    <WorldMap>
      <div className="absolute left-[32px] top-[26px] drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]">
        <Wordmark size={28} />
      </div>
      <p
        className="absolute bottom-[22px] left-1/2 z-10 m-0 max-w-[760px] -translate-x-1/2 rounded-2xl px-[18px] pb-3 pt-[11px] text-center text-[16px] leading-[1.4] tracking-[-0.012em] text-tx"
        style={captionGlass}
      >
        {lines.scenarios}
      </p>
    </WorldMap>
  );
}
