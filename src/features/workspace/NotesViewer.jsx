import { useRef, useState } from 'react';
import { notes, project } from './content.js';
import { ChevronLeft, DownloadIcon, ResetIcon } from './icons.jsx';

const ZOOM = { min: 50, max: 200, step: 10, initial: 100 };

const clampZoom = (value) => Math.min(ZOOM.max, Math.max(ZOOM.min, value));

function notesToMarkdown() {
  const sections = notes.flatMap(({ heading, items }) => [`### ${heading}`, ...items.map((item) => `- ${item}`), '']);
  return [`# ${project.title}`, '', '## Meeting notes', '', ...sections].join('\n');
}

function downloadNotes() {
  const url = URL.createObjectURL(new Blob([notesToMarkdown()], { type: 'text/markdown' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'meeting-notes.md' });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function NotesDocument() {
  return (
    <div className="rounded-t-[12px] bg-white px-[33px] pb-[96px] pt-[33px] text-[#363636]">
      <div className="flex items-start gap-[29px]">
        <h2 className="min-w-0 flex-1 text-[19.5px] font-bold leading-[30px] text-[#151515] xl:max-w-[430px]">
          {project.title}
        </h2>
        <p className="mt-[5px] w-[64px] shrink-0 text-[9.5px] font-bold uppercase leading-[15px] tracking-[0.2em] text-[#8a8a8a]">
          Meeting notes
        </p>
      </div>
      <div className="mt-[11px] h-[2px] bg-[#111]" />
      <h3 className="mt-[4px] text-[29px] font-bold leading-[34px] tracking-[-0.025em] text-[#151515]">Meeting notes</h3>
      {notes.map(({ heading, items }, i) => (
        <section key={heading} className={i === 0 ? 'mt-[25px]' : 'mt-[26px]'}>
          <h4 className="text-[10px] font-bold uppercase leading-[14px] tracking-[0.2em] text-[#8a8a8a]">{heading}</h4>
          <ul className="doc-list mt-[13px] space-y-[3.3px]">
            {items.map((item) => (
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

function ToolbarButton({ label, onClick, className = '', children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center rounded-md hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}

export default function NotesViewer({ onClose }) {
  const [zoom, setZoom] = useState(ZOOM.initial);
  const scroller = useRef(null);

  const zoomBy = (delta) => setZoom((current) => clampZoom(current + delta));
  const resetZoom = () => {
    setZoom(ZOOM.initial);
    scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      aria-label="Meeting notes"
      className="relative flex h-full min-h-0 flex-col rounded-[25px] border border-[var(--line)] bg-[var(--page)]"
    >
      <header className="flex h-[58px] shrink-0 items-center pl-[26px] pr-[16px]">
        <ToolbarButton label="Close meeting notes" onClick={onClose} className="h-[24px] w-[24px] text-[#a9a9a9]">
          <ChevronLeft size={16} />
        </ToolbarButton>
        <p className="ml-[13px] flex-1 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[#a8a8a8]">
          Meeting notes
        </p>
        <ToolbarButton label="Download meeting notes" onClick={downloadNotes} className="h-[24px] w-[24px] text-[#a9a9a9]">
          <DownloadIcon />
        </ToolbarButton>
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
          <ToolbarButton label="Zoom out" onClick={() => zoomBy(-ZOOM.step)} className="h-[30px] w-[30px] text-[18px]">
            −
          </ToolbarButton>
          <span className="w-[48px] text-center text-[14px] tabular-nums" aria-live="polite">
            {zoom}%
          </span>
          <ToolbarButton label="Zoom in" onClick={() => zoomBy(ZOOM.step)} className="h-[30px] w-[30px] text-[18px]">
            +
          </ToolbarButton>
          <ToolbarButton label="Reset zoom" onClick={resetZoom} className="ml-[2px] h-[30px] w-[30px] text-[#8f8f8f]">
            <ResetIcon />
          </ToolbarButton>
        </div>
      </div>
    </section>
  );
}
