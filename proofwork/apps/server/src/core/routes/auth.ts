import type { FastifyInstance } from "fastify";
import { badRequest } from "../errors.ts";
import { login, desktopAuthUrl } from "../services/auth.ts";
import type { Core } from "../types.ts";
import { asObject, isEmail, optStr, reqStr } from "../validate.ts";
import { renderLoginPage } from "../login-page.ts";
import { originOf, queryParam } from "./helpers.ts";

const STATE_PATTERN = /^[\x21-\x7e]{1,256}$/;

export function registerAuthRoutes(api: FastifyInstance, core: Core): void {
  api.post("/auth/login", { config: { public: true } }, async (req) => {
    const o = asObject(req.body);
    const email = reqStr(o, "email", { max: 254 }).toLowerCase();
    if (!isEmail(email)) throw badRequest("Enter a valid email address.");
    const name = optStr(o, "name", { max: 80 });
    return login(core, { email, name: name || undefined });
  });

  api.post("/auth/desktop/start", { config: { public: true } }, async (req) => {
    const state = reqStr(asObject(req.body), "state", { max: 256 });
    if (!STATE_PATTERN.test(state)) throw badRequest("state contains invalid characters.");
    return { url: desktopAuthUrl(originOf(req), state) };
  });

  api.get("/auth/web", { config: { public: true } }, async (req, reply) => {
    const state = queryParam(req, "state");
    if (!state || !STATE_PATTERN.test(state)) throw badRequest("state is required.");
    reply.header(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'",
    );
    reply.type("text/html; charset=utf-8");
    return renderLoginPage(state);
  });
}
