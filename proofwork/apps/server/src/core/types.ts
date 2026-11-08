import type { AiEngine } from "../contracts.ts";
import type { ContentIndex } from "./content.ts";
import type { Db } from "./db.ts";
import type { Hub } from "./hub.ts";

export type LogFn = (msg: string, extra?: Record<string, unknown>) => void;

export interface Paths {
  dataDir: string;
  uploadsDir: string;
  screenshotsDir: string;
}

/** Everything the services need. Built once per server instance. */
export interface Core {
  db: Db;
  content: ContentIndex;
  ai: AiEngine;
  paths: Paths;
  jwtSecret: Uint8Array;
  hub: Hub;
  log: LogFn;
}
