import { Fragment, useLayoutEffect, useRef, useState } from 'react';

const Svg = ({ size = 14, sw = 1.6, children, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const FlintMark = ({ size = 22, tone = 'light', className = '' }) => (
  <img
    src={tone === 'light' ? '/assets/brand/flint-mark-light.svg' : '/assets/brand/flint-mark.svg'}
    alt=""
    width={size}
    height={size}
    className={className}
  />
);

export const Sparkle = (p) => (
  <Svg {...p}>
    <path d="M10 3.5 11.8 9l5.5 1.8-5.5 1.8L10 18l-1.8-5.4-5.5-1.8L8.2 9zM18.5 3v4M20.5 5h-4M19 16.5v3.5M20.8 18.2h-3.6" />
  </Svg>
);
export const Brief = (p) => (
  <Svg {...p}>
    <path d="M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM9 7.5v-2A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M4 12.5h16" />
  </Svg>
);
export const Chat = (p) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
export const Check = (p) => (
  <Svg {...p} sw={2}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </Svg>
);
export const Chevron = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);
export const Play = ({ size = 12, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5z" />
  </svg>
);
export const Chart = (p) => (
  <Svg {...p} sw={2.2}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);
export const Download = (p) => (
  <Svg {...p} sw={2}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Svg>
);
export const ArrowUpRight = (p) => (
  <Svg {...p} sw={2}>
    <path d="M6 18 18 6M8 6h10v10" />
  </Svg>
);
export const Shield = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2 3.5 5v6.5c0 5 3.5 9 8.5 10.5 5-1.5 8.5-5.5 8.5-10.5V5z" fill="#35c26b" />
    <path d="m8 12 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Spark = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10.5 6 12.8 12l6 2.3-6 2.3-2.3 6-2.3-6-6-2.3 6-2.3zM18.5 1.5l1.2 3.3L23 6l-3.3 1.2-1.2 3.3-1.2-3.3L14 6l3.3-1.2z" />
  </svg>
);

/** Draws a fixed-size mock UI and scales it down to fit narrow containers. */
export function Stage({ w, h, className = '', children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const node = ref.current;
    const update = () => setScale(Math.min(1, node.clientWidth / w));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [w]);

  return (
    <div ref={ref} className={`relative w-full ${className}`} style={{ height: h * scale }}>
      <div
        className="absolute left-0 top-0"
        style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: '0 0' }}
      >
        {children}
      </div>
    </div>
  );
}

const Dot = () => <span className="h-[3px] w-[3px] rounded-full bg-white/45" />;

export function ActionRow({ width, textClass = 'text-[11.7px] text-white/90', iconSize = 14 }) {
  const items = [
    [Brief, 'Brief'],
    [Sparkle, 'Ask my coach'],
    [Chat, 'Meeting notes'],
    [Check, 'Submit for review'],
  ];
  return (
    <div className={`flex items-center justify-between ${textClass}`} style={{ width }}>
      {items.map(([Icon, label], index) => (
        <Fragment key={label}>
          {index > 0 && <Dot />}
          <span className="flex items-center gap-[7px] whitespace-nowrap">
            <Icon size={iconSize} />
            {label}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

export function Composer({ width, height = 75, to = 'Avery' }) {
  return (
    <div className="relative rounded-[12px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]" style={{ width, height }}>
      <div className="absolute left-[10.5px] top-[11px] flex h-[20px] items-center whitespace-nowrap text-[12.35px] text-white/50">
        Message {to}, or hold
        <kbd className="ml-[5px] grid h-[20px] min-w-[38px] place-items-center rounded-[5px] px-1 font-sans text-[8px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]">
          space
        </kbd>
        <span className="ml-[4.5px]">to talk</span>
      </div>
      <div className="absolute bottom-[10px] left-[10.5px] flex h-[25px] items-center gap-[4px] rounded-full px-[8px] text-[11.7px] text-white/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]">
        <Chart size={12} />
        AESO data
      </div>
      <div className="send-blue absolute bottom-[8px] right-[10px] grid h-[29px] w-[29px] place-items-center rounded-full text-white">
        <Play size={10} />
      </div>
    </div>
  );
}

export function Toolbar({ flat = false, label = 'Stop 1' }) {
  return (
    <div
      className={`${flat ? 'bg-[#48484d]' : 'toolbar-glass'} flex h-[46px] w-[176px] items-center rounded-full pl-[12px] text-white`}
    >
      <FlintMark size={24} />
      <div className="toolbar-pill ml-[9px] flex h-[32px] items-center justify-center gap-[6px] rounded-full px-3 text-[12px] font-medium">
        <span className="h-[7px] w-[7px] rounded-full bg-[#49ba61]" />
        {label}
      </div>
      <div className="toolbar-pill ml-[3px] grid h-[32px] w-[32px] place-items-center rounded-full">
        <Chevron size={15} sw={1.8} />
      </div>
    </div>
  );
}
