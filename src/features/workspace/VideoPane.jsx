import VideoPlayer from '@/shared/VideoPlayer.jsx';
import { ChevronLeft } from './icons.jsx';

export default function VideoPane({ video, autoPlay = false, onClose }) {
  return (
    <section
      aria-label={video.title}
      className="flex h-full min-h-0 flex-col rounded-[25px] border border-[var(--line)] bg-[var(--page)]"
    >
      <header className="flex h-[58px] shrink-0 items-center pl-[26px] pr-[16px]">
        <button
          type="button"
          aria-label={`Close ${video.title}`}
          onClick={onClose}
          className="flex h-[24px] w-[24px] items-center justify-center rounded-md text-[#a9a9a9] hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="ml-[13px] flex-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#a8a8a8]">{video.title}</p>
      </header>
      <div className="px-[14px] pt-[12px]">
        <VideoPlayer video={video} autoPlay={autoPlay} />
      </div>
    </section>
  );
}
