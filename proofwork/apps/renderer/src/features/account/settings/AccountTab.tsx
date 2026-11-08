import { useState, type FormEvent } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { useSession } from "@/stores/session";
import { InlineConfirm, SettingsGroup, SettingsSection } from "../ui";

const DELETE_PHRASE = "delete";

export function AccountTab({ onClose }: { onClose: () => void }) {
  const user = useSession((s) => s.user);
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const trimmed = name.trim();
  const canSaveName = trimmed.length > 0 && trimmed !== user.name && !savingName;

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSaveName) return;
    setSavingName(true);
    setError(null);
    try {
      const updated = await api("PATCH /me", { body: { name: trimmed } });
      useSession.getState().setUser(updated);
      toast({ title: "Name updated", tone: "success" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const logOut = async () => {
    await useSession.getState().logout();
    onClose();
  };

  const deleteAccount = async () => {
    if (typed !== DELETE_PHRASE) return;
    setDeleting(true);
    setError(null);
    try {
      await api("DELETE /me");
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
      return;
    }
    await logOut();
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Profile">
        <SettingsGroup>
          <form onSubmit={saveName} className="flex flex-col gap-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
            <div className="flex justify-end">
              <Button type="submit" size="sm" variant="glass" disabled={!canSaveName} loading={savingName}>
                Save name
              </Button>
            </div>
          </form>
          <Input label="Email" value={user.email} readOnly hint="Email cannot be changed in this build." />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Session">
        <SettingsGroup>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] text-fg">Log out</div>
              <div className="text-[12px] text-fg-muted">Your progress stays on the server.</div>
            </div>
            <Button variant="glass" size="sm" icon={<LogOut size={15} strokeWidth={1.75} />} onClick={() => void logOut()}>
              Log out
            </Button>
          </div>
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Danger zone">
        {!confirmingDelete ? (
          <SettingsGroup>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] text-fg">Delete account</div>
                <div className="text-[12px] text-fg-muted">Removes your profile, progress, portfolio and credits. This cannot be undone.</div>
              </div>
              <Button variant="ghost" size="sm" className="text-danger" icon={<Trash2 size={15} strokeWidth={1.75} />} onClick={() => setConfirmingDelete(true)}>
                Delete account
              </Button>
            </div>
          </SettingsGroup>
        ) : (
          <InlineConfirm
            title="Delete your account?"
            body="All of your data is deleted on the server and you will be logged out. This cannot be undone."
            confirmLabel="Delete account"
            danger
            busy={deleting}
            confirmDisabled={typed !== DELETE_PHRASE}
            onConfirm={() => void deleteAccount()}
            onCancel={() => {
              setConfirmingDelete(false);
              setTyped("");
            }}
          >
            <Input
              label={`Type "${DELETE_PHRASE}" to confirm`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              error={error ?? undefined}
            />
          </InlineConfirm>
        )}
      </SettingsSection>
    </div>
  );
}
