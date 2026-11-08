import { useEffect, useState } from 'react';
import { guide, lines } from '../content.js';
import { useTour } from '../tour.js';
import { Avatar } from '../components/brand.jsx';
import { GuideCursor } from '../components/hints.jsx';
import { BrainIcon, CaretDownIcon, MicIcon, PauseIcon, PlayIcon } from '../components/icons.jsx';
import Player from '../components/Player.jsx';

const HOLD_TO_ANSWER_MS = 900;

const WAVEFORM = Array.from(
  { length: 38 },
  (_, i) => 4 + Math.round(Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 16),
);

const sayBack = [
  { text: 'Host cancellations', key: true },
  { text: ' are at ' },
  { text: '14 percent', key: true },
  { text: ' and cost us ' },
  { text: '3 million dollars', key: true },
  { text: ' a year. We need to get them down to ' },
  { text: '10 percent', key: true },
  { text: '.' },
];

function MonoLabel({ children, className = '' }) {
  return <div className={`font-mono text-[10px] uppercase tracking-[.16em] ${className}`}>{children}</div>;
}

function VoiceNote({ playing = false, time }) {
  return (
    <div className="flex h-[47px] w-[249px] items-center gap-3 rounded-full bg-[#262629] pl-[7px] pr-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1B1B1E] text-tx">
        {playing ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3 w-3" />}
      </span>
      <span className="flex h-5 items-center gap-[2px]">
        {WAVEFORM.map((height, i) => (
          <i key={i} className={`w-[2px] rounded-full ${playing ? 'bg-tx' : 'bg-tx-4'}`} style={{ height }} />
        ))}
      </span>
      <span className="font-mono text-[9px] text-tx-3">{time}</span>
    </div>
  );
}

function TranscriptToggle() {
  return (
    <button type="button" className="mt-[10px] flex items-center gap-[6px] pl-[6px] text-tx-3">
      <CaretDownIcon className="h-[9px] w-[9px]" />
      <MonoLabel className="text-[9px]">Transcript</MonoLabel>
    </button>
  );
}

function useHoldSpace(onHeld) {
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    let timer;
    const down = (event) => {
      if (event.code !== 'Space' || event.repeat) return;
      event.preventDefault();
      setHolding(true);
      timer = setTimeout(onHeld, HOLD_TO_ANSWER_MS);
    };
    const up = (event) => {
      if (event.code !== 'Space') return;
      setHolding(false);
      clearTimeout(timer);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [onHeld]);

  return holding;
}

export default function Understanding() {
  const { next } = useTour();
  const holding = useHoldSpace(next);

  return (
    <Player step="understanding" caption={lines.sayBack} guide={false}>
      <div className="absolute left-1/2 top-[23px] flex h-[34px] -translate-x-1/2 items-center gap-[10px] rounded-full bg-white pl-[14px] pr-[8px] text-[13px] font-medium text-[#141416] shadow-[0_8px_24px_-10px_rgba(0,0,0,.6)]">
        Proof of understanding
        <span className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className="h-1 w-[23px] rounded-full bg-[#DADADC]" />
          ))}
        </span>
        <BrainIcon className="h-5 w-5 text-[#77777E]" />
      </div>

      <div className="absolute left-[510px] top-[80px]">
        <div className="mb-[10px] text-[12px] text-tx-3">
          <b className="font-medium text-tx">{guide.name}</b>&nbsp; Your manager
        </div>
        <VoiceNote time="0:04" />
        <TranscriptToggle />
        <div className="relative mt-[16px]">
          <Avatar size={40} className="!absolute -left-[48px] top-[3px]" />
          <VoiceNote playing time="0:01" />
        </div>
        <TranscriptToggle />
      </div>

      <div className="absolute left-[335px] top-[399px] w-[738px] rounded-[18px] bg-[#262629] px-[22px] pb-[18px] pt-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]">
        <span className="inline-block rounded-[8px] bg-white px-[9px] py-[4px] text-[12px] font-medium text-[#141416]">
          Try saying this
        </span>
        <p className="m-0 mt-[8px] max-w-[622px] text-[21px] leading-[1.45] text-tx">
          {sayBack.map(({ text, key }) =>
            key ? (
              <span key={text} className="mx-[1px] rounded-[6px] bg-[#38383C] px-[4px] py-[1px]">
                {text}
              </span>
            ) : (
              <span key={text}>{text}</span>
            ),
          )}
        </p>
      </div>
      <GuideCursor x={1059} y={404} />

      <div className="absolute left-1/2 top-[557px] flex -translate-x-1/2 flex-col items-center">
        <span
          className={`grid h-[52px] w-[52px] place-items-center rounded-full transition ${
            holding ? 'scale-110 bg-white text-[#141416]' : 'bg-[#232326] text-tx-3'
          }`}
        >
          <MicIcon className="h-[18px] w-[18px]" />
        </span>
        <MonoLabel className="mt-[14px] text-[9px] text-tx-4">
          Hold <span className="text-tx-3">Space</span> to talk
        </MonoLabel>
        <button type="button" onClick={next} className="mt-[8px] text-[11px] text-tx-4 hover:text-tx-2">
          Skip
        </button>
      </div>
    </Player>
  );
}
