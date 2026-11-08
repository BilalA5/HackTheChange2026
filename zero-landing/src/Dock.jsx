import React, { useEffect, useRef, useState } from 'react';
import { faq } from './faq.js';
import { useScrolled } from './hooks.js';
import { Mark, Play } from './ui.jsx';

const ZERO_APP = 'https://learnwithzero.com';

function answer(text) {
  const q = text.toLowerCase().replace(/[^a-z0-9$' ]/g, ' ');
  let best = null;
  let score = 0;
  for (const item of faq) {
    const s = item.k.reduce((n, k) => (q.includes(k) ? n + k.length : n), 0);
    if (s > score) {
      best = item;
      score = s;
    }
  }
  return best
    ? best.a
    : "I don't know that one yet. Write to team@zero.university and the team will help.";
}

function AskZero({ open, onClose }) {
  const [log, setLog] = useState([
    { from: 'zero', text: 'Hi. Ask me anything about Zero, or tap one of the questions below.' },
  ]);
  const [draft, setDraft] = useState('');
  const logRef = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 200);
  }, [open]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log]);

  const ask = (text) => {
    const t = text.trim();
    if (!t) return;
    setLog((l) => [...l, { from: 'you', text: t }, { from: 'zero', text: answer(t) }]);
    setDraft('');
  };

  return (
    <div
      role="dialog"
      aria-label="Ask Zero"
      aria-hidden={!open}
      inert={open ? undefined : ''}
      className={`glass-panel fixed bottom-[96px] left-1/2 z-50 flex max-h-[min(560px,calc(100svh-140px))] w-[min(400px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-[24px] transition-all duration-500 ${
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2.5 px-5 pb-3 pt-4">
        <Mark className="h-6 w-6" />
        <span className="flex-1 text-[15px] font-medium tracking-[-0.01em]">Ask Zero</span>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-[#555] hover:bg-black/5">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div ref={logRef} className="no-scrollbar min-h-[120px] flex-1 space-y-2.5 overflow-y-auto px-5 pb-3" aria-live="polite">
        {log.map((m, i) => (
          <p
            key={i}
            className={`max-w-[88%] rounded-[16px] px-3.5 py-2.5 text-[14px] leading-[1.4] ${
              m.from === 'you' ? 'ml-auto bg-[#111] text-white' : 'bg-white text-[#1b1d1c] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]'
            }`}
          >
            {m.text}
          </p>
        ))}
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 pb-3">
        {faq
          .filter((f) => f.chip)
          .map((f) => (
            <button
              key={f.q}
              type="button"
              onClick={() => ask(f.q)}
              className="shrink-0 rounded-full bg-black/[0.05] px-3 py-1.5 text-[13px] text-[#1b1d1c] hover:bg-black/[0.09]"
            >
              {f.q}
            </button>
          ))}
      </div>
      <form
        className="m-3 mt-0 flex items-center gap-2 rounded-[16px] bg-white p-1.5 pl-4 shadow-[0_0_0_0.5px_rgba(0,0,0,0.1)]"
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <input
          ref={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={160}
          placeholder="Ask anything about Zero"
          aria-label="Ask anything about Zero"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9a9a9a] focus-visible:outline-none"
        />
        <button type="submit" aria-label="Send" className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#111] text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function Menu({ open, onClose }) {
  const links = [
    { label: 'Home', href: '#top', internal: true },
    { label: 'Letters', href: 'https://learnwithzero.com/letters.html' },
    { label: 'Why Zero', href: 'https://why.zero.university/' },
  ];
  return (
    <div
      role="dialog"
      aria-label="Menu"
      aria-hidden={!open}
      inert={open ? undefined : ''}
      className={`glass-panel fixed bottom-[96px] left-1/2 z-50 w-[min(300px,calc(100vw-32px))] -translate-x-1/2 rounded-[24px] p-2 transition-all duration-500 ${
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target={l.internal ? undefined : '_blank'}
          rel={l.internal ? undefined : 'noreferrer'}
          onClick={(e) => {
            if (l.internal) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            onClose();
          }}
          className="block rounded-[16px] px-5 py-3.5 text-[22px] tracking-[-0.03em] text-[#111] hover:bg-black/[0.05]"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

/** The only navigation: Start, a menu and a question mark that opens Ask Zero. */
export default function Dock() {
  const shown = useScrolled(160);
  const [panel, setPanel] = useState(null);
  const toggle = (name) => setPanel((p) => (p === name ? null : name));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setPanel(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Menu open={panel === 'menu'} onClose={() => setPanel(null)} />
      <AskZero open={panel === 'help'} onClose={() => setPanel(null)} />
      <nav
        aria-label="Zero"
        className={`dock-tray fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-50 flex items-center gap-[6px] rounded-[20px] p-[5px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          shown || panel ? '-translate-x-1/2 translate-y-0' : '-translate-x-1/2 translate-y-[170%]'
        }`}
      >
        <a
          href={ZERO_APP}
          target="_blank"
          rel="noreferrer"
          className="start-key flex h-[57px] w-[min(254px,44vw)] items-center justify-center gap-2.5 rounded-[15px] text-[17px] font-medium text-white transition-transform hover:scale-[1.015] active:scale-[0.985]"
        >
          <Play className="h-3 w-3" />
          Start
        </a>
        <button
          type="button"
          onClick={() => toggle('menu')}
          aria-expanded={panel === 'menu'}
          aria-label="Menu"
          className="soft-key grid h-[55px] w-[55px] place-content-center gap-[5px] rounded-[15px]"
        >
          <i className={`block h-[2px] w-[17px] rounded bg-[#111] transition-transform ${panel === 'menu' ? 'translate-y-[3.5px] rotate-45' : ''}`} />
          <i className={`block h-[2px] w-[17px] rounded bg-[#111] transition-transform ${panel === 'menu' ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => toggle('help')}
          aria-expanded={panel === 'help'}
          aria-label="Ask Zero a question"
          className="soft-key grid h-[55px] w-[55px] place-items-center rounded-[15px] text-[24px] leading-none text-[#111]"
          style={{ fontFamily: 'var(--serif)' }}
        >
          ?
        </button>
      </nav>
    </>
  );
}
