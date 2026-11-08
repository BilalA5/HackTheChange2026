const CITY = { src: '/assets/onboarding/city.jpg', width: 1800, height: 1012 };

/**
 * The city fills the window like `object-fit: cover`, but as a box of the image's own proportions, so
 * anything placed inside it in percent (the company pins) stays on its rooftop at every window size.
 */
export default function CityBackdrop({ dim = false, children }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#16222f]" aria-hidden={!children}>
      <div
        className="board-drift absolute left-1/2 top-1/2"
        style={{
          width: `max(100vw, calc(100svh * ${CITY.width / CITY.height}))`,
          aspectRatio: `${CITY.width} / ${CITY.height}`,
          translate: '-50% -50%',
        }}
      >
        <img
          src={CITY.src}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={dim ? { filter: 'blur(10px) brightness(.45) saturate(.85)' } : undefined}
        />
        {children}
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${
          dim ? 'bg-[#0e0e10]/40' : 'bg-[radial-gradient(75%_70%_at_50%_50%,rgba(8,10,14,0)_40%,rgba(8,10,14,.55))]'
        }`}
      />
    </div>
  );
}
