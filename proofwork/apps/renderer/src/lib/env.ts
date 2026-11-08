import { DEFAULT_SERVER_URL } from "@pw/shared";

/** Server origin used by the plain-browser build. Electron gets its value from pw.app.getInfo(). */
export const WEB_SERVER_URL: string = import.meta.env.VITE_SERVER_URL ?? DEFAULT_SERVER_URL;
