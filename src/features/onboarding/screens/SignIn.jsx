import { useState } from 'react';
import { IMG } from '../content.js';
import { useTour } from '../tour.js';
import { Wordmark } from '../components/brand.jsx';
import { SoundControls } from '../components/controls.jsx';
import { CheckIcon, GoogleIcon } from '../components/icons.jsx';

const clouds = [
  { left: 60, top: 150, width: 640, opacity: 0.9 },
  { left: 1020, top: 300, width: 420, opacity: 0.5 },
  { left: 560, top: 600, width: 520, opacity: 0.7 },
];

const vignette =
  'radial-gradient(52% 62% at 82% 80%,rgba(8,10,14,.66),rgba(8,10,14,0) 74%),linear-gradient(180deg,rgba(8,10,14,0) 52%,rgba(8,10,14,.42))';

export default function SignIn() {
  const { next } = useTour();
  const [agreed, setAgreed] = useState(true);

  return (
    <div className="absolute inset-0">
      <div
        className="bleed overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#22364a,#16222f 60%,#101820)' }}
      >
        <img
          src={`${IMG}/si-city.webp`}
          alt="Aerial view of Flint's city of company buildings"
          className="animate-drift absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: vignette }} />
      </div>
      {clouds.map((cloud) => (
        <img
          key={cloud.left}
          src={`${IMG}/cloud.webp`}
          alt=""
          className="pointer-events-none absolute"
          style={{ left: cloud.left, top: cloud.top, width: cloud.width, opacity: cloud.opacity }}
        />
      ))}
      <div className="absolute left-[34px] top-[30px] drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]">
        <Wordmark size={26} />
      </div>

      <div className="glass-dark animate-rise absolute bottom-[60px] right-[64px] flex w-[480px] flex-col gap-[26px] rounded-[32px] px-[38px] py-10">
        <h1 className="m-0 font-serif text-[34px] font-normal leading-[1.14] tracking-[-0.02em] text-white [text-wrap:balance]">
          Education, designed for an AI-native future.
        </h1>
        <label className="flex cursor-pointer items-start gap-3 text-[14.5px] leading-[1.5] text-white/75">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`mt-[2px] grid h-[18px] w-[18px] flex-none place-items-center rounded-[6px] transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-white ${
              agreed ? 'bg-white text-[#0b0d11]' : 'bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,.3)]'
            }`}
          >
            {agreed && <CheckIcon className="h-3 w-3" />}
          </span>
          <span>I'm ready to learn the job by doing it.</span>
        </label>
        <button
          type="button"
          onClick={next}
          disabled={!agreed}
          className="flex h-[58px] w-full items-center justify-center gap-3 rounded-full bg-white text-[16.5px] font-medium tracking-[-0.01em] text-[#14110f] shadow-[0_12px_30px_-12px_rgba(0,0,0,.6)] transition hover:scale-[1.02] active:scale-[.99] disabled:opacity-60"
        >
          <GoogleIcon className="h-5 w-5" />
          Sign in with Google
        </button>
      </div>
      <SoundControls />
    </div>
  );
}
