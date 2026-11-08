import { useEffect, useRef, useState } from 'react';
import ReviewCard from './ReviewCard.jsx';

function PersonaTab({ persona, active, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={`flex items-center gap-[10px] rounded-full py-[5px] pl-[5px] pr-[16px] text-left transition-colors ${
        active ? 'bg-[#2c2c2c] ring-1 ring-[#3d3d3d]' : 'hover:bg-white/[0.04]'
      }`}
    >
      <img src={persona.photo} alt="" className="h-[32px] w-[32px] rounded-full object-cover" />
      <span>
        <span className="block text-[14px] font-medium leading-[17px] text-white">{persona.name}</span>
        <span className="block text-[12px] leading-[16px] text-[#8c8c8c]">
          {persona.role}
          {persona.style && ` · ${persona.style}`}
        </span>
      </span>
    </button>
  );
}

function Bubble({ message }) {
  if (message.kind === 'review') return <ReviewCard review={message.review} />;

  const mine = message.from === 'me';
  return (
    <div
      className={`max-w-[394px] whitespace-pre-line px-[16px] py-[10px] text-[14.5px] leading-[21px] ${
        mine
          ? 'self-end rounded-[20px] bg-[#333] text-white'
          : 'self-start rounded-[18px] border border-[var(--bubble-line)] bg-[var(--bubble)] text-[#f4f4f4]'
      }`}
    >
      {message.text}
    </div>
  );
}

function TypingDots({ name }) {
  return (
    <div className="flex items-center gap-[10px] self-start text-[13px] text-[#8c8c8c]" aria-live="polite">
      <span className="flex gap-[4px] rounded-full border border-[var(--bubble-line)] bg-[var(--bubble)] px-[14px] py-[12px]">
        {[0, 150, 300].map((delay) => (
          <i
            key={delay}
            className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9a9a9a]"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      {name} is typing
    </div>
  );
}

function Composer({ name, disabled, onSend }) {
  const [draft, setDraft] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (disabled || !draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-[8px] rounded-[20px] border border-[var(--raised-line)] bg-[var(--raised)] p-[6px] pl-[16px]"
    >
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) submit(event);
        }}
        rows={1}
        placeholder={`Message ${name}…`}
        aria-label={`Message ${name}`}
        className="max-h-[120px] min-h-[38px] flex-1 resize-none bg-transparent py-[9px] text-[14.5px] leading-[20px] text-white outline-none placeholder:text-[#7b7b7b]"
      />
      <button
        type="submit"
        disabled={disabled || !draft.trim()}
        aria-label="Send"
        className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-white text-[#141414] transition disabled:bg-[#3a3a3a] disabled:text-[#7b7b7b]"
      >
        <svg viewBox="0 0 16 16" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}

function Suggestions({ lines, disabled, onPick }) {
  if (!lines.length) return null;
  return (
    <div className="flex flex-col gap-[6px]" aria-label="Suggested replies">
      <p className="eyebrow">Try saying</p>
      <div className="flex flex-wrap gap-[6px]">
        {lines.map((line) => (
          <button
            key={line}
            type="button"
            disabled={disabled}
            onClick={() => onPick(line)}
            className="max-w-full truncate rounded-full border border-[#333] bg-[var(--raised)] px-[14px] py-[8px] text-left text-[13.5px] text-[#e6e6e6] transition hover:border-[#4a4a4a] hover:bg-[#2c2c2c] disabled:opacity-50"
          >
            {line}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPanel({ conversations, active, onSelect }) {
  const conversation = conversations[active];
  const { persona, messages, typing, send, suggestions } = conversation;
  const scroller = useRef(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, typing, active]);

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col" aria-label="Chat">
      <header className="flex shrink-0 gap-[6px] pb-[18px] pt-[56px]" role="tablist" aria-label="Who to talk to">
        {Object.entries(conversations).map(([key, thread]) => (
          <PersonaTab key={key} persona={thread.persona} active={key === active} onSelect={() => onSelect(key)} />
        ))}
      </header>

      <div ref={scroller} className="chat-fade no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[14px] pb-[24px] pt-[24px]">
          {messages.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
          {typing && <TypingDots name={persona.name} />}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-[12px] pb-[22px] pt-[10px]">
        <Suggestions lines={suggestions.slice(0, 2)} disabled={typing} onPick={send} />
        <Composer name={persona.name} disabled={typing} onSend={send} />
      </div>
    </section>
  );
}
