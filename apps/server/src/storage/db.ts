import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
export function createDb(sqlitePath: string) {
  const path = resolve(process.cwd(), sqlitePath); mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path); db.pragma("journal_mode = WAL");
  db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  return db;
}
export type AppDb = ReturnType<typeof createDb>;
