import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth/auth-context.js';
import { usePlan } from '@/features/plan/usePlan.js';
import { useAppTheme } from '@/shared/useAppTheme.js';
import Stage from './components/Stage.jsx';
import { screens } from './screens/index.js';
import { TourContext } from './tour.js';
import './onboarding.css';

const ANSWERS_KEY = 'flint.onboarding';
const pathFor = (index) => `/onboarding/${screens[index].slug}`;

function readAnswers() {
  try {
    return JSON.parse(sessionStorage.getItem(ANSWERS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function useAnswers(plan) {
  const [answers, setAll] = useState(readAnswers);

  useEffect(() => {
    if (!plan || answers.roleId || answers.customRole) return;
    setAll({
      roleId: plan.customRole ? null : plan.roleId,
      customRole: plan.customRole ?? '',
      startingPoint: plan.startingPoint,
      hoursPerWeek: plan.hoursPerWeek,
    });
  }, [plan, answers.roleId, answers.customRole]);

  useEffect(() => {
    try {
      sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    } catch {
      // Private windows can refuse storage; answers still live in memory.
    }
  }, [answers]);

  const setAnswers = useCallback((changes) => setAll((current) => ({ ...current, ...changes })), []);
  return [answers, setAnswers];
}

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

const questionSlugs = new Set(['role', 'starting-point', 'pace']);

function isAnswered(slug, answers) {
  if (slug === 'role') return Boolean(answers.roleId || answers.customRole?.trim());
  if (slug === 'starting-point') return Boolean(answers.startingPoint);
  if (slug === 'pace') return Boolean(answers.hoursPerWeek);
  return true;
}

export default function OnboardingPage() {
  useAppTheme('onboarding');
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { plan, ready } = usePlan();
  const [answers, setAnswers] = useAnswers(plan);
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
  const next = useCallback(() => {
    const slug = screens[index]?.slug;
    if (questionSlugs.has(slug) && !isAnswered(slug, answers)) return;
    if (isLast) finish();
    else navigate(pathFor(index + 1));
  }, [navigate, finish, index, isLast, answers]);
  const prev = useCallback(() => index > 0 && navigate(pathFor(index - 1)), [navigate, index]);
  const exit = useCallback(() => finish(), [finish]);
  const tour = useMemo(
    () => ({ index, total: screens.length, next, prev, exit, finish, answers, setAnswers }),
    [index, next, prev, exit, finish, answers, setAnswers],
  );

  useArrowKeys(tour);

  if (index < 0) return <Navigate to={pathFor(0)} replace />;
  if (!ready) return null;

  const unanswered = !plan && screens.slice(0, index).find(({ slug }) => !isAnswered(slug, answers));
  if (unanswered) return <Navigate to={`/onboarding/${unanswered.slug}`} replace />;

  const { Screen, title } = screens[index];

  return (
    <TourContext value={tour}>
      <title>{`${title} · Flint`}</title>
      <Stage>
        <div key={step} className="animate-fade absolute inset-0">
          <Screen />
        </div>
      </Stage>
    </TourContext>
  );
}
