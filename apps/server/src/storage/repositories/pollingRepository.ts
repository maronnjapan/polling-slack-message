import type { AppDb } from "../db.js";
import { nowIso } from "../../utils/date.js";
export class PollingRepository {
  constructor(private db: AppDb) {}
  get(key: string) {
    return (this.db.prepare("SELECT value FROM polling_state WHERE key=?").get(key) as any)
      ?.value as string | undefined;
  }
  set(key: string, value: string) {
    this.db
      .prepare("INSERT OR REPLACE INTO polling_state (key,value,updated_at) VALUES (?,?,?)")
      .run(key, value, nowIso());
  }
  updateLastPolledAt(date = new Date()) {
    this.set("lastPolledAt", date.toISOString());
  }
  lastPolledAt() {
    return this.get("lastPolledAt");
  }
  setLastError(error?: string) {
    if (error) this.set("lastError", error);
    else this.db.prepare("DELETE FROM polling_state WHERE key='lastError'").run();
  }
  lastError() {
    return this.get("lastError");
  }
}
