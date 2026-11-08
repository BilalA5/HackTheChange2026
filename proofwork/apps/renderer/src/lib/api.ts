import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  API_PREFIX,
  type ApiRoute,
  type RouteBody,
  type RouteQuery,
  type RouteRes,
  type UploadResult,
} from "@pw/shared";
import { pw } from "./bridge";
import { WEB_SERVER_URL } from "./env";
import { useSession } from "@/stores/session";

/** Error thrown for every non-2xx response and for network failures (status 0, code "network"). */
export class ApiError extends Error {
  readonly status: number;
  /** Machine code from the server body, e.g. "unauthorized", "locked", "insufficient_credits". */
  readonly code: string;
  /** Parsed response body when there was one. A 409 from /onboarding carries the authoritative view here. */
  readonly data: unknown;

  constructor(status: number, code: string, message: string, data: unknown = undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export type GetRoute = Extract<ApiRoute, `GET ${string}`>;

export interface ApiOptions<R extends ApiRoute> {
  /** Fills `:name` placeholders in the route. */
  params?: Record<string, string>;
  query?: RouteQuery<R>;
  body?: RouteBody<R>;
  signal?: AbortSignal;
}

// ───────────────────────────── server origin ─────────────────────────────

let resolvedServerUrl: string = WEB_SERVER_URL;
let serverUrlPromise: Promise<string> | null = null;

/**
 * Server origin (no trailing slash). Electron asks pw.app.getInfo(); the web build uses VITE_SERVER_URL.
 * The result is cached and also readable synchronously via currentServerUrl() (used by WebSocket URLs).
 */
export function getServerUrl(): Promise<string> {
  if (!serverUrlPromise) {
    serverUrlPromise = pw.isElectron
      ? pw.app
          .getInfo()
          .then((info) => {
            resolvedServerUrl = info.serverUrl;
            return info.serverUrl;
          })
          .catch(() => {
            serverUrlPromise = null;
            return resolvedServerUrl;
          })
      : Promise.resolve(WEB_SERVER_URL);
  }
  return serverUrlPromise;
}

/** Synchronous view of the server origin. Kick getServerUrl() once at startup so Electron has resolved it. */
export function currentServerUrl(): string {
  void getServerUrl();
  return resolvedServerUrl;
}

// ───────────────────────────── helpers (exported for tests) ─────────────────────────────

/** Replaces `:name` placeholders with URI-encoded params. Throws when a param is missing. */
export function fillPath(pathTemplate: string, params: Record<string, string> = {}): string {
  return pathTemplate.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name: string) => {
    const v = params[name];
    if (v === undefined) throw new Error(`Missing route param :${name} in ${pathTemplate}`);
    return encodeURIComponent(v);
  });
}

/** Query string with a leading "?", or "" when empty. Skips undefined and null values. */
export function buildQuery(query?: Record<string, unknown>): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function splitRoute(route: string): { method: string; path: string } {
  const i = route.indexOf(" ");
  return { method: route.slice(0, i), path: route.slice(i + 1) };
}

/** Cache key: "METHOD /resolved/path?query". invalidate() matches on this prefix. */
export function routeKey(route: ApiRoute, params?: Record<string, string>, query?: unknown): string {
  const { method, path } = splitRoute(route);
  return `${method} ${fillPath(path, params)}${buildQuery(query as Record<string, unknown> | undefined)}`;
}

function bearer(): Record<string, string> {
  const token = useSession.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = text;
    }
  }
  if (res.ok) return json as T;

  let code = `http_${res.status}`;
  let message = `Request failed (${res.status}).`;
  if (typeof json === "object" && json !== null) {
    const body = json as { error?: unknown; message?: unknown };
    if (typeof body.error === "string") code = body.error;
    if (typeof body.message === "string") message = body.message;
  }
  if (res.status === 401) {
    // The token is no longer valid: forget the session so the guard sends the user to /login.
    await useSession.getState().expire();
  }
  throw new ApiError(res.status, code, message, json);
}

async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    if (init.signal?.aborted) throw e;
    throw new ApiError(0, "network", "Cannot reach the Proofwork server. Check that it is running.");
  }
}

// ───────────────────────────── typed client ─────────────────────────────

/**
 * Typed REST call. `route` is a key of ApiRoutes, e.g. "GET /scenarios/:id".
 * Adds the Bearer token, sends JSON bodies, and throws ApiError. A 401 clears the session.
 */
export async function api<R extends ApiRoute>(route: R, opts: ApiOptions<R> = {}): Promise<RouteRes<R>> {
  const { method, path } = splitRoute(route);
  const base = await getServerUrl();
  const url = `${base}${API_PREFIX}${fillPath(path, opts.params)}${buildQuery(opts.query as Record<string, unknown> | undefined)}`;
  const headers: Record<string, string> = { Accept: "application/json", ...bearer() };
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await send(url, { method, headers, body, signal: opts.signal });
  return readResponse<RouteRes<R>>(res);
}

