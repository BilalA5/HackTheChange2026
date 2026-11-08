import { useAppTheme } from '@/shared/useAppTheme.js';
import Dock from './Dock.jsx';
import { Footer, Hired } from './End.jsx';
import Hero from './Hero.jsx';
import Learn from './Learn.jsx';
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
        Skip to how it works
      </a>
      <main>
        <Hero />
        <Roles />
        <Learn />
        <Hired />
      </main>
      <Footer />
      <Dock />
    </>
  );
}
