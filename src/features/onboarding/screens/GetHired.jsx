import { useState } from 'react';
import { IMG, lines } from '../content.js';
import { jobs } from '../jobs.js';
import AppShell from '../components/AppShell.jsx';
import { FilterIcon, HeartIcon, SortIcon, ThumbIcon } from '../components/icons.jsx';
import Player from '../components/Player.jsx';

const COLUMNS = 'grid grid-cols-[45px_303px_149px_141px_97px_132px_1fr_40px] items-center';
const filters = ['All', 'Liked', 'Applied', 'Connected', 'Archived'];

function FitChip({ fit }) {
  const great = fit === 'great';
  return (
    <span
      className={`inline-flex h-[22px] items-center gap-[5px] rounded-[6px] px-[7px] text-[11px] font-medium ${
        great ? 'bg-[#E9F6EC] text-[#2E9A48]' : 'bg-[#EBF1FC] text-[#3C6FD9]'
      }`}
    >
      <ThumbIcon filled={great} className="h-[11px] w-[11px]" />
      {great ? 'Great fit' : 'Good fit'}
    </span>
  );
}

const Checkbox = () => (
  <span className="pl-[15px]">
    <i className="block h-[16px] w-[16px] rounded-[4px] shadow-[inset_0_0_0_1px_#d4d4d1]" />
  </span>
);

function Toolbar() {
  return (
    <div className="flex h-[44px] items-center gap-[4px] border-b border-[#efefed] px-[8px] text-[11px] text-[#55555b]">
      {filters.map((filter, i) => (
        <span key={filter} className={`rounded-[7px] px-[10px] py-[6px] ${i === 0 ? 'bg-[#F1F1EF] text-[#141416]' : ''}`}>
          {filter}
        </span>
      ))}
      <span className="flex-1" />
      <span className="grid h-[29px] w-[45px] place-items-center rounded-[8px] shadow-[inset_0_0_0_1px_#e3e3e0]">
        <FilterIcon className="h-[13px] w-[18px]" />
      </span>
      <span className="grid h-[29px] w-[30px] place-items-center rounded-[8px] shadow-[inset_0_0_0_1px_#e3e3e0]">
        <SortIcon className="h-[13px] w-[13px]" />
      </span>
    </div>
  );
}

function JobRow({ job, liked, onToggleLike }) {
  return (
    <div className={`${COLUMNS} h-[49.3px] text-[12px]`}>
      <Checkbox />
      <span className="flex min-w-0 items-center gap-[10px]">
        <span className="grid h-[28px] w-[28px] flex-none place-items-center rounded-[7px] shadow-[inset_0_0_0_1px_#ececea]">
          <img src={`${IMG}/co/${job.domain}.png`} alt="" className="h-[16px] w-[16px] object-contain" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12.5px]">{job.title}</span>
          <span className="block text-[10.5px] text-[#77777e]">{job.company}</span>
        </span>
      </span>
      <span>
        <span className="block text-[12.5px]">{job.location}</span>
        {job.mode && <span className="block text-[10.5px] text-[#77777e]">{job.mode}</span>}
      </span>
      <span>
        <FitChip fit={job.fit} />
      </span>
      <span className="text-[11px] text-[#55555b]">{job.pay}</span>
      <span className="text-[11px] text-[#55555b]">{job.posted}</span>
      <span>
        <button
          type="button"
          className="h-[26px] rounded-[7px] px-[10px] text-[12px] shadow-[inset_0_0_0_1px_#dcdcda,0_1px_2px_rgba(0,0,0,.06)]"
        >
          Apply
        </button>
      </span>
      <button
        type="button"
        aria-label={liked ? `Unsave ${job.title}` : `Save ${job.title}`}
        aria-pressed={liked}
        onClick={onToggleLike}
        className={liked ? 'text-[#E0565B]' : 'text-[#77777e]'}
      >
        <HeartIcon filled={liked} className="h-[14px] w-[14px]" />
      </button>
    </div>
  );
}

export default function GetHired() {
  const [liked, setLiked] = useState(() => new Set());

  const toggleLike = (title) =>
    setLiked((current) => {
      const next = new Set(current);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });

  return (
    <Player step="jobs" caption={lines.levelUp}>
      <AppShell tab="Jobs" sound>
        <div className="absolute left-[165px] top-[65px] w-[1054px] overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_#E8E8E6]">
          <Toolbar />
          <div className={`${COLUMNS} h-[42px] text-[10.5px] text-[#55555b]`}>
            <Checkbox />
            <span>Role</span>
            <span>Location</span>
            <span className="text-[#141416]">What we think ↓</span>
            <span>Pay ⇅</span>
            <span>Posted ⇅</span>
            <span>Action</span>
            <span />
          </div>
          {jobs.map((job) => (
            <JobRow
              key={job.title}
              job={job}
              liked={liked.has(job.title)}
              onToggleLike={() => toggleLike(job.title)}
            />
          ))}
        </div>
      </AppShell>
    </Player>
  );
}
