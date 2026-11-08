import { IMG, guide, learner, lines } from '../content.js';
import { Avatar } from '../components/brand.jsx';
import { CameraOffIcon, LeaveIcon, MicIcon, ScreenIcon, TimerIcon } from '../components/icons.jsx';
import Player from '../components/Player.jsx';
import FindingsSlide from '../components/scenario/FindingsSlide.jsx';

const panel = [
  { name: guide.name, note: 'On your panel', photo: guide.wide, ring: 'shadow-[0_0_0_3px_rgba(255,255,255,.85)]' },
  {
    name: 'Avery Kim',
    note: 'Engineering Manager',
    photo: `${IMG}/cast-avery.jpg`,
    ring: 'shadow-[0_0_0_2px_#6E9BF2]',
  },
  { name: 'Jordan Lee', note: 'Product Lead', photo: `${IMG}/cast-jordan.jpg` },
];

function CallHeader() {
  return (
    <div className="absolute left-[18px] top-[17px] flex h-[53px] w-[1373px] items-center gap-[12px] rounded-[12px] bg-[#262629] px-[15px]">
      <span className="flex h-[29px] items-center gap-[6px] rounded-[7px] bg-[#38383C] px-[10px] font-mono text-[11px] text-tx">
        <TimerIcon className="h-[11px] w-[11px]" />
        4:58
      </span>
      <span className="text-[13px] font-medium text-tx">Final presentation · Host cancellations</span>
      <span className="flex-1" />
      <span className="flex h-[28px] items-center gap-[8px] rounded-full bg-[#323236] px-[12px] text-[11.5px] text-tx-2">
        <ScreenIcon className="h-[13px] w-[13px]" />
        You are sharing
      </span>
      <button
        type="button"
        aria-label="Leave call"
        className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-[#EC4B3F] text-white"
      >
        <LeaveIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function CallControls() {
  return (
    <div className="absolute left-[489px] top-[609px] flex gap-[7px]">
      <button
        type="button"
        aria-label="Microphone"
        className="grid h-[50px] w-[50px] place-items-center rounded-full bg-white text-[#141416]"
      >
        <MicIcon className="h-[17px] w-[17px]" />
      </button>
      <button
        type="button"
        aria-label="Camera off"
        className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#F5D6D4] text-[#D9483B]"
      >
        <CameraOffIcon className="h-[17px] w-[17px]" />
      </button>
      <button
        type="button"
        aria-label="Share screen"
        className="grid h-[50px] w-[50px] place-items-center rounded-full bg-white text-[#141416]"
      >
        <ScreenIcon className="h-[17px] w-[17px]" />
      </button>
    </div>
  );
}

function Panel() {
  return (
    <div className="absolute left-[1144px] top-[83px] flex w-[247px] flex-col gap-[12px]">
      {panel.map((member) => (
        <div key={member.name} className={`relative h-[135px] overflow-hidden rounded-[10px] ${member.ring ?? ''}`}>
          <img src={member.photo} alt={member.name} className="h-full w-full object-cover object-top" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-[14px] pb-[9px] pt-[24px] text-[12px] text-white">
            <b className="text-[13.5px] font-semibold">{member.name}</b>&nbsp;{' '}
            <span className="text-white/80">{member.note}</span>
          </div>
        </div>
      ))}
      <div className="relative grid h-[135px] place-items-center rounded-[10px] bg-[#262629] shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]">
        <Avatar src={learner.photo} size={54} ring={false} className="-mt-3 shadow-[0_0_0_2px_#fff]" />
        <span className="absolute bottom-[10px] left-[14px] text-[12.5px] font-semibold text-tx">You</span>
      </div>
    </div>
  );
}

export default function Presentation() {
  return (
    <Player step="presentation" guide={false} caption={lines.present}>
      <CallHeader />
      <FindingsSlide />
      <CallControls />
      <Panel />
      <span className="absolute left-[1017px] top-[248px] rounded-[14px] bg-white px-[14px] py-[9px] text-[14.5px] font-semibold text-[#141416] shadow-[0_10px_24px_-10px_rgba(0,0,0,.6)]">
        What would the fix cost?
      </span>
    </Player>
  );
}
