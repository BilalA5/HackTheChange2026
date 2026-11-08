import { useEffect, useState } from "react";
import type { AppInfo, OtaInfo } from "@pw/shared";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";
import { pw } from "@/lib/bridge";
import { errorMessage } from "@/lib/errors";
import { SettingsGroup, SettingsSection } from "../ui";

export function UpdatesTab() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<OtaInfo | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    pw.app
      .getInfo()
      .then((i) => alive && setInfo(i))
      .catch((e: unknown) => alive && setInfoError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, []);

  const check = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      setResult(await pw.app.checkForUpdates());
    } catch (e) {
      setCheckError(errorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Version">
        <SettingsGroup>
          {infoError && <p role="alert" className="text-[13px] text-danger">{infoError}</p>}
          {!info && !infoError && <Spinner label="Loading version" />}
          {info && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
              <Row label="Version" value={info.version} />
              <Row label="Channel" value={info.channel} />
              <Row label="Platform" value={info.platform} />
              <Row label="Electron" value={info.electron ?? "Not applicable"} />
              <Row label="Chrome" value={info.chrome ?? "Not applicable"} />
            </dl>
          )}
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Updates" description="Proofwork checks the release channel you are on.">
        <SettingsGroup>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 text-[14px] text-fg" aria-live="polite">
              {checking && "Checking for updates..."}
              {!checking && result && !result.url && `You are up to date${result.version ? ` (${result.version})` : ""}.`}
              {!checking && result?.url && (
                <>
                  Version {result.version} is available.
                  {result.notes && <span className="mt-1 block text-[12px] text-fg-muted">{result.notes}</span>}
                </>
              )}
              {!checking && !result && "No check yet."}
            </div>
            <div className="flex shrink-0 gap-2">
              {result?.url && (
                <Button variant="glass" size="sm" onClick={() => void pw.app.openExternal(result.url ?? "")}>
                  Download
                </Button>
              )}
              <Button size="sm" onClick={() => void check()} loading={checking}>
                Check for updates
              </Button>
            </div>
          </div>
          {checkError && (
            <p role="alert" className="text-[13px] text-danger">
              Could not check for updates. {checkError}
            </p>
          )}
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">{label}</dt>
      <dd className="mt-0.5 truncate text-fg">{value}</dd>
    </div>
  );
}
