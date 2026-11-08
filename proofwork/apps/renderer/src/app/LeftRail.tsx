import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { BookOpen, Briefcase, Eye, Home, IdCard, Lock, MessageCircle, Settings } from "lucide-react";
import { JOB_PORTAL_UNLOCK_SCENARIOS } from "@pw/shared";
import { cn } from "@/lib/cn";
import { useProgress } from "@/stores/progress";
import { useUi, type PanelName } from "@/stores/ui";
import { toast } from "@/stores/toasts";
import { Tooltip } from "@/components/ui/Tooltip";
import { IconButton } from "@/components/ui/Button";

const ICON = { size: 18, strokeWidth: 1.75 } as const;

const railItem = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex size-10 items-center justify-center rounded-full transition-colors duration-200",
    isActive ? "bg-white text-ink" : "text-fg-muted hover:bg-white/10 hover:text-fg",
  );

/** Vertical glass pill of icon buttons. Settings sits at the bottom. */
export function LeftRail() {
  const completed = useProgress((s) => s.data?.completedScenarios ?? 0);
  const jobsUnlocked = completed >= JOB_PORTAL_UNLOCK_SCENARIOS;
  const openPanel = useUi((s) => s.openPanel);

  const panelButton = (name: PanelName, label: string, icon: ReactNode) => (
    <Tooltip content={label} side="top">
      <IconButton label={label} icon={icon} variant="ghost" onClick={() => openPanel(name)} />
    </Tooltip>
  );

  return (
    <nav aria-label="Main" className="glass m-3 flex w-[60px] shrink-0 flex-col items-center gap-2 py-4">
      <Tooltip content="Home" side="bottom">
        <NavLink to="/" end className={railItem} aria-label="Home">
          <Home {...ICON} aria-hidden="true" />
        </NavLink>
      </Tooltip>
      <Tooltip content="Training" side="bottom">
        <NavLink to="/training" className={railItem} aria-label="Training">
          <BookOpen {...ICON} aria-hidden="true" />
        </NavLink>
      </Tooltip>
      <Tooltip content={jobsUnlocked ? "Jobs" : "Jobs (locked: finish one project)"} side="bottom">
        {jobsUnlocked ? (
          <NavLink to="/jobs" className={railItem} aria-label="Jobs">
            <Briefcase {...ICON} aria-hidden="true" />
          </NavLink>
        ) : (
          <button
            type="button"
            aria-label="Jobs, locked until you finish one project"
            aria-disabled="true"
            onClick={() => toast({ title: "Jobs are locked", body: "Finish one project to unlock the job portal.", tone: "neutral" })}
            className="relative inline-flex size-10 items-center justify-center rounded-full text-fg-muted/60 hover:bg-white/10"
          >
            <Briefcase {...ICON} aria-hidden="true" />
            <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-night-2 text-fg-muted">
              <Lock size={9} strokeWidth={2} aria-hidden="true" />
            </span>
          </button>
        )}
      </Tooltip>
      <Tooltip content="Portfolio" side="bottom">
        <NavLink to="/portfolio" className={railItem} aria-label="Portfolio">
          <IdCard {...ICON} aria-hidden="true" />
        </NavLink>
      </Tooltip>
      {panelButton("vision", "Vision board", <Eye {...ICON} aria-hidden="true" />)}
      {panelButton("coach", "Coach", <MessageCircle {...ICON} aria-hidden="true" />)}
      <div className="mt-auto">{panelButton("settings", "Settings", <Settings {...ICON} aria-hidden="true" />)}</div>
    </nav>
  );
}
