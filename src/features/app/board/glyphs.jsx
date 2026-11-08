const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };

export const CheckGlyph = (props) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth="2.6" {...props}>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

export const LockGlyph = (props) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth="1.6" {...props}>
    <rect x="3" y="7" width="10" height="7" rx="2" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
);

export const ArrowGlyph = (props) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth="1.8" {...props}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export const BriefcaseGlyph = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.7" {...props}>
    <path d="M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-11ZM9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M4 12.5h16" />
  </svg>
);

export const FlagGlyph = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth="1.7" {...props}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </svg>
);

export const SparkGlyph = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
    <path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3L12 19.5l-2.3-6.2L3.5 11l6.2-2.3z" />
  </svg>
);
