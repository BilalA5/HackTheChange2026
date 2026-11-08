import { Fragment, useState } from 'react';
import { caseStudy, learner, lines } from '../content.js';
import AppShell from '../components/AppShell.jsx';
import { CheckIcon, PencilIcon, PinIcon, ShareIcon } from '../components/icons.jsx';
import Player from '../components/Player.jsx';
import ProjectVideo from '../components/ProjectVideo.jsx';

const tabs = ['Projects', 'Tools', 'Experience', 'Education', 'Achievements', 'Languages', 'Recommendations'];
const profileLinks = ['Résumé', 'Website', 'GitHub'];

function ProfileCard() {
  return (
    <div className="absolute left-[349px] top-[74px] w-[686px] overflow-hidden rounded-[16px] shadow-[inset_0_0_0_1px_#E8E8E6]">
      <div className="h-[70px] bg-gradient-to-r from-[#F2F2F2] via-[#7c7c7c] to-black" />
      <span className="absolute right-[22px] top-[17px] grid h-[36px] w-[36px] place-items-center rounded-full bg-[#5c5c5c] text-[14px] font-semibold text-white shadow-[inset_0_0_0_2px_#9a9a9a]">
        1
      </span>
      <div className="absolute left-[24px] top-[22px] h-[100px] w-[100px] rounded-full bg-white p-[3px] shadow-[0_0_0_2.5px_#49BA61]">
        <img src={learner.photo} alt={learner.name} className="h-full w-full rounded-full object-cover grayscale" />
      </div>
      <div className="flex gap-[28px] px-[24px] pb-[30px] pt-[78px]">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-normal">{learner.name}</h1>
          <div className="mt-[6px] text-[13px]">{learner.role}</div>
          <div className="mt-[9px] flex items-center gap-[6px] text-[11.5px] text-[#55555b]">
            <PinIcon className="h-[11px] w-[11px]" />
            Dubai
          </div>
          <p className="m-0 mt-[13px] text-[11.5px] leading-[1.45] text-[#3b3b40]">
            I design the parts of a product people touch every day. On Flint I take real briefs from real companies and
            show my thinking at every step.
          </p>
          <div className="mt-[8px] text-[11.5px] text-[#55555b]">See more</div>
          <div className="mt-[19px] flex items-center gap-[11px] text-[11.5px]">
            {profileLinks.map((label, i) => (
              <Fragment key={label}>
                {i > 0 && <i className="h-[14px] w-px bg-[#e3e3e0]" />}
                <span className="flex items-center gap-[6px]">
                  <i className="h-[10px] w-[10px] rounded-[2px] bg-[#141416]/80" />
                  {label}
                </span>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="w-[205px]">
          <div className="-mt-[46px] mb-[18px] flex justify-end gap-[6px]">
            <button
              type="button"
              className="flex h-[25px] items-center gap-[5px] rounded-[7px] px-[9px] text-[11px] shadow-[inset_0_0_0_1px_#dcdcda]"
            >
              <PencilIcon className="h-[11px] w-[11px]" />
              Edit profile
            </button>
            <button
              type="button"
              className="flex h-[25px] items-center gap-[5px] rounded-[7px] bg-[#141416] px-[9px] text-[11px] text-white"
            >
              <ShareIcon className="h-[11px] w-[11px]" />
              Share
            </button>
          </div>
          <ProjectVideo className="h-[116px] w-[205px] shadow-[0_0_0_1px_#e3e3e0]" />
          <div className="mt-[10px] text-[11px] text-[#77777e]">Featured project</div>
          <div className="mt-[4px] text-[11.5px]">{caseStudy.titleAt}</div>
        </div>
      </div>
    </div>
  );
}

function ProjectRow() {
  return (
    <div className="absolute left-[349px] top-[554px] flex w-[686px] gap-[25px]">
      <div className="h-[130px] w-[211px] overflow-hidden rounded-[10px] bg-[#F1F1EF] p-[8px]">
        <ProjectVideo playable className="h-[122px] w-full" />
      </div>
      <div className="pt-[14px]">
        <div className="flex items-center gap-[6px] text-[13px] font-medium">
          {caseStudy.titleAt}
          <span className="grid h-[13px] w-[13px] place-items-center rounded-full bg-spark-deep text-white">
            <CheckIcon className="h-[8px] w-[8px]" />
          </span>
        </div>
        <p className="m-0 mt-[9px] max-w-[440px] text-[11.5px] leading-[1.45] text-[#55555b]">
          Found that calendar conflicts cause 46% of host cancellations, priced the problem at $3 million a year, and
          proposed a fix that brings cancellations from 14% down to 10%.
        </p>
        <div className="mt-[22px] flex gap-[20px] text-[11px] text-[#55555b]">
          {caseStudy.tools.map((tool) => (
            <span key={tool.name} className="flex items-center gap-[6px]">
              <img src={tool.icon} alt="" className="h-[12px] w-[12px]" />
              {tool.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState('Projects');

  return (
    <Player step="portfolio" caption={lines.portfolio}>
      <AppShell tab="Portfolio">
        <ProfileCard />
        <nav className="absolute left-[349px] top-[444px] flex w-[686px] gap-[25px] border-b border-[#ececea] text-[11.5px]">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-current={tab === activeTab}
              className={`-mb-px px-[10px] pb-[11px] ${
                tab === activeTab ? 'border-b-2 border-[#141416] font-medium' : 'text-[#55555b]'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <h2 className="absolute left-[349px] top-[502px] m-0 text-[14.5px] font-normal">Projects</h2>
        <ProjectRow />
      </AppShell>
    </Player>
  );
}
