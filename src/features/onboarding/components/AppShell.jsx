import { learner } from '../content.js';
import Wordmark from '@/shared/Wordmark.jsx';
import { Avatar } from './brand.jsx';
import { SoundIcon } from './icons.jsx';

const tabs = ['For you', 'Jobs', 'Inbox', 'Portfolio'];

export default function AppShell({ tab, sound = false, children }) {
  return (
    <div className="absolute left-[12px] top-[12px] h-[667px] w-[1383px] overflow-hidden rounded-[16px] bg-white text-[#141416]">
      <header className="relative flex h-[54px] items-center px-[23px]">
        <Wordmark size={16} tone="dark" />
        <div className="ml-[28px] flex h-[30px] items-center rounded-full bg-[#F1F1EF] p-[3px] text-[11.5px]">
          <span className="px-[10px] text-[#55555b]">Learn</span>
          <span className="rounded-full bg-white px-[10px] py-[4px] shadow-[0_1px_2px_rgba(0,0,0,.1)]">Jobs</span>
        </div>
        <nav className="absolute left-1/2 flex h-[32px] -translate-x-1/2 items-center rounded-full bg-[#F1F1EF] p-[3px] text-[13px]">
          {tabs.map((name) => (
            <span
              key={name}
              aria-current={name === tab ? 'page' : undefined}
              className={`rounded-full px-[12px] py-[5px] ${
                name === tab ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,.1)]' : 'text-[#6b6b70]'
              }`}
            >
              {name}
            </span>
          ))}
        </nav>
        <span className="flex-1" />
        {sound && <SoundIcon className="mr-[24px] h-[15px] w-[15px] text-[#6b6b70]" />}
        <span className="mr-[12px] text-[13px]">{learner.firstName}</span>
        <Avatar src={learner.photo} size={26} ring={false} />
      </header>
      {children}
    </div>
  );
}
