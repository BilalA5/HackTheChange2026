import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#0b0b0c] px-6 text-center text-white">
      <div>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/50">404</p>
        <h1 className="mt-3 text-[clamp(2rem,1.4rem+2vw,3rem)] font-normal tracking-[-0.04em]">Nothing here yet.</h1>
        <Link
          to="/"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-white px-6 text-[15px] font-medium text-[#111] transition-transform hover:scale-[1.03]"
        >
          Back to Flint
        </Link>
      </div>
    </main>
  );
}
