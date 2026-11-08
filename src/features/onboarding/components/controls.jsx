import { PauseIcon, SoundIcon } from './icons.jsx';

export function RoundButton({ label, onClick, className = '', children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid h-11 w-11 place-items-center rounded-full bg-field text-tx shadow-[inset_0_1px_0_rgba(255,255,255,.05)] transition hover:bg-[#2C2C31] ${className}`}
    >
      {children}
    </button>
  );
}

export function SoundControls() {
  return (
    <div className="absolute bottom-[20px] right-[22px] z-30 flex gap-2">
      <RoundButton label="Pause">
        <PauseIcon className="h-4 w-4" />
      </RoundButton>
      <RoundButton label="Sound">
        <SoundIcon className="h-[17px] w-[17px]" />
      </RoundButton>
    </div>
  );
}
