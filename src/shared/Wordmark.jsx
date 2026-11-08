const MARKS = {
  light: '/assets/brand/flint-mark-light.svg',
  dark: '/assets/brand/flint-mark.svg',
};

export default function Wordmark({ size = 24, tone = 'light', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.26em] font-semibold leading-none tracking-[-0.05em] ${
        tone === 'light' ? 'text-white' : 'text-[#141416]'
      } ${className}`}
      style={{ fontSize: size }}
    >
      <img src={MARKS[tone]} alt="" className="h-[1.05em] w-[1.05em]" />
      flint
    </span>
  );
}
