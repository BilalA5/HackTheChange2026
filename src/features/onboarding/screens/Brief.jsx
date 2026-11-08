import { useRef, useState } from 'react';
import { IMG, caseStudy, guide, lines } from '../content.js';
import { useTour } from '../tour.js';
import { Avatar } from '../components/brand.jsx';
import { BriefcaseIcon, PlayIcon } from '../components/icons.jsx';
import Player from '../components/Player.jsx';

const tabs = [
  { label: 'Overview', target: 'brief-overview' },
  { label: "What you'll cover", target: 'brief-cover' },
  { label: 'Stages', target: 'brief-stages' },
  { label: 'Deliverables', target: 'brief-deliverables' },
];

const sheetGlass = {
  background: 'rgba(22,22,25,.86)',
  backdropFilter: 'blur(30px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(30px) saturate(1.2)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08), 0 40px 90px -30px rgba(0,0,0,.8)',
};

function Section({ title, children }) {
  return (
    <div className="mt-[30px] first:mt-0">
      <div className="mb-[14px] text-[13px] text-tx-3">{title}</div>
      {children}
    </div>
  );
}

function Fact({ label, value, icon, light = false }) {
  return (
    <div className="flex items-center gap-[14px]">
      <span
        className={`grid h-8 w-8 flex-none place-items-center overflow-hidden rounded-[9px] ${
          light ? 'bg-white' : 'shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)]'
        }`}
      >
        {icon}
      </span>
      <div>
        <dt className="text-[12.5px] text-tx-2">{label}</dt>
        <dd className="m-0 mt-[3px] text-[12.5px] text-tx">{value}</dd>
      </div>
    </div>
  );
}

function Coverage() {
  return (
    <>
      <h2 id="brief-cover" className="mb-[26px] mt-[44px] text-[15px] font-medium text-tx">
        What you'll cover
      </h2>
      <Section title="Tool stack">
        <div className="flex gap-8">
          {caseStudy.tools.map((tool) => (
            <span key={tool.name} className="flex items-center gap-[11px] text-[13px] text-tx">
              <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-white">
                <img src={tool.icon} alt="" className="h-[15px] w-[15px]" />
              </span>
              {tool.name}
            </span>
          ))}
        </div>
      </Section>
      <Section title="Workflows you'll learn">
        <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
          {caseStudy.workflows.map((workflow) => (
            <li key={workflow} className="flex items-center gap-3 pl-[4px] text-[13px] text-tx">
              <i className="h-[3px] w-[3px] rounded-full bg-tx-2" />
              {workflow}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Skills and concepts you'll cover">
        <div className="flex flex-wrap gap-[9px]">
          {caseStudy.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full px-[13px] py-[8px] text-[13px] text-tx shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)]"
            >
              {skill}
            </span>
          ))}
        </div>
      </Section>
    </>
  );
}

function Stages() {
  return (
    <div id="brief-stages" className="mt-[42px] border-t border-white/[.09] pt-[42px]">
      <div className="mb-[22px] flex justify-between">
        <h3 className="m-0 text-[15px] font-medium text-tx">Stages</h3>
        <span className="text-[13px] text-tx-2">Estimated Time</span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-[16px] p-0">
        {caseStudy.stages.map((stage, i) => (
          <li key={stage.title} className="flex items-center gap-[14px] text-[13px] text-tx">
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full text-[11px] text-tx-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,.18)]">
              {i + 1}
            </span>
            <span className="flex-1">{stage.title}</span>
            <span className="text-tx-2">{stage.time}</span>
          </li>
        ))}
      </ol>
      <div className="mt-[18px] flex justify-between rounded-[10px] py-[9px] pl-[36px] pr-[12px] text-[13px] text-tx shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.9)]">
        <span>Total Estimated Time</span>
        <span>{caseStudy.totalTime}</span>
      </div>
    </div>
  );
}

function Deliverables() {
  return (
    <div id="brief-deliverables" className="mt-[34px] border-t border-white/[.09] pt-[34px]">
      <h3 className="m-0 mb-[18px] text-[15px] font-medium text-tx">Deliverables</h3>
      {caseStudy.deliverables.map((deliverable) => (
        <div key={deliverable.title} className="flex items-center gap-[14px]">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[8px] text-[9px] font-semibold text-tx-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,.16)]">
            PDF
          </span>
          <div>
            <div className="text-[13px] text-tx">{deliverable.title}</div>
            <div className="mt-[3px] text-[12px] text-tx-3">{deliverable.kind}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScenarioCard({ onStart }) {
  return (
    <div className="flex w-[404px] flex-col items-center border-l border-white/[.07] px-[44px] pt-[52px]">
      <img src={`${IMG}/airbnb-art.webp`} alt="Cancel Crisis" className="w-[310px]" />
      <h1 className="mb-0 mt-[26px] max-w-[280px] text-center text-[20px] font-normal leading-[1.35] text-tx">
        {caseStudy.titleAt}
      </h1>
      <dl className="mb-0 mt-[30px] flex w-full flex-col gap-[30px] rounded-[18px] px-5 py-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,.12),0_0_0_4px_rgba(255,255,255,.03)]">
        <Fact
          label="Company"
          value={caseStudy.company}
          icon={<img src={`${IMG}/logo-airbnb.svg`} alt="" className="h-[18px] w-[18px]" />}
          light
        />
        <Fact label="Manager" value={guide.name} icon={<Avatar size={32} ring={false} />} />
        <Fact label="Project type" value={caseStudy.category} icon={<BriefcaseIcon className="h-4 w-4 text-tx-2" />} />
      </dl>
      <button
        type="button"
        onClick={onStart}
        className="key-light mt-[34px] flex h-[62px] w-full items-center justify-center gap-[12px] rounded-full text-[20px] font-medium text-onink transition hover:-translate-y-0.5"
      >
        <PlayIcon className="h-3.5 w-3.5" />
        Start
      </button>
    </div>
  );
}

export default function Brief() {
  const { next } = useTour();
  const [activeTab, setActiveTab] = useState(1);
  const scroller = useRef(null);

  const jumpTo = (index) => {
    setActiveTab(index);
    const section = scroller.current?.querySelector(`#${tabs[index].target}`);
    if (section) scroller.current.scrollTo({ top: index === 0 ? 0 : section.offsetTop - 120, behavior: 'smooth' });
  };

  return (
    <Player step="brief" caption={lines.tools}>
      <img src={`${IMG}/city.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover brightness-[.8]" />
      <div
        className="absolute left-[132px] top-[22px] flex h-[648px] w-[1144px] overflow-hidden rounded-[28px]"
        style={sheetGlass}
      >
        <div
          ref={scroller}
          className="relative w-[740px] overflow-y-auto px-[57px] pb-16 pt-[48px] [scrollbar-width:none]"
        >
          <nav
            id="brief-overview"
            className="sticky top-[-48px] z-10 -mx-[57px] -mt-[48px] flex gap-1 px-[57px] pb-2 pt-[48px]"
            style={{ background: 'rgba(22,22,25,.94)' }}
          >
            {tabs.map((tab, i) => (
              <button
                key={tab.target}
                type="button"
                onClick={() => jumpTo(i)}
                aria-current={i === activeTab}
                className={`h-[34px] rounded-full px-3 text-[13px] transition ${
                  i === activeTab ? 'text-tx shadow-[inset_0_0_0_1px_rgba(255,255,255,.16)]' : 'text-tx-2 hover:text-tx'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <Coverage />
          <Stages />
          <Deliverables />
        </div>
        <ScenarioCard onStart={next} />
      </div>
    </Player>
  );
}
