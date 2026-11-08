import { caseStudy } from '../content.js';
import { PlayIcon } from './icons.jsx';

const lineWidths = Array.from({ length: 9 }, (_, i) => `${70 + ((i * 13) % 30)}%`);

export default function ProjectVideo({ className = '', playable = false }) {
  return (
    <div className={`relative overflow-hidden rounded-[8px] bg-black ${className}`}>
      <div className="absolute inset-y-[6%] left-[22%] right-[16%] bg-white px-[7%] pt-[5%]">
        <div className="text-[5px] font-bold uppercase text-[#E0565B]">{caseStudy.company}</div>
        <div className="mt-[3px] font-serif text-[6px] font-semibold">{caseStudy.titleAt}</div>
        {lineWidths.map((width, i) => (
          <i key={i} className="mt-[3px] block h-[2px] rounded bg-[#d6d6d6]" style={{ width }} />
        ))}
      </div>
      {playable && (
        <span className="absolute left-1/2 top-1/2 grid h-[36px] w-[36px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#141416]">
          <PlayIcon className="h-3 w-3" />
        </span>
      )}
      <span className="absolute bottom-[6px] right-[6px] rounded-[5px] bg-black/75 px-[5px] py-[2px] text-[10.5px] text-white">
        10:06
      </span>
    </div>
  );
}
