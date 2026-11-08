const reasons = [
  { label: 'Calendar conflicts', share: 0.94, top: true },
  { label: 'Maintenance issues', share: 0.44 },
  { label: 'Pricing errors', share: 0.35 },
  { label: 'Personal reasons', share: 0.18 },
  { label: 'Other', share: 0.12 },
];

const Mono = ({ children, className = '' }) => (
  <span className={`font-mono uppercase tracking-[.18em] ${className}`}>{children}</span>
);

function WindowChrome() {
  return (
    <div className="flex h-[36px] items-end gap-[52px] bg-[#E4E5E8] pl-[12px]">
      <span className="mb-[13px] flex gap-[7px]">
        <i className="h-[11px] w-[11px] rounded-full bg-[#FF5F57]" />
        <i className="h-[11px] w-[11px] rounded-full bg-[#FEBC2E]" />
        <i className="h-[11px] w-[11px] rounded-full bg-[#28C840]" />
      </span>
      <span className="rounded-t-[8px] bg-white px-[13px] pb-[7px] pt-[6px] text-[11px] font-medium text-[#141416]">
        Why hosts cancel · Airbnb
      </span>
    </div>
  );
}

function SlideRail() {
  return (
    <div className="w-[68px] pt-[8px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="mb-[8px] flex items-start gap-[4px] pl-[9px] text-[6px] text-[#9a9aa0]">
          {n}
          <span
            className={`mt-[2px] h-[26px] w-[44px] rounded-[3px] bg-[#F3F1EC] p-[6px] ${
              n === 2 ? 'shadow-[0_0_0_1.5px_#141416]' : 'shadow-[0_0_0_1px_#e3e1dc]'
            }`}
          >
            <i className="block h-[2px] w-[18px] bg-[#9a9aa0]" />
            <i className="mt-[3px] block h-[2px] w-[26px] bg-[#cfcac2]" />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FindingsSlide() {
  return (
    <div className="absolute left-[169px] top-[85px] h-[455px] w-[802px] overflow-hidden rounded-[10px] bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)]">
      <WindowChrome />
      <div className="flex h-[419px]">
        <SlideRail />
        <div className="my-[12px] mr-[14px] flex-1 rounded-[14px] bg-[#F3F1EC] px-[38px] pt-[26px] shadow-[0_2px_10px_rgba(0,0,0,.08)]">
          <div className="text-[9.5px]">
            <Mono className="font-semibold text-[#141416]">Airbnb</Mono>
            <Mono className="ml-[12px] text-[#77777e]">Key finding</Mono>
          </div>
          <h2 className="m-0 mt-[8px] text-[26px] font-medium tracking-[-0.02em] text-[#141416]">Why hosts cancel</h2>
          <div className="mt-[52px] flex">
            <div className="w-[199px]">
              <div className="text-[72px] font-medium leading-none tracking-[-0.05em] text-[#141416]">46%</div>
              <div className="mt-[18px] text-[14px] text-[#55555b]">are calendar conflicts</div>
            </div>
            <ul className="m-0 flex flex-1 list-none flex-col gap-[11px] p-0">
              {reasons.map(({ label, share, top }) => (
                <li key={label} className="flex items-center text-[11.5px] text-[#2b2b2f]">
                  <span className="w-[134px]">{label}</span>
                  <span className="relative h-[10px] w-[253px] rounded-full bg-[#E6E2DA]">
                    <i
                      className={`absolute inset-y-0 left-0 rounded-full ${top ? 'bg-[#141416]' : 'bg-[#B9B2A6]'}`}
                      style={{ width: `${share * 100}%` }}
                    />
                  </span>
                  {top && <span className="ml-[26px] font-mono text-[9.5px] font-semibold">46%</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-[64px] flex items-center gap-[12px] rounded-[10px] bg-[#E7E3DC] px-[14px] py-[11px]">
            <Mono className="text-[8.5px] text-[#77777e]">Recommendation</Mono>
            <span className="text-[13.5px] font-semibold text-[#141416]">Sync host calendars. 14% to 10%.</span>
          </div>
          <div className="mt-[12px] flex justify-between text-[7.5px] text-[#9a9aa0]">
            <Mono>Airbnb · Host cancellations</Mono>
            <Mono>2 / 5</Mono>
          </div>
        </div>
      </div>
    </div>
  );
}
