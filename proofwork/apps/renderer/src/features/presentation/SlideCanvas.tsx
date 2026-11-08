import type { OutlineSlide } from "./types";

export interface SlideCanvasProps {
  slide: OutlineSlide;
  index: number;
  total: number;
}

/** Big presentation slide: Fraunces heading and bullets, with the slide x/y counter. */
export function SlideCanvas({ slide, index, total }: SlideCanvasProps) {
  const bullets = slide.bullets.map((b) => b.trim()).filter((b) => b.length > 0);
  return (
    <section aria-label={`Slide ${index + 1} of ${total}`} className="flex min-h-0 flex-1 flex-col pt-12 pr-[200px] pb-28 pl-14">
      <p className="font-mono text-[12px] tracking-[0.08em] text-muted-dark uppercase tabular-nums">
        {index + 1} / {total}
      </p>
      <h2 className="mt-4 font-serif text-[46px] leading-[1.08] text-fg">{slide.heading}</h2>
      <ul className="mt-8 flex flex-col gap-4 text-[22px] leading-snug text-fg/90">
        {bullets.map((b, i) => (
          <li key={`${i}-${b}`} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.55em] size-2 shrink-0 rounded-full bg-accent" />
            <span className="min-w-0">{b}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
