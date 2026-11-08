import { useState } from 'react';
import { lines } from '../content.js';
import { Avatar, WordmarkChip } from '../components/brand.jsx';
import { SoundControls } from '../components/controls.jsx';
import { CameraIcon, CheckIcon, MicIcon, ScreenIcon } from '../components/icons.jsx';

const permissions = [
  { id: 'mic', label: 'Microphone', Icon: MicIcon },
  { id: 'camera', label: 'Camera', Icon: CameraIcon },
  { id: 'screen', label: 'Screen', Icon: ScreenIcon },
];

function PermissionKey({ label, Icon, on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="group flex min-w-[84px] flex-col items-center gap-[14px] text-tx-3"
    >
      <span
        className={`relative grid h-[76px] w-[76px] place-items-center rounded-full transition group-hover:-translate-y-0.5 ${
          on ? 'key-light text-onink' : 'key-dark text-tx'
        }`}
      >
        <Icon className="h-[27px] w-[27px]" />
        {on && (
          <i className="absolute -right-[3px] -top-[3px] grid h-6 w-6 place-items-center rounded-full bg-onink text-tx shadow-[0_0_0_2px_#0E0E10]">
            <CheckIcon className="h-3 w-3" />
          </i>
        )}
      </span>
      <b className={`text-[12.5px] font-normal ${on ? 'text-tx' : ''}`}>{label}</b>
    </button>
  );
}

export default function WelcomeBack() {
  const [enabled, setEnabled] = useState(() => new Set());

  const toggle = (id) =>
    setEnabled((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-page">
      <WordmarkChip />
      <Avatar size={64} className="mt-[238px]" />
      <p className="mb-0 mt-[30px] min-h-[78px] max-w-[660px] text-center font-serif text-[34px] font-normal leading-[1.14] tracking-[-0.03em] text-tx [text-wrap:balance]">
        {lines.permissions}
      </p>
      <div className="mt-[46px] flex gap-[44px]">
        {permissions.map(({ id, label, Icon }) => (
          <PermissionKey key={id} label={label} Icon={Icon} on={enabled.has(id)} onToggle={() => toggle(id)} />
        ))}
      </div>
      <SoundControls />
    </div>
  );
}
