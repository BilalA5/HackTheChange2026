import { play } from '@/shared/sound.js';
import { ChevronRightIcon } from './icons.jsx';

export function ContinueButton({ label = 'Continue', onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => {
        play('whoosh');
        onClick();
      }}
      disabled={disabled}
      className="key-light absolute bottom-[20px] right-[22px] z-30 flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[14px] font-medium text-onink transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
      <ChevronRightIcon className="h-4 w-4" />
    </button>
  );
}
