/** Human-readable message for any thrown value. */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Something went wrong.";
}
