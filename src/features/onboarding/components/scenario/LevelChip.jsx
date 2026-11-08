import { Star } from '../brand.jsx';

export default function LevelChip({ level = 1 }) {
  return (
    <span className="absolute right-[24px] top-[8px] flex h-[28px] items-center gap-[5px] rounded-full bg-[#141416] px-[10px] text-[12.5px] font-medium text-tx shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
      <Star className="h-[15px] w-[15px]" />L{level}
    </span>
  );
}
