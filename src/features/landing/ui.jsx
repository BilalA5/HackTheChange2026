export function Mark({ className = '', style }) {
  return (
    <img
      src="/assets/brand/flint-mark.svg"
      alt=""
      aria-hidden="true"
      className={className}
      style={style}
      draggable="false"
    />
  );
}

export const Flame = () => (
  <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" aria-hidden="true">
    <path
      d="M12 2.5c.6 3.2 3.9 5 5.2 8.2 1.6 4-1 9.3-5.2 9.3s-6.6-3.4-5.9-6.9c.4-2 1.8-3.2 2.4-4.6.5 1.5 1.2 2.3 2.1 2.6C10 8 11.2 5 12 2.5Z"
      fill="#ff6a1a"
    />
    <path
      d="M12 12.2c1.6 1.7 2.8 3 2.4 4.8-.3 1.5-1.3 2.4-2.4 2.4s-2.3-.9-2.4-2.4c-.1-1.6 1.1-2.9 2.4-4.8Z"
      fill="#ffc23d"
    />
  </svg>
);

export const TrendUp = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-[14px] w-[14px]"
    fill="none"
    stroke="#1d9e4b"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);

export const Play = ({ className = 'h-3 w-3' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.6-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8Z" fill="currentColor" />
  </svg>
);
