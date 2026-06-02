import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { KnowledgeItem } from "shared/types";
async function files(dir: string): Promise<string[]> {
  try {
    const ents = await readdir(dir);
    const out: string[] = [];
    for (const e of ents) {
      const p = join(dir, e);
      const s = await stat(p);
      if (s.isDirectory()) out.push(...(await files(p)));
      else if (p.endsWith(".md")) out.push(p);
    }
    return out;
  } catch {
    return [];
  }
}
function titleOf(content: string, path: string) {
  return (
    content.match(/^title:\s*"?([^"\n]+)"?/m)?.[1] ??
    content.match(/^#\s+(.+)$/m)?.[1] ??
    path.split("/").pop() ??
    path
  );
}
export class KnowledgeSearch {
  constructor(private rootDir: string) {}
  async search(query: string, limit = 5): Promise<KnowledgeItem[]> {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1)
      .slice(0, 20);
    const scored = [] as Array<{ score: number; item: KnowledgeItem }>;
    for (const path of await files(this.rootDir)) {
      const content = await readFile(path, "utf8");
      const lc = content.toLowerCase();
      const score = terms.reduce((n, t) => n + (lc.includes(t) ? 1 : 0), 0);
      if (score > 0)
        scored.push({
          score,
          item: {
            id: path,
            title: titleOf(content, path),
            summary: content.replace(/^---[\s\S]*?---/, "").slice(0, 200),
            reason: `${score}件の語句が一致`,
            path,
            tags: [],
            content,
            updatedAt: new Date().toISOString(),
          },
        });
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.item);
  }
  async list(): Promise<KnowledgeItem[]> {
    return Promise.all(
      (await files(this.rootDir)).map(async (path) => {
        const content = await readFile(path, "utf8");
        return {
          id: path,
          title: titleOf(content, path),
          summary: content.replace(/^---[\s\S]*?---/, "").slice(0, 200),
          reason: "保存済みナレッジ",
          path,
          tags: [],
          content,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }
}
