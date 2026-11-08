import { useRef, useState } from 'react';
import { useAppTheme } from '@/shared/useAppTheme.js';
import {
  ChevronLeft,
  DownloadIcon,
  ResetIcon,
} from './icons.jsx';
import { notes, project } from './content.js';
import Chat from './Chat.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import './workspace.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Geist+Mono:wght@400;500;600&display=swap';

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
