// Typed HTTP errors. The app-level error handler turns these into `{error, message}` bodies.
export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "insufficient_credits"
  | "locked"
  | "not_found"
  | "conflict"
  | "internal";

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;

  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string) => new HttpError(400, "bad_request", message);
export const unauthorized = (message = "Sign in to continue.") => new HttpError(401, "unauthorized", message);
export const insufficientCredits = (message = "You do not have enough credits for this action.") =>
  new HttpError(402, "insufficient_credits", message);
export const locked = (message: string) => new HttpError(403, "locked", message);
export const notFound = (message: string) => new HttpError(404, "not_found", message);
export const conflict = (message: string) => new HttpError(409, "conflict", message);

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: "bad_request",
  401: "unauthorized",
  402: "insufficient_credits",
  403: "locked",
  404: "not_found",
  409: "conflict",
};

/** Maps a framework (Fastify) status onto the public error code set. */
export function codeForStatus(status: number): ErrorCode {
  return CODE_BY_STATUS[status] ?? (status >= 500 ? "internal" : "bad_request");
}
