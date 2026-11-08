import { useLayoutEffect, useRef, useState } from 'react';
import { useAppTheme } from '@/shared/useAppTheme.js';
import {
  ChevronDown,
  ChevronLeft,
  DocIcon,
  DownloadIcon,
  LinkIcon,
  PinIcon,
  PlayIcon,
  ResetIcon,
} from './icons.jsx';
import { durations, manager, notes, project, requirements } from './content.js';
import TopBar from './TopBar.jsx';
import './workspace.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Geist+Mono:wght@400;500;600&display=swap';

/* --------------------------------------------------------------- sidebar */

function Requirement({ item, open, onToggle, id }) {
  return (
    <div className="py-[10.5px] first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
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
        id={id}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <ul className="task-list min-h-0 overflow-hidden pl-[2px]">
          {item.steps.map((s, i) => (
            <li
              key={s}
              className={`text-[13.6px] leading-[19.2px] text-[var(--muted)] ${i === 0 ? 'mt-[13px]' : 'mt-[10px]'} ${i === item.steps.length - 1 ? 'mb-[3px]' : ''}`}
            >
              {s}
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

function ResourceRow({ icon, children, onClick, active }) {
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

function Sidebar({ notesOpen, onOpenNotes }) {
  const [open, setOpen] = useState({ 0: true });
  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="h-[54px] shrink-0" />
      <div className="mt-[7px] flex shrink-0 items-center gap-[11px] pl-[3px]">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#3a3a3a] bg-[#252525]">
          <img src="/assets/workspace/shopify-bag.png" alt="" className="h-[24px] w-[24px]" />
        </div>
        <h1 className="text-[15.5px] font-medium leading-[18.5px] text-[#f1f1f1]">
          {project.title}
        </h1>
      </div>

      <div className="mt-[22px] flex min-h-0 flex-1 flex-col rounded-[17px] border border-[var(--line)]">
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-[16px] pt-[15px]">
          <h2 className="text-[19.5px] font-bold leading-[23.5px] tracking-[-0.025em] text-white">
            {project.task}
          </h2>

          <section className="mt-[17px] border-t border-[var(--line)] pt-[19px]">
            <h3 className="eyebrow leading-[14px]">Requirements</h3>
            <div className="mt-[17px] pb-[17px]">
              {requirements.map((item, i) => (
                <Requirement
                  key={item.title}
                  id={`req-${i}`}
                  item={item}
                  open={!!open[i]}
                  onToggle={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
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

/* ------------------------------------------------------------------ chat */

function ManagerBubble({ children, pill }) {
  return (
    <div
      className={`max-w-[394px] self-start border border-[var(--bubble-line)] bg-[var(--bubble)] px-[16px] text-[14.5px] leading-[21px] text-[#f4f4f4] ${pill ? 'rounded-[21px] py-[10px]' : 'rounded-[18px] py-[10px] pb-[11px]'}`}
    >
      {children}
    </div>
  );
}

function Chat() {
  const scroller = useRef(null);
  const writeUp = useRef(null);
  const [duration, setDuration] = useState(null);

  // Open the conversation where the screenshot shows it: write-up card 742px below the top.
  useLayoutEffect(() => {
    const anchor = () => {
      const el = scroller.current;
      const card = writeUp.current;
      if (el && card) el.scrollTop = Math.max(0, card.offsetTop - 742);
    };
    anchor();
    // Web fonts rewrap the bubbles, so anchor again once they have loaded.
    let live = true;
    document.fonts?.ready.then(() => live && anchor());
    return () => {
      live = false;
    };
  }, []);

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-[459px] flex-col xl:translate-x-2" aria-label={`Chat with ${manager.name}`}>
      <header className="flex h-[100px] shrink-0 items-start gap-[12px] pl-[24px] pt-[61px]">
        <img src={manager.photo} alt="" className="h-[35px] w-[35px] rounded-full" />
        <div className="-mt-[1px]">
          <p className="text-[15.5px] font-medium leading-[19px] text-white">{manager.name}</p>
          <p className="text-[12.5px] leading-[19px] text-[#8c8c8c]">{manager.role}</p>
        </div>
      </header>

      <div ref={scroller} className="chat-fade no-scrollbar relative min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col pb-[96px] pt-[34px]">
          <div className="max-w-[300px] self-end rounded-[20px] bg-[#333] px-[15px] py-[9px] text-[14.5px] leading-[21px] text-white">
            How do I decide which products count as sparse?
          </div>

          <div className="mt-[38px]">
            <ManagerBubble>
              <p>
                Sparse is a cutoff you choose. Count how many weeks of sales each product has, then set a minimum
                number of weeks, say 8, and any product with fewer weeks of data gets sparse = True. Pick the
                number yourself and write one sentence in the overview note on why that cutoff makes sense for a
                model to learn from.
              </p>
              <p className="mt-[21px]">What cutoff are you going with, and what is the reason?</p>
            </ManagerBubble>
          </div>

          <div className="mt-[38px] self-end rounded-[20px] bg-[#333] px-[15px] py-[9px] text-[14.5px] leading-[21px] text-white">
            We need to use both Single Price AND Sparse yes?
          </div>

          <div className="mt-[37px] flex flex-col">
            <ManagerBubble>
              <p>
                Yes. Both flags are columns in the table, and each one is its own true or false per product. A
                product can be sparse, single-price, both, or neither.
              </p>
              <p className="mt-[21px]">Which weeks-of-history number are you going to set as the sparse cutoff?</p>
            </ManagerBubble>
          </div>

          <a
            href={project.repo}
            target="_blank"
            rel="noreferrer"
            className="mr-[8px] mt-[45px] flex h-[45px] max-w-[301px] items-center gap-[9px] self-end rounded-[22px] bg-[#292929] pl-[13px] pr-[18px] text-[14.5px] text-[#d4d4d4] hover:bg-[#2f2f2f]"
          >
            <span className="shrink-0 text-[#a9a9a9]">
              <LinkIcon />
            </span>
            <span className="truncate">{project.repo}</span>
          </a>
          <p className="mr-[12px] mt-[13px] self-end text-[14.5px] leading-[20px] text-[#a9a9a9]">Url Sent</p>

          <div className="mt-[51px] flex flex-col">
            <ManagerBubble pill>got your submission, reviewing it now</ManagerBubble>
          </div>

          <p className="mt-[35px] pl-[4px] pr-[2px] text-[14.5px] leading-[21px] text-white">
            before I look at this, tell me what you did and why, and how you got there.
          </p>

          <article
            ref={writeUp}
            className="mt-[23px] rounded-[15px] border border-[var(--raised-line)] border-l-[3px] border-l-[var(--accent)] bg-[var(--raised)] pb-[18px] pl-[16px] pr-[14px] pt-[14px]"
          >
            <h4 className="flex items-center gap-[7px] pl-[7px] font-mono-ui text-[9.5px] font-medium uppercase leading-[16px] tracking-[0.17em] text-[#9a9a9a]">
              <PinIcon />
              Your write-up
            </h4>
            <p className="mt-[10px] font-mono-ui text-[9px] uppercase leading-[14px] tracking-[0.17em] text-[#727272]">
              What I did and why
            </p>
            <p className="mt-[3px] text-[14.5px] leading-[21.3px] tracking-[-0.008em] text-[#ededed]">
              So basically I took your flag categories such as Sparse is based on what we've seen for a given
              selected week and how minimal it is. As well as if we've ONLY ever seen 1 price of something that is a
              single-price flag conditioned to True.
            </p>
          </article>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-[11px] pb-[25px] pl-[2px] pt-[15px]" role="group" aria-label="How long will this take?">
        {durations.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={duration === d}
            onClick={() => setDuration(d)}
            className={`h-[44px] truncate rounded-full border px-[16px] text-[15px] font-semibold transition-colors ${
              duration === d
                ? 'border-[#5d5d5d] bg-[#333] text-white'
                : 'border-[#333] bg-[var(--raised)] text-[#f1f1f1] hover:border-[#444] hover:bg-[#2c2c2c]'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- meeting notes */

function downloadNotes() {
  const md = [`# ${project.title}`, '', '## Meeting notes', '']
    .concat(...notes.map((s) => [`### ${s.heading}`, ...s.items.map((i) => `- ${i}`), '']))
    .join('\n');
  const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'meeting-notes.md' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function NotesDocument() {
  return (
    <div className="rounded-t-[12px] bg-white px-[33px] pb-[96px] pt-[33px] text-[#363636]">
      <div className="flex items-start gap-[29px]">
        <h2 className="min-w-0 flex-1 xl:max-w-[430px] text-[19.5px] font-bold leading-[30px] text-[#151515]">{project.title}</h2>
        <p className="mt-[5px] w-[64px] shrink-0 text-[9.5px] font-bold uppercase leading-[15px] tracking-[0.2em] text-[#8a8a8a]">
          Meeting notes
        </p>
      </div>
      <div className="mt-[11px] h-[2px] bg-[#111]" />
      <h3 className="mt-[4px] text-[29px] font-bold leading-[34px] tracking-[-0.025em] text-[#151515]">Meeting notes</h3>
      {notes.map((s, i) => (
        <section key={s.heading} className={i === 0 ? 'mt-[25px]' : 'mt-[26px]'}>
          <h4 className="text-[10px] font-bold uppercase leading-[14px] tracking-[0.2em] text-[#8a8a8a]">{s.heading}</h4>
          <ul className="doc-list mt-[13px] space-y-[3.3px]">
            {s.items.map((item) => (
              <li key={item} className="text-[13.65px] leading-[21.3px]">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function NotesViewer({ onClose }) {
  const [zoom, setZoom] = useState(100);
  const scroller = useRef(null);
  const change = (d) => setZoom((z) => Math.min(200, Math.max(50, z + d)));
  return (
    <section
      aria-label="Meeting notes"
      className="relative flex h-full min-h-0 flex-col rounded-[25px] border border-[var(--line)] bg-[var(--page)]"
    >
      <header className="flex h-[58px] shrink-0 items-center pl-[26px] pr-[16px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close meeting notes"
          className="flex h-[24px] w-[24px] items-center justify-center rounded-md text-[#a9a9a9] hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="ml-[13px] flex-1 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[#a8a8a8]">
          Meeting notes
        </p>
        <button
          type="button"
          onClick={downloadNotes}
          aria-label="Download meeting notes"
          className="flex h-[24px] w-[24px] items-center justify-center rounded-md text-[#a9a9a9] hover:text-white"
        >
          <DownloadIcon />
        </button>
      </header>

      <div
        ref={scroller}
        className="doc-fade thin-scrollbar mb-[2px] ml-[28px] mr-[7px] mt-[12px] min-h-0 flex-1 overflow-y-auto pr-[27px]"
      >
        <div style={{ zoom: zoom / 100 }}>
          <NotesDocument />
        </div>
      </div>

      <div className="absolute bottom-[14px] left-[14px] right-[13px] flex h-[42px] items-center rounded-[12px] border border-[var(--raised-line)] bg-[var(--raised)] pl-[15px] pr-[10px] shadow-[0_-6px_18px_rgba(0,0,0,0.25)]">
        <span className="flex-1 text-[13.5px] text-[#7b7b7b]">1 / 1</span>
        <div className="flex items-center text-[#b5b5b5]">
          <button type="button" aria-label="Zoom out" onClick={() => change(-10)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-[18px] hover:text-white">
            −
          </button>
          <span className="w-[48px] text-center text-[14px] tabular-nums" aria-live="polite">
            {zoom}%
          </span>
          <button type="button" aria-label="Zoom in" onClick={() => change(10)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-[18px] hover:text-white">
            +
          </button>
          <button
            type="button"
            aria-label="Reset zoom"
            onClick={() => {
              setZoom(100);
              scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="ml-[2px] flex h-[30px] w-[30px] items-center justify-center rounded-md text-[#8f8f8f] hover:text-white"
          >
            <ResetIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- app */

export default function WorkspacePage() {
  useAppTheme('workspace');
  const [notesOpen, setNotesOpen] = useState(true);
  return (
    <div className="relative min-h-full bg-[var(--page)] xl:h-full xl:overflow-hidden">
      <title>Task workspace · Flint</title>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-black" aria-hidden="true" />
      <TopBar />
      <main
        className={`grid gap-y-8 px-4 pb-6 xl:h-full xl:gap-y-0 xl:pb-0 xl:pl-[17px] xl:pr-[14px] ${
          notesOpen ? 'xl:grid-cols-[278px_minmax(0,1fr)_686px]' : 'xl:grid-cols-[278px_minmax(0,1fr)]'
        }`}
      >
        <div className="xl:h-full xl:min-h-0">
          <Sidebar notesOpen={notesOpen} onOpenNotes={() => setNotesOpen(true)} />
        </div>
        <div className="h-[860px] min-h-0 xl:h-full">
          <Chat />
        </div>
        {notesOpen && (
          <div className="h-[760px] min-h-0 xl:h-full xl:pb-[14px] xl:pt-[122px]">
            <NotesViewer onClose={() => setNotesOpen(false)} />
          </div>
        )}
      </main>
    </div>
  );
}
