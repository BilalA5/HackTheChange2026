export default function VideoPlayer({ video, autoPlay = false, className = '' }) {
  return (
    <video
      key={video.id}
      src={video.src}
      poster={video.poster}
      controls
      playsInline
      preload="metadata"
      autoPlay={autoPlay}
      className={`block aspect-video w-full rounded-[14px] bg-black ${className}`}
    >
      <track kind="captions" src={video.captions} srcLang="en" label="English" />
    </video>
  );
}
