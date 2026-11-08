const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const SoundIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} {...props}>
    <path d="M4 9.5h3l4.5-4v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
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

export const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={2.4} {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
