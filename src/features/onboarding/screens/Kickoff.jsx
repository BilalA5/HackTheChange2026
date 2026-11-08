import { IMG, caseStudy, guide } from '../content.js';
import { useTour } from '../tour.js';
import { Avatar } from '../components/brand.jsx';
import { TurnHint } from '../components/hints.jsx';
import Player from '../components/Player.jsx';

export default function Kickoff() {
  const { next } = useTour();

  return (
    <Player
      step="kickoff"
      turn={
        <>
          Click <span className="text-tx">Join Now</span>
        </>
      }
    >
      <img
        src={`${IMG}/city.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-[28px] brightness-[.55]"
      />
      <div className="absolute left-[370px] top-[125px] flex h-[441px] w-[668px] flex-col items-center rounded-[26px] bg-white text-[#141416] shadow-[0_40px_100px_-30px_rgba(0,0,0,.8)]">
        <div className="mt-[59px] font-mono text-[11px] tracking-[.22em] text-[#8A8A90]">PROJECT KICKOFF</div>
        <h1 className="mb-0 mt-[20px] font-serif text-[36px] font-normal tracking-[-0.02em]">{caseStudy.title}</h1>
        <Avatar size={60} ring={false} className="mt-[42px] shadow-[0_0_0_3px_#fff,0_0_0_4px_rgba(0,0,0,.08)]" />
        <div className="mt-3 text-[14px] font-medium">{guide.name}</div>
        <div className="mt-[2px] text-[13px] text-[#8A8A90]">{guide.role}</div>
        <div className="relative mt-[48px]">
          <span className="absolute -inset-[6px] rounded-full shadow-[0_0_0_1.5px_rgba(20,20,22,.55)]" />
          <button
            type="button"
            onClick={next}
            className="relative h-[46px] rounded-full px-[42px] text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,.16),inset_0_-3px_0_rgba(0,0,0,.5),0_0_0_1px_#121413,0_14px_24px_-14px_rgba(18,20,19,.5)]"
            style={{ background: 'linear-gradient(#303432,#181A19)' }}
          >
            Join Now
          </button>
        </div>
        <TurnHint className="mt-[12px]" />
      </div>
    </Player>
  );
}
