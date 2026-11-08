import { create } from "zustand";
import type { StoredSession, User } from "@pw/shared";
import { api } from "@/lib/api";
import { pw } from "@/lib/bridge";

export interface SessionState {
  /** False until the stored session has been read (pw.auth.getSession). Guards render a spinner until then. */
  hydrated: boolean;
  token: string | null;
  user: User | null;
  /** Read the stored session. */
  hydrate(): Promise<void>;
  /** Local email + name login (POST /auth/login), then store the session. */
  login(email: string, name?: string): Promise<void>;
  /** Electron only: system-browser login via a deep link. Throws in the web build. */
  loginWithBrowser(): Promise<void>;
  /** Clears the session in memory and in storage. */
  logout(): Promise<void>;
  /** Re-reads GET /me and stores the user. */
  refreshUser(): Promise<void>;
  /** Replaces the cached user (e.g. after PATCH /me). */
  setUser(user: User): void;
  /** Clears the session without a server call. Called on 401. */
  expire(): Promise<void>;
  /** Applies a session from storage or another window without writing it back. */
  applySession(session: StoredSession | null): void;
}

export const useSession = create<SessionState>()((set, get) => ({
  hydrated: false,
  token: null,
  user: null,

  applySession(session) {
    set({ token: session?.token ?? null, user: session?.user ?? null });
  },

  async hydrate() {
    try {
      get().applySession(await pw.auth.getSession());
    } catch {
      get().applySession(null);
    } finally {
      set({ hydrated: true });
    }
  },

  async login(email, name) {
    const res = await api("POST /auth/login", { body: { email, name } });
    const session: StoredSession = { token: res.token, user: res.user };
    await pw.auth.setSession(session);
    get().applySession(session);
  },

  async loginWithBrowser() {
    if (!pw.isElectron) throw new Error("Browser login is only available in the Proofwork desktop app.");
    const session = await pw.auth.startBrowserLogin();
    await pw.auth.setSession(session);
    get().applySession(session);
  },

  async logout() {
    await pw.auth.clearSession().catch(() => undefined);
    get().applySession(null);
  },

  async refreshUser() {
    const user = await api("GET /me");
    const token = get().token;
    if (token) await pw.auth.setSession({ token, user }).catch(() => undefined);
    set({ user });
  },

  setUser(user) {
    set({ user });
  },

  async expire() {
    await pw.auth.clearSession().catch(() => undefined);
    set({ token: null, user: null });
  },
}));

// One subscription for the life of the app: other windows and the main process push session changes here.
pw.auth.onSessionChanged((s) => useSession.getState().applySession(s));
