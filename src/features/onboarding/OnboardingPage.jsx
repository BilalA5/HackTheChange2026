import { useCallback, useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth/auth-context.js';
import { useAppTheme } from '@/shared/useAppTheme.js';
import Stage from './components/Stage.jsx';
import { screens } from './screens/index.js';
import { TourContext } from './tour.js';
import './onboarding.css';

const pathFor = (index) => `/onboarding/${screens[index].slug}`;

function useArrowKeys({ next, prev }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.target.closest('input, textarea, [contenteditable]')) return;
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);
}

export default function OnboardingPage() {
  useAppTheme('onboarding');
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { step } = useParams();
  const index = screens.findIndex((screen) => screen.slug === step);
  const isLast = index === screens.length - 1;

  const finish = useCallback(
    async (to = '/app') => {
      await updateUser({ onboarded: true });
      navigate(to, { replace: true });
    },
    [navigate, updateUser],
  );
  const next = useCallback(() => (isLast ? finish() : navigate(pathFor(index + 1))), [navigate, finish, index, isLast]);
  const prev = useCallback(() => index > 0 && navigate(pathFor(index - 1)), [navigate, index]);
  const exit = useCallback(() => finish(), [finish]);
  const tour = useMemo(
    () => ({ index, total: screens.length, next, prev, exit, finish }),
    [index, next, prev, exit, finish],
  );

  useArrowKeys(tour);

  if (index < 0) return <Navigate to={pathFor(0)} replace />;

  const { Screen, title } = screens[index];

  return (
    <TourContext value={tour}>
      <title>{`${title} · How Flint works`}</title>
      <Stage>
        <div key={step} className="animate-fade absolute inset-0">
          <Screen />
        </div>
      </Stage>
    </TourContext>
  );
}
