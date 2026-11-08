import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { pw } from "@/lib/bridge";
import { useSession } from "@/stores/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { Spinner } from "@/components/ui/Feedback";

type Health = "checking" | "ok" | "down";

/** Stylised mark: a rounded tile with a "proof" tick. Our own simple artwork. */
function Mark() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <defs>
        <linearGradient id="pw-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-accent-hover)" />
          <stop offset="1" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="40" height="40" rx="13" fill="url(#pw-mark)" />
      <path d="M13 23.5 L19.5 30 L31 15.5" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Public sign-in page. Email plus name (dev login), with "Continue in browser" in Electron. */
export function LoginPage() {
  const user = useSession((s) => s.user);
  const hydrated = useSession((s) => s.hydrated);
  const login = useSession((s) => s.login);
  const loginWithBrowser = useSession((s) => s.loginWithBrowser);
  const navigate = useNavigate();

  const [health, setHealth] = useState<Health>("checking");
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<"form" | "browser" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = () => {
    setHealth("checking");
    api("GET /health")
      .then(() => {
        setHealth("ok");
        setHealthMessage(null);
      })
      .catch((e: unknown) => {
        setHealth("down");
        setHealthMessage(errorMessage(e));
      });
  };

  useEffect(checkHealth, []);

  if (hydrated && user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy("form");
    try {
      await login(email.trim(), name.trim() || undefined);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const onBrowser = async () => {
    setError(null);
    setBusy("browser");
    try {
      await loginWithBrowser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const canSubmit = health === "ok" && email.includes("@") && busy === null;

  return (
    <div className="relative flex h-full items-center justify-center overflow-y-auto bg-night p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 size-[620px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute right-[-120px] bottom-[-160px] size-[420px] rounded-full bg-xp/10 blur-[110px]" />
      </div>

      <main className="glass relative flex w-full max-w-[400px] flex-col gap-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mark />
          <h1 className="font-serif text-[40px] leading-none font-medium tracking-tight">Proofwork</h1>
          <p className="max-w-[300px] text-[14px] text-fg-muted">Prove what you can do, one real project at a time.</p>
        </div>

        {health === "checking" && (
          <div className="flex items-center justify-center gap-2 text-[13px] text-fg-muted">
            <Spinner size={14} label="Checking the server" />
            Connecting to the server…
          </div>
        )}

        {health === "down" && (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-danger/10 p-4">
            <div className="text-[14px] font-medium text-danger">Can’t reach the Proofwork server</div>
            <p className="text-[13px] text-fg-muted">{healthMessage ?? "Start the server and try again."}</p>
            <div>
              <Button variant="glass" size="sm" onClick={checkHealth}>
                Retry
              </Button>
            </div>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={onSubmit} aria-label="Sign in">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={health !== "ok"}
          />
          <Input
            label="Display name"
            autoComplete="name"
            placeholder="Optional"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={health !== "ok"}
            hint="Local sign-in. No password in this build."
          />
          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}
          <Button type="submit" variant="light" size="lg" loading={busy === "form"} disabled={!canSubmit}>
            Continue
          </Button>
        </form>

        {pw.isElectron && (
          <Button variant="glass" size="md" loading={busy === "browser"} disabled={busy !== null} onClick={onBrowser}>
            Continue in browser
          </Button>
        )}
      </main>
    </div>
  );
}
