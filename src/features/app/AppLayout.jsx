import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/auth-context.js';
import { XP_PER_LEVEL } from '@/services/progress.js';
import InitialsAvatar from '@/shared/InitialsAvatar.jsx';
import { useAppTheme } from '@/shared/useAppTheme.js';
import Wordmark from '@/shared/Wordmark.jsx';
import { useProgress } from './useProgress.js';
import './app.css';

const navItems = [
  {
    to: '/app',
    label: 'World',
    end: true,
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  },
  {
    to: '/app/portfolio',
    label: 'Portfolio',
    icon: 'M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-11ZM9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M4 12.5h16',
  },
];

function NavIcon({ path }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LevelMeter() {
  const { level, xp } = useProgress();
  const intoLevel = xp % XP_PER_LEVEL;
  return (
    <div className="rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-white/[0.06]">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-medium text-tx">Level {level}</span>
        <span className="tabular-nums text-tx-3">
          {intoLevel} / {XP_PER_LEVEL} XP
        </span>
      </div>
      <div className="mt-2 h-[4px] rounded-full bg-white/10">
        <i className="block h-full rounded-full bg-spark" style={{ width: `${(intoLevel / XP_PER_LEVEL) * 100}%` }} />
      </div>
    </div>
  );
}

export default function AppLayout() {
  useAppTheme('app');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const leave = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 border-white/[0.06] bg-[#121214] px-4 py-5 lg:sticky lg:top-0 lg:h-svh lg:border-r">
        <div className="flex items-center justify-between lg:block">
          <Link to="/app" className="inline-flex px-2" aria-label="Flint home">
            <Wordmark size={22} />
          </Link>
          <nav className="flex gap-1 lg:mt-8 lg:flex-col" aria-label="App">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[12px] px-3 py-[9px] text-[14.5px] transition-colors ${
                    isActive ? 'bg-white/[0.08] text-tx' : 'text-tx-2 hover:bg-white/[0.04] hover:text-tx'
                  }`
                }
              >
                <NavIcon path={item.icon} />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto hidden flex-col gap-3 lg:flex">
          <LevelMeter />
          <div className="flex items-center gap-3 px-1">
            <InitialsAvatar name={user.name} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-tx">{user.name}</div>
              <div className="truncate text-[12.5px] text-tx-3">{user.email}</div>
            </div>
          </div>
          <div className="flex gap-2 text-[13px]">
            <Link
              to="/onboarding"
              className="flex-1 rounded-[10px] px-3 py-2 text-center text-tx-2 ring-1 ring-white/10 hover:text-tx"
            >
              Replay tour
            </Link>
            <button
              type="button"
              onClick={leave}
              className="flex-1 rounded-[10px] px-3 py-2 text-tx-2 ring-1 ring-white/10 hover:text-tx"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