/** Multipart upload to POST /api/uploads (field "file", max 25 MB). Not in ApiRoutes, so typed by hand. */
export async function uploadFile(file: File, signal?: AbortSignal): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file, file.name);
  const base = await getServerUrl();
  const res = await send(`${base}${API_PREFIX}/uploads`, { method: "POST", headers: bearer(), body: fd, signal });
  return readResponse<UploadResult>(res);
}

// ───────────────────────────── SWR-lite hook ─────────────────────────────

const REFOCUS_MIN_MS = 15_000;

interface CacheEntry {
  data: unknown;
  error: Error | null;
  loading: boolean;
  /** Time of the last fetch start, used for the focus throttle. */
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const keyListeners = new Map<string, Set<() => void>>();
const mounted = new Map<number, { key: string; run: () => void }>();
let mountSeq = 0;

function setEntry(key: string, patch: Partial<CacheEntry>): void {
  const prev = cache.get(key);
  cache.set(key, {
    data: prev?.data,
    error: null,
    loading: false,
    fetchedAt: prev?.fetchedAt ?? 0,
    ...patch,
  });
  keyListeners.get(key)?.forEach((cb) => cb());
}

export interface UseApiResult<R extends ApiRoute> {
  data: RouteRes<R> | undefined;
  error: Error | null;
  loading: boolean;
  /** Fetch again now. */
  reload: () => void;
  /** Replace the cached data locally (optimistic update), or compute it from the previous value. */
  mutate: (next: RouteRes<R> | ((prev: RouteRes<R> | undefined) => RouteRes<R>)) => void;
}

/**
 * Re-fetches every mounted useApi whose key starts with `prefix`, e.g. invalidate("GET /progress")
 * or invalidate("GET /objectives/abc"). Keys are "METHOD /resolved/path?query".
 */
export function invalidate(prefix: string): void {
  for (const m of mounted.values()) {
    if (m.key.startsWith(prefix)) m.run();
  }
}

/**
 * GET hook with an in-memory cache keyed by route + params + query. Pass `null` as opts to stay idle.
 * `deps` are extra values that refetch when they change.
 */
export function useApi<R extends GetRoute>(
  route: R,
  opts: ApiOptions<R> | null = {},
  deps: readonly unknown[] = [],
): UseApiResult<R> {
  const key = opts ? routeKey(route, opts.params, opts.query) : null;
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const abortRef = useRef<AbortController | null>(null);

  const subscribe = useCallback(
    (cb: () => void) => {
      if (key === null) return () => {};
      const set = keyListeners.get(key) ?? new Set<() => void>();
      keyListeners.set(key, set);
      set.add(cb);
      return () => {
        set.delete(cb);
      };
    },
    [key],
  );
  const getSnapshot = useCallback(() => (key === null ? undefined : cache.get(key)), [key]);
  const entry = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const fetchNow = useCallback(() => {
    if (key === null) return;
    const o = optsRef.current;
    if (!o) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setEntry(key, { loading: true, fetchedAt: Date.now() });
    api(route, { ...o, signal: ctrl.signal } as ApiOptions<R>)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setEntry(key, { data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (ctrl.signal.aborted) return;
        setEntry(key, { error: error instanceof Error ? error : new Error(String(error)), loading: false });
      });
  }, [key, route]);

  useEffect(() => {
    if (key === null) return;
    const id = ++mountSeq;
    mounted.set(id, { key, run: fetchNow });
    fetchNow();
    return () => {
      mounted.delete(id);
      abortRef.current?.abort();
    };
    // deps are caller-supplied refetch triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fetchNow, ...deps]);

  useEffect(() => {
    if (key === null) return;
    const onFocus = () => {
      const e = cache.get(key);
      if (!e || Date.now() - e.fetchedAt >= REFOCUS_MIN_MS) fetchNow();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [key, fetchNow]);

  const mutate = useCallback<UseApiResult<R>["mutate"]>(
    (next) => {
      if (key === null) return;
      const prev = cache.get(key)?.data as RouteRes<R> | undefined;
      const value = typeof next === "function" ? (next as (p: RouteRes<R> | undefined) => RouteRes<R>)(prev) : next;
      setEntry(key, { data: value, error: null, loading: false });
    },
    [key],
  );

  return {
    data: entry?.data as RouteRes<R> | undefined,
    error: entry?.error ?? null,
    loading: entry?.loading ?? key !== null,
    reload: fetchNow,
    mutate,
  };
}

/** Test helper: clears the module cache. Not for app code. */
export function __resetApiCacheForTests(): void {
  cache.clear();
  keyListeners.clear();
  mounted.clear();
}
