import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/Toaster";

export interface Failure {
  message: string;
  /** True when the server refused an AI step for lack of credits. The notice then offers the credits panel. */
  outOfCredits: boolean;
}

/** Maps a thrown value to a user-facing failure. Out-of-credits also raises a warning toast. */
export function failureFrom(e: unknown): Failure {
  if (e instanceof ApiError && e.code === "insufficient_credits") {
    toast({ title: "Out of credits", body: "This AI step needs credits. Top up to continue.", tone: "warning" });
    return { message: "You are out of credits for this AI step.", outOfCredits: true };
  }
  return { message: errorMessage(e), outOfCredits: false };
}
