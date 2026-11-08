import { guide, learner } from '../../content.js';
import { Avatar } from '../brand.jsx';

function Bubble({ mine = false, oneLine = false, children }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : ''}`}>
      <div
        className={`${oneLine ? 'whitespace-nowrap' : 'max-w-[378px]'} rounded-[14px] bg-[#2A2A2D] px-[14px] py-[10px] text-[13px] leading-[1.45] text-tx shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]`}
      >
        {children}
      </div>
    </div>
  );
}

export default function ChatThread({ answered = false }) {
  return (
    <section className="absolute left-[601px] top-[50px] w-[482px]" aria-label={`Chat with ${guide.name}`}>
      <header className="flex items-center gap-[8px]">
        <Avatar size={38} ring={false} className="shadow-[0_0_0_2px_rgba(255,255,255,.75)]" />
        <div className="leading-[1.3]">
          <div className="text-[14px] font-medium text-tx">{guide.name}</div>
          <div className="text-[12px] text-tx-3">{guide.role} · online</div>
        </div>
      </header>
      <div className="mt-[27px] flex flex-col gap-[10px] pl-[3px]">
        <Bubble oneLine>Hey {learner.firstName}. First up: find out why hosts cancel.</Bubble>
        <Bubble oneLine>The data is in your resources. Send me a draft when ready.</Bubble>
        {answered && (
          <>
            <div className="mt-[12px]">
              <Bubble mine oneLine>
                Where should I start?
              </Bubble>
            </div>
            <div className="mt-[8px]">
              <Bubble>Open the cancellations file. Sort it by reason. The biggest one is your answer.</Bubble>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
