import { useActionState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAppTheme } from '@/shared/useAppTheme.js';
import Wordmark from '@/shared/Wordmark.jsx';
import { homePathFor, useAuth } from './auth-context.js';

const glass = {
  background: 'rgba(10,12,16,.55)',
  backdropFilter: 'blur(30px) saturate(1.25)',
  WebkitBackdropFilter: 'blur(30px) saturate(1.25)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,.13), inset 0 1px 0 rgba(255,255,255,.16), 0 50px 100px -30px rgba(0,0,0,.7)',
};

const fieldClass =
  'h-[52px] w-full rounded-[16px] bg-white/[0.08] px-[18px] text-[16px] text-white outline-none ring-1 ring-white/15 transition placeholder:text-white/40 focus:bg-white/[0.12] focus:ring-white/50';

function Field({ label, ...input }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] text-white/60">{label}</span>
      <input className={fieldClass} {...input} />
    </label>
  );
}

export default function LoginPage() {
  useAppTheme('auth');
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, submit, pending] = useActionState(
    async (_previous, form) => {
      const values = { name: form.get('name'), email: form.get('email') };
      try {
        const signedIn = await signIn(values);
        navigate(signedIn.onboarded ? (location.state?.from ?? '/app') : '/onboarding', { replace: true });
        return { error: null, values };
      } catch (failure) {
        return { error: failure.message, values };
      }
    },
    { error: null, values: { name: '', email: '' } },
  );
  const { error, values } = state;

  if (ready && user && !pending) return <Navigate to={homePathFor(user)} replace />;

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-[#0e0e10] px-4 py-10 text-white">
      <title>Log in · Flint</title>
      <img
        src="/assets/onboarding/si-city.webp"
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover brightness-[.55]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(8,10,14,0),rgba(8,10,14,.75))]" />

      <Link to="/" className="absolute left-6 top-6 drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]" aria-label="Flint home">
        <Wordmark size={26} />
      </Link>

      <form
        action={submit}
        className="relative flex w-full max-w-[440px] flex-col gap-5 rounded-[32px] px-8 py-10 sm:px-10"
        style={glass}
      >
        <div>
          <h1 className="m-0 font-serif text-[34px] font-normal leading-[1.1] tracking-[-0.02em] [text-wrap:balance]">
            Learn the job by doing it.
          </h1>
          <p className="mt-3 text-[15px] leading-[1.45] text-white/65">
            Log in to pick up where you left off, or start fresh with your name and email.
          </p>
        </div>

        <Field
          label="Your name"
          name="name"
          autoComplete="name"
          placeholder="Sanjay Chauhan"
          defaultValue={values.name}
          required
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={values.email}
          required
        />

        {error && (
          <p role="alert" className="m-0 rounded-[12px] bg-[#EC4B3F]/15 px-4 py-3 text-[14px] text-[#ffb4ad]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 flex h-[56px] items-center justify-center rounded-full bg-white text-[16.5px] font-medium text-[#14110f] shadow-[0_12px_30px_-12px_rgba(0,0,0,.6)] transition hover:scale-[1.02] active:scale-[.99] disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
