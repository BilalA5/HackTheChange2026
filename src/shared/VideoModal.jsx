import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import VideoPlayer from './VideoPlayer.jsx';

export default function VideoModal({ video, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onPointerDown={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-[1100px]">
        <div className="mb-3 flex items-center justify-between text-[14px] text-white/80">
          <span>{video.title}</span>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 transition hover:bg-white/10 hover:text-white">
            Close
          </button>
        </div>
        <VideoPlayer video={video} autoPlay />
      </div>
    </div>,
    document.body,
  );
}
