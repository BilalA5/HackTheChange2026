import { useAppTheme } from '@/shared/useAppTheme.js';
import Dock from './Dock.jsx';
import { Footer, Hired } from './End.jsx';
import Hero from './Hero.jsx';
import Learn from './Learn.jsx';
import Match from './Match.jsx';
import Roles from './Roles.jsx';
import './landing.css';

export default function LandingPage() {
  useAppTheme('landing');

  return (
    <>
      <title>Flint</title>
      <a
        href="#work"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-[#111] px-4 py-2 text-[14px] text-white focus:translate-y-0"
      >
        Skip to Learn the job by doing it
      </a>
      <main>
        <Hero />
        <Roles />
        <Learn />
        <Match />
        <Hired />
      </main>
      <Footer />
      <Dock />
    </>
  );
}
