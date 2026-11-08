import type { FastifyRequest } from "fastify";
import { badRequest } from "../errors.ts";

/** Route param as a non-empty string. */
export function param(req: FastifyRequest, name: string): string {
  const value = (req.params as Record<string, unknown>)[name];
  if (typeof value !== "string" || value.length === 0 || value.length > 128) throw badRequest(`Invalid ${name}.`);
  return value;
}

/** Origin of the current request, used to build absolute URLs. */
export function originOf(req: FastifyRequest): string {
  return `${req.protocol}://${req.headers.host ?? "127.0.0.1"}`;
}

export function queryParam(req: FastifyRequest, name: string): string | undefined {
  const value = (req.query as Record<string, unknown>)[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
