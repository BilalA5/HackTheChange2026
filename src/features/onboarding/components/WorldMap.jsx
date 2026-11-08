import { IMG, guide } from '../content.js';
import { Avatar } from './brand.jsx';
import { SoundControls } from './controls.jsx';
import { LockIcon } from './icons.jsx';

const lockedScenarios = [
  { company: 'DoorDash', logo: 'sc-logo-doordash.svg', note: 'After 1 scenario', label: [900, 130], lock: [903, 220] },
  { company: 'Netflix', logo: 'sc-logo-netflix.svg', note: 'After 2 scenarios', label: [1052, 220], lock: [1048, 350] },
  { company: 'Spotify', logo: 'logo-spotify.svg', note: 'After 4 scenarios', label: [1097, 535], lock: [1060, 500] },
];

const at = ([left, top]) => ({ left, top });

function LockedScenario({ company, logo, note, label, lock }) {
  return (
    <>
      <span
        className="absolute flex h-[32px] -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#141416]/80 pl-[10px] pr-[14px] text-[14px] text-white/70 backdrop-blur-md"
        style={at(label)}
      >
        <img src={`${IMG}/${logo}`} alt="" className="h-4 w-4 brightness-0 invert" />
        <b className="font-medium text-white">{company}</b>
        {note}
      </span>
      <span
        className="absolute grid h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#141416]/85 text-white shadow-[0_0_0_1px_rgba(255,255,255,.15)]"
        style={at(lock)}
      >
        <LockIcon className="h-3 w-3" strokeWidth={2.2} />
      </span>
    </>
  );
}

function ReadyScenario() {
  return (
    <>
      <span className="absolute left-[938px] top-[560px] grid h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 backdrop-blur">
        <i className="h-[10px] w-[10px] rounded-full bg-white shadow-[0_0_0_3px_rgba(20,20,22,.6)]" />
      </span>
      <span className="absolute left-[938px] top-[600px] flex h-[32px] -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white pl-[10px] pr-[14px] text-[14px] text-[#141416] shadow-[0_8px_20px_-8px_rgba(0,0,0,.5)]">
        <img src={`${IMG}/sc-logo-airbnb.svg`} alt="" className="h-4 w-4" />
        <b className="font-medium">Airbnb</b>
        <span className="flex items-center gap-[6px] text-spark-deep">
          <i className="h-[6px] w-[6px] rounded-full bg-spark" />
          Ready
        </span>
      </span>
    </>
  );
}

export default function WorldMap({ children }) {
  return (
    <div className="absolute inset-0">
      <div className="bleed overflow-hidden bg-page">
        <img
          src={`${IMG}/city.jpg`}
          alt="Your world: a city of company headquarters"
          className="animate-drift absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0)_60%,rgba(8,10,14,.45))]" />
      </div>
      {lockedScenarios.map((scenario) => (
        <LockedScenario key={scenario.company} {...scenario} />
      ))}
      <ReadyScenario />
      {children}
      <div className="absolute bottom-[20px] left-[24px] z-20 flex items-center gap-3">
        <Avatar size={52} />
        <div className="leading-tight">
          <div className="text-[14px] font-medium text-white">{guide.name}</div>
          <div className="text-[13px] text-white/60">{guide.title}</div>
        </div>
      </div>
      <SoundControls />
    </div>
  );
}
