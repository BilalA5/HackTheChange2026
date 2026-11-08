import { useState } from "react";
import { Check } from "lucide-react";
import type { Career } from "@pw/shared";
import { api, invalidate, useApi } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/Toaster";
import { Skeleton } from "@/components/ui/Feedback";
import { Pill } from "@/components/ui/Labels";
import { cn } from "@/lib/cn";
import { useSession } from "@/stores/session";
import { InlineConfirm, SettingsGroup, SettingsSection } from "../ui";

export function CareerTab() {
  const user = useSession((s) => s.user);
  const careers = useApi("GET /careers", {}, []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = careers.data ?? [];
  const current = list.find((c) => c.id === user?.careerId) ?? null;
  const pending: Career | null = list.find((c) => c.id === pendingId) ?? null;
  const vision = user?.vision ?? null;

  const switchCareer = async (career: Career) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await api("PATCH /me", { body: { careerId: career.id } });
      useSession.getState().setUser(updated);
      invalidate("GET /scenarios");
      setPendingId(null);
      toast({ title: `Switched to ${career.title}`, body: "Your projects now follow this career.", tone: "success" });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Current career" description="The career decides which projects appear on your map.">
        {careers.loading && !careers.data ? (
          <Skeleton className="h-24" />
        ) : current ? (
          <SettingsGroup>
            <div className="flex items-start gap-4">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: current.color }} aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-serif text-[18px] text-fg">{current.title}</div>
                <p className="mt-1 text-[13px] text-fg-muted">{current.tagline}</p>
              </div>
            </div>
            {current.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {current.skills.map((skill) => (
                  <Pill key={skill}>{skill}</Pill>
                ))}
              </div>
            )}
          </SettingsGroup>
        ) : (
          <p className="text-[14px] text-fg-muted">No career selected yet. Pick one below to start.</p>
        )}
      </SettingsSection>

      <SettingsSection title="Vision" description="Set during onboarding. Change it from the vision board.">
        <SettingsGroup>
          {vision ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
              <Field label="Target role" value={vision.targetRole} />
              <Field label="Level" value={vision.level} />
              <Field label="Industry" value={vision.industry} />
              <Field label="Company type" value={vision.companyType} />
              <Field label="Location" value={vision.location} />
              <Field label="Timeline" value={vision.timeline} />
              {vision.why && <Field label="Why" value={vision.why} wide />}
            </dl>
          ) : (
            <p className="text-[14px] text-fg-muted">No vision set yet.</p>
          )}
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Switch career" description="Your progress is kept per project, so switching never erases work.">
        {careers.error && (
          <div role="alert" className="flex items-center justify-between gap-3 text-[13px] text-danger">
            <span>Could not load careers.</span>
            <button type="button" className="underline" onClick={() => careers.reload()}>
              Try again
            </button>
          </div>
        )}
        <div role="radiogroup" aria-label="Career" className="grid grid-cols-1 gap-2">
          {list.map((career) => {
            const selected = career.id === current?.id;
            return (
              <button
                key={career.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={busy}
                onClick={() => {
                  if (!selected) setPendingId(career.id);
                }}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-card border px-4 py-3 text-left transition-colors duration-200",
                  selected ? "border-accent bg-accent/10" : "border-line bg-white/4 hover:bg-white/8",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[14px] text-fg">{career.title}</span>
                  <span className="block truncate text-[12px] text-fg-muted">{career.tagline}</span>
                </span>
                {selected && <Check size={16} strokeWidth={1.75} className="shrink-0 text-accent" aria-label="Current career" />}
              </button>
            );
          })}
        </div>

        {pending && (
          <InlineConfirm
            title={`Switch to ${pending.title}?`}
            body="Progress is kept per project. Projects you finished or started in your current career stay saved, and you can switch back at any time."
            confirmLabel="Switch career"
            busy={busy}
            onConfirm={() => void switchCareer(pending)}
            onCancel={() => setPendingId(null)}
          >
            {error && (
              <p role="alert" className="text-[13px] text-danger">
                {error}
              </p>
            )}
          </InlineConfirm>
        )}
      </SettingsSection>
    </div>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <dt className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-fg">{value || "Not set"}</dd>
    </div>
  );
}
