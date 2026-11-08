const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const MicIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </svg>
);

export const CameraIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <rect x="3" y="6.5" width="13" height="11" rx="2.5" />
    <path d="m16 10.5 5-3v9l-5-3" />
  </svg>
);

export const CameraOffIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <rect x="3" y="6.5" width="13" height="11" rx="2.5" />
    <path d="m16 10.5 5-3v9l-5-3M3 3l18 18" />
  </svg>
);

export const ScreenIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M12 16.5V20M8 20h8" />
  </svg>
);

export const PauseIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <rect x="7" y="6" width="3.2" height="12" rx="1" />
    <rect x="13.8" y="6" width="3.2" height="12" rx="1" />
  </svg>
);

export const PlayIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M8 5.5v13l10.5-6.5z" />
  </svg>
);

export const SoundIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <path d="M4 9.5h3l4.5-4v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={2} {...props}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const ChevronLeftIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <path d="M14.5 6.5 9 12l5.5 5.5" />
  </svg>
);

export const ChevronRightIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <path d="M9.5 6.5 15 12l-5.5 5.5" />
  </svg>
);

export const CaretDownIcon = (props) => (
  <svg viewBox="0 0 12 12" {...line} strokeWidth={1.6} {...props}>
    <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
  </svg>
);

export const CaretUpIcon = (props) => (
  <svg viewBox="0 0 12 12" {...line} strokeWidth={1.6} {...props}>
    <path d="m2.5 7.5 3.5-3.5 3.5 3.5" />
  </svg>
);

export const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={2.4} {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const BriefcaseIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <rect x="3.5" y="7" width="17" height="12" rx="2" />
    <path d="M9 7V5.5h6V7M3.5 12h17" />
  </svg>
);

export const LockIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={1.8} {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const TableIcon = (props) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.2} {...props}>
    <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M2 10h12M6 6.5v7" />
  </svg>
);

export const PlusIcon = (props) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.6} {...props}>
    <path d="M8 2.5v11M2.5 8h11" />
  </svg>
);

export const ArrowUpIcon = (props) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.8} {...props}>
    <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
  </svg>
);

export const BrainIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={1.5} {...props}>
    <path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3.2 3.2 0 0 0 7 18a3 3 0 0 0 5 1V6.5a2.5 2.5 0 0 0-3-2zM15 4.5a3 3 0 0 1 3 3M18 14v6M15 17h6" />
  </svg>
);

export const TimerIcon = (props) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.5} {...props}>
    <circle cx="8" cy="9" r="5.5" />
    <path d="M8 6v3l2 1.5M6.5 2h3" />
  </svg>
);

export const LeaveIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={2} {...props}>
    <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H10" />
  </svg>
);

export const PinIcon = (props) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.4} {...props}>
    <path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 10 8 14 8 14z" />
    <circle cx="8" cy="6.5" r="1.6" />
  </svg>
);

export const PencilIcon = (props) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.4} {...props}>
    <path d="M10.5 2.5l3 3L6 13H3v-3z" />
  </svg>
);

export const ShareIcon = (props) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.4} {...props}>
    <path d="M8 10V2.5M5 5.5l3-3 3 3M3 9v4.5h10V9" />
  </svg>
);

export const HeartIcon = ({ filled = false, ...props }) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.3} fill={filled ? 'currentColor' : 'none'} {...props}>
    <path d="M8 13.5S2 10 2 5.8A3 3 0 0 1 8 4.5a3 3 0 0 1 6 1.3C14 10 8 13.5 8 13.5z" />
  </svg>
);

export const ThumbIcon = ({ filled = false, ...props }) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.3} fill={filled ? 'currentColor' : 'none'} {...props}>
    <path d="M2.5 7h2.5v6.5H2.5zM5 7l2.5-4.5c1 0 1.7.8 1.5 1.8L8.6 6.5h3.9c.9 0 1.5.8 1.3 1.6l-1 4.2c-.2.7-.8 1.2-1.5 1.2H5" />
  </svg>
);

export const FilterIcon = (props) => (
  <svg viewBox="0 0 20 16" {...line} strokeWidth={1.3} {...props}>
    <circle cx="6" cy="7" r="4" />
    <path d="M9 10l2.5 2.5M13 4h6M14 8h5M15 12h4" />
  </svg>
);

export const SortIcon = (props) => (
  <svg viewBox="0 0 16 16" {...line} strokeWidth={1.3} {...props}>
    <path d="M5 13V3M2.5 5.5 5 3l2.5 2.5M11 3v10M8.5 10.5 11 13l2.5-2.5" />
  </svg>
);

export const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="#4285F4"
      d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.04 5.04 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.07Z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.05-3.74 1.05-2.87 0-5.3-1.94-6.17-4.54H2.18v2.84A11 11 0 0 0 12 23Z"
    />
    <path fill="#FBBC05" d="M5.83 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.65-2.84Z" />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.83 9.9C6.7 7.3 9.13 5.38 12 5.38Z"
    />
  </svg>
);
