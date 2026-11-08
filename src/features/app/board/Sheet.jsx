import { useEffect } from 'react';
import { glass } from './glass.js';

export default function Sheet({ title, eyebrow, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onPointerDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onPointerDown={(event) => event.stopPropagation()}
        className="animate-menu flex max-h-[min(720px,90svh)] w-full max-w-[560px] flex-col overflow-hidden rounded-[26px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.1),0_40px_90px_-30px_rgba(0,0,0,.9)]"
        style={{ ...glass, background: 'rgba(20,20,23,.92)' }}
      >
        <header className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div>
            {eyebrow && <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-tx-3">{eyebrow}</p>}
            <h2 className="mb-0 mt-2 font-serif text-[30px] font-normal leading-[1.1] tracking-[-0.025em] text-tx">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.07] text-tx-2 hover:text-tx"
          >
            <svg viewBox="0 0 16 16" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="no-scrollbar min-h-0 overflow-y-auto px-6 pb-6">{children}</div>
      </section>
    </div>
  );
}
