import type { AppDb } from "../db.js";
import type { KnowledgeItem } from "shared/types";
export class KnowledgeRepository {
  constructor(private db: AppDb) {}
  upsert(item: {
    id: string;
    title: string;
    tags: string[];
    markdownPath: string;
    updatedAt: string;
  }) {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO knowledge_items (id,title,tags,markdown_path,updated_at) VALUES (?,?,?,?,?)",
      )
      .run(item.id, item.title, JSON.stringify(item.tags), item.markdownPath, item.updatedAt);
  }
  listMeta() {
    return this.db
      .prepare("SELECT * FROM knowledge_items ORDER BY updated_at DESC")
      .all()
      .map((r: any) => ({
        id: r.id,
        title: r.title,
        tags: JSON.parse(r.tags || "[]"),
        path: r.markdown_path,
        updatedAt: r.updated_at,
      }));
  }
}
