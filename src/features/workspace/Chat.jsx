import { useLayoutEffect, useRef, useState } from 'react';
import { durations, manager, project } from './content.js';
import { LinkIcon, PinIcon } from './icons.jsx';

const WRITE_UP_OFFSET = 742;

function ManagerBubble({ children, pill = false }) {
  return (
    <div
      className={`max-w-[394px] self-start border border-[var(--bubble-line)] bg-[var(--bubble)] px-[16px] text-[14.5px] leading-[21px] text-[#f4f4f4] ${pill ? 'rounded-[21px] py-[10px]' : 'rounded-[18px] py-[10px] pb-[11px]'}`}
    >
      {children}
    </div>
  );
}

function MyBubble({ children, className = '' }) {
  return (
    <div
      className={`self-end rounded-[20px] bg-[#333] px-[15px] py-[9px] text-[14.5px] leading-[21px] text-white ${className}`}
    >
      {children}
    </div>
  );
}

function useOpenAtWriteUp(scrollerRef, writeUpRef) {
  useLayoutEffect(() => {
    let mounted = true;
    const anchor = () => {
      const scroller = scrollerRef.current;
      const card = writeUpRef.current;
      if (mounted && scroller && card) scroller.scrollTop = Math.max(0, card.offsetTop - WRITE_UP_OFFSET);
    };
    anchor();
    // Web fonts rewrap the bubbles, which moves the card.
    document.fonts?.ready.then(anchor);
    return () => {
      mounted = false;
    };
  }, [scrollerRef, writeUpRef]);
}

export default function Chat() {
  const scroller = useRef(null);
  const writeUp = useRef(null);
  const [duration, setDuration] = useState(null);
  useOpenAtWriteUp(scroller, writeUp);

  return (
    <section
      className="mx-auto flex h-full min-h-0 w-full max-w-[459px] flex-col xl:translate-x-2"
      aria-label={`Chat with ${manager.name}`}
    >
      <header className="flex h-[100px] shrink-0 items-start gap-[12px] pl-[24px] pt-[61px]">
        <img src={manager.photo} alt="" className="h-[35px] w-[35px] rounded-full" />
        <div className="-mt-[1px]">
          <p className="text-[15.5px] font-medium leading-[19px] text-white">{manager.name}</p>
          <p className="text-[12.5px] leading-[19px] text-[#8c8c8c]">{manager.role}</p>
        </div>
      </header>

      <div ref={scroller} className="chat-fade no-scrollbar relative min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col pb-[96px] pt-[34px]">
          <MyBubble className="max-w-[300px]">How do I decide which products count as sparse?</MyBubble>

          <div className="mt-[38px]">
            <ManagerBubble>
              <p>
                Sparse is a cutoff you choose. Count how many weeks of sales each product has, then set a minimum
                number of weeks, say 8, and any product with fewer weeks of data gets sparse = True. Pick the number
                yourself and write one sentence in the overview note on why that cutoff makes sense for a model to
                learn from.
              </p>
              <p className="mt-[21px]">What cutoff are you going with, and what is the reason?</p>
            </ManagerBubble>
          </div>

          <MyBubble className="mt-[38px]">We need to use both Single Price AND Sparse yes?</MyBubble>

          <div className="mt-[37px] flex flex-col">
            <ManagerBubble>
              <p>
                Yes. Both flags are columns in the table, and each one is its own true or false per product. A product
                can be sparse, single-price, both, or neither.
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
              So basically I took your flag categories such as Sparse is based on what we've seen for a given selected
              week and how minimal it is. As well as if we've ONLY ever seen 1 price of something that is a
              single-price flag conditioned to True.
            </p>
          </article>
        </div>
      </div>

      <div
        className="grid shrink-0 grid-cols-4 gap-[11px] pb-[25px] pl-[2px] pt-[15px]"
        role="group"
        aria-label="How long will this take?"
      >
        {durations.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={duration === option}
            onClick={() => setDuration(option)}
            className={`h-[44px] truncate rounded-full border px-[16px] text-[15px] font-semibold transition-colors ${
              duration === option
                ? 'border-[#5d5d5d] bg-[#333] text-white'
                : 'border-[#333] bg-[var(--raised)] text-[#f1f1f1] hover:border-[#444] hover:bg-[#2c2c2c]'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}
