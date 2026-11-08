const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };

export function ChevronLeft({ size = 18, width = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={width} aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronDown({ open = false, size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...stroke}
      strokeWidth={1.8}
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}

export function DocIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} aria-hidden="true">
      <path d="M14.5 20.5H6.5A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 19 5v10.5z" />
      <path d="M14.5 20.5V17a1.5 1.5 0 0 1 1.5-1.5h3M8.5 8.5h7M8.5 12h4.5" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3.8v16.4a.8.8 0 0 0 1.2.7l13.4-8.2a.8.8 0 0 0 0-1.4L7.2 3.1A.8.8 0 0 0 6 3.8z" fill="currentColor" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth={1.6} aria-hidden="true">
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" {...stroke} strokeWidth={2} aria-hidden="true">
      <path d="M8 3h8M9 3v7l-3 4h12l-3-4V3M12 14v7" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...stroke} strokeWidth={1.6} aria-hidden="true">
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14" />
    </svg>
  );
}

export function ResetIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7} aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" />
      <path d="M4.5 4.5V9H9" />
    </svg>
  );
}

export function Sparkle() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="sparkle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#e9a531" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5-.6-5.6-4.9-9.9-10.5-10.5C7.1 11.4 11.4 7.1 12 1.5z"
        fill="url(#sparkle)"
      />
    </svg>
  );
}
