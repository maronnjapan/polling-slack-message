import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AppConfig } from "./appConfig.js";
export function loadConfig(): AppConfig {
  const path = process.env.APP_CONFIG_PATH ?? resolve(process.cwd(), "config/app.json");
  const raw = JSON.parse(readFileSync(path,"utf8"));
  return {
    ...raw,
    app: { ...raw.app, port: Number(process.env.APP_PORT ?? raw.app.port), baseUrl: process.env.APP_BASE_URL ?? raw.app.baseUrl },
    web: { ...raw.web, origin: process.env.WEB_ORIGIN ?? raw.web.origin },
    ai: { ...raw.ai, provider: process.env.AI_PROVIDER ?? raw.ai.provider, model: process.env.AI_MODEL ?? raw.ai.model },
    storage: { ...raw.storage, dataDir: process.env.DATA_DIR ?? raw.storage.dataDir, sqlitePath: process.env.SQLITE_PATH ?? raw.storage.sqlitePath }
  };
}
