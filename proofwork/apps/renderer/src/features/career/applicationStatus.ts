import type { JobApplication } from "@pw/shared";
import type { Tone } from "@/components/ui";

export const APPLICATION_STATUS_LABEL: Record<JobApplication["status"], string> = {
  draft: "Draft",
  ready: "Ready to apply",
  submitted: "Submitted",
};

export const APPLICATION_STATUS_TONE: Record<JobApplication["status"], Tone> = {
  draft: "neutral",
  ready: "accent",
  submitted: "success",
};
