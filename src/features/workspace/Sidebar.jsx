import { useId, useState } from 'react';
import { project, requirements } from './content.js';
import { ChevronDown, DocIcon, PlayIcon } from './icons.jsx';

function Requirement({ item, open, onToggle }) {
  const panelId = useId();
  const lastStep = item.steps.length - 1;
  return (
    <div className="py-[10.5px] first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="group flex w-full items-start justify-between gap-3 pl-[2px] text-left"
      >
        <span className="max-w-[212px] text-[14.5px] font-medium leading-[19.2px] tracking-[-0.005em] text-[#f3f3f3] group-hover:text-white">
          {item.title}
        </span>
        <span className="mr-[3px] mt-[3px] text-[#8b8b8b] group-hover:text-[#cfcfcf]">
          <ChevronDown open={open} />
        </span>
      </button>
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <ul className="task-list min-h-0 overflow-hidden pl-[2px]">
          {item.steps.map((step, i) => (
            <li
              key={step}
              className={`text-[13.6px] leading-[19.2px] text-[var(--muted)] ${i === 0 ? 'mt-[13px]' : 'mt-[10px]'} ${i === lastStep ? 'mb-[3px]' : ''}`}
            >
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResourceSection({ label, children }) {
  return (
    <section className="border-t border-[var(--line)] pb-[24px] pt-[19px]">
      <h3 className="eyebrow leading-[14px]">{label}</h3>
      <div className="mt-[10px]">{children}</div>
    </section>
  );
}

function ResourceRow({ icon, children, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mx-[6px] flex h-[30px] w-[calc(100%+12px)] items-center gap-[10px] rounded-lg pl-[6px] pr-[30px] text-left text-[14px] transition-colors hover:bg-white/[0.04] ${active ? 'text-white' : 'text-[#e6e6e6]'}`}
    >
      <span className="flex w-[19px] shrink-0 justify-center pl-[2px] text-[#8e8e8e]">{icon}</span>
      <span className="truncate">{children}</span>
    </button>
  );
}

export default function Sidebar({ notesOpen, onOpenNotes }) {
  const [openRequirements, setOpenRequirements] = useState(() => new Set([0]));

  const toggle = (index) =>
    setOpenRequirements((current) => {
      const next = new Set(current);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });

  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="h-[54px] shrink-0" />
      <div className="mt-[7px] flex shrink-0 items-center gap-[11px] pl-[3px]">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#3a3a3a] bg-[#252525]">
          <img src="/assets/workspace/shopify-bag.png" alt="" className="h-[24px] w-[24px]" />
        </div>
        <h1 className="text-[15.5px] font-medium leading-[18.5px] text-[#f1f1f1]">{project.title}</h1>
      </div>

      <div className="mt-[22px] flex min-h-0 flex-1 flex-col rounded-[17px] border border-[var(--line)]">
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-[16px] pt-[15px]">
          <h2 className="text-[19.5px] font-bold leading-[23.5px] tracking-[-0.025em] text-white">{project.task}</h2>

          <section className="mt-[17px] border-t border-[var(--line)] pt-[19px]">
            <h3 className="eyebrow leading-[14px]">Requirements</h3>
            <div className="mt-[17px] pb-[17px]">
              {requirements.map((item, i) => (
                <Requirement
                  key={item.title}
                  item={item}
                  open={openRequirements.has(i)}
                  onToggle={() => toggle(i)}
                />
              ))}
            </div>
          </section>

          <ResourceSection label="Project resources">
            <ResourceRow icon={<DocIcon />} onClick={onOpenNotes} active={notesOpen}>
              Meeting notes
            </ResourceRow>
          </ResourceSection>
          <ResourceSection label="Task resources">
            <ResourceRow icon={<DocIcon />}>Pricing Pilot Merchant Feedback</ResourceRow>
          </ResourceSection>
          <ResourceSection label="Shared in chat">
            <ResourceRow icon={<PlayIcon />}>Watch: {project.task}</ResourceRow>
          </ResourceSection>
        </div>
      </div>

      <button
        type="button"
        className="flex h-[84px] shrink-0 items-center gap-[9px] pl-[4px] pr-[4px] text-[#8f8f8f] hover:text-[#cfcfcf]"
      >
        <ChevronDown size={13} />
        <span className="eyebrow flex-1 text-left text-inherit">Workflows</span>
        <span className="font-mono-ui text-[12px] font-medium text-[#a8a5a0]">5</span>
      </button>
    </aside>
  );
}
