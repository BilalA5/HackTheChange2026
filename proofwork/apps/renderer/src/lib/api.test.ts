import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, buildQuery, fillPath, uploadFile } from "./api";
import { useSession } from "@/stores/session";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const user = {
  id: "u1",
  email: "a@b.co",
  name: "Ada",
  createdAt: "2026-01-01T00:00:00.000Z",
  careerId: null,
  plan: "free" as const,
  onboardingComplete: true,
  vision: null,
  settings: {} as never,
};

describe("path and query helpers", () => {
  it("fills :params with encoded values", () => {
    expect(fillPath("/scenarios/:id/stages/:stageId", { id: "a b", stageId: "s/1" })).toBe("/scenarios/a%20b/stages/s%2F1");
  });

  it("throws when a param is missing", () => {
    expect(() => fillPath("/scenarios/:id", {})).toThrow(/Missing route param :id/);
  });

  it("builds a query string and skips undefined and null", () => {
    expect(buildQuery({ careerId: "ai", n: undefined, x: null, limit: 5 })).toBe("?careerId=ai&limit=5");
    expect(buildQuery({ a: undefined })).toBe("");
    expect(buildQuery(undefined)).toBe("");
  });
});

describe("api()", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    useSession.setState({ hydrated: true, token: null, user: null });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the web server origin, fills params, sends the query and the Bearer token", async () => {
    useSession.setState({ token: "tkn-1" });
    fetchMock.mockResolvedValue(jsonResponse({ id: "abc" }));

    const res = await api("GET /scenarios/:id", { params: { id: "abc" } });

    expect(res).toEqual({ id: "abc" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8787/api/scenarios/abc");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tkn-1");
    expect(init.body).toBeUndefined();
  });

  it("sends the query string for routes that declare one", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await api("GET /scenarios", { query: { careerId: "ai-engineer" } });
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8787/api/scenarios?careerId=ai-engineer");
  });

  it("sends JSON bodies with a content type", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ token: "t", user }));
    await api("POST /auth/login", { body: { email: "a@b.co", name: "Ada" } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8787/api/auth/login");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({ email: "a@b.co", name: "Ada" });
  });

  it("maps non-2xx responses to ApiError with status, code and message", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "conflict", message: "Already submitted" }, 409));
    const err = await api("POST /objectives/:id/pou/start", { params: { id: "o1" } }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, code: "conflict", message: "Already submitted" });
  });

  it("keeps the 409 body on the error so callers can resume from the authoritative view", async () => {
    const view = { sessionId: "s", step: "chat" };
    fetchMock.mockResolvedValue(jsonResponse(view, 409));
    const err = (await api("POST /onboarding/session-turn", { body: { sessionId: "s", turn: { kind: "CONTINUE" } } }).catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(409);
    expect(err.data).toEqual(view);
  });

  it("falls back to an http_<status> code when the body is not an error envelope", async () => {
    fetchMock.mockResolvedValue(new Response("<html>boom</html>", { status: 500 }));
    const err = (await api("GET /progress").catch((e: unknown) => e)) as ApiError;
    expect(err).toMatchObject({ status: 500, code: "http_500" });
  });

  it("maps network failures to status 0 with code network", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const err = (await api("GET /progress").catch((e: unknown) => e)) as ApiError;
    expect(err).toMatchObject({ status: 0, code: "network" });
  });

  it("a 401 clears the session", async () => {
    useSession.setState({ token: "old", user });
    fetchMock.mockResolvedValue(jsonResponse({ error: "unauthorized", message: "Sign in again" }, 401));

    const err = (await api("GET /me").catch((e: unknown) => e)) as ApiError;

    expect(err).toMatchObject({ status: 401, code: "unauthorized" });
    expect(useSession.getState().token).toBeNull();
    expect(useSession.getState().user).toBeNull();
  });

  it("returns undefined for 204 responses", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api("POST /notifications/read-all")).resolves.toBeUndefined();
  });

  it("uploadFile posts multipart form data to /api/uploads", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "f1", url: "http://x/files/a.txt", fileName: "a.txt", size: 3, mime: "text/plain" }));
    const file = new File(["abc"], "a.txt", { type: "text/plain" });
    const out = await uploadFile(file);
    expect(out.id).toBe("f1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8787/api/uploads");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
  });
});
