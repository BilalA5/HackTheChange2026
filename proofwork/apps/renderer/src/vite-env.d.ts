/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override of the server origin for the web build, e.g. http://127.0.0.1:8787 */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
