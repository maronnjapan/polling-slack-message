import { promises as fs } from "node:fs";
import path from "node:path";
import type { AppSettings, ChatTargetType } from "shared/types";
import { agentRunSchema, appSettingsSchema, chatThreadSchema, replySchema, slackMessageSchema, todoSchema } from "shared/schemas";
import { dataDir, knowledgeDir } from "./paths.js";

const settingsPath = path.join(dataDir, "settings.json");

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = JSON.parse(await fs.readFile(settingsPath, "utf8"));
    return appSettingsSchema.parse(raw);
  } catch {
    return appSettingsSchema.parse({});
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

export async function ensureDataDirs() {
  await Promise.all(["messages", "todos", "replies", "chats", "runs"].map((d) => fs.mkdir(path.join(dataDir, d), { recursive: true })));
}

async function walk(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((e: any) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : Promise.resolve([p]);
    }));
    return files.flat();
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function readJsonFiles<T>(subdir: string, schema: { parse: (value: unknown) => T }): Promise<T[]> {
  const files = (await walk(path.join(dataDir, subdir))).filter((f) => f.endsWith(".json"));
  const out: T[] = [];
  for (const file of files) out.push(schema.parse(JSON.parse(await fs.readFile(file, "utf8"))));
  return out;
}

export const readMessages = () => readJsonFiles("messages", slackMessageSchema);
export const readTodos = () => readJsonFiles("todos", todoSchema);
export const readReplies = () => readJsonFiles("replies", replySchema);
export const readChats = () => readJsonFiles("chats", chatThreadSchema);
export const readRuns = () => readJsonFiles("runs", agentRunSchema);

export async function findChat(targetType: ChatTargetType, targetId: string) {
  return (await readChats()).find((c) => c.target.type === targetType && c.target.id === targetId) ?? null;
}

export async function readKnowledgeFiles() {
  const files = (await walk(knowledgeDir)).filter((f) => f.endsWith(".md"));
  return Promise.all(files.map(async (file) => ({
    path: path.relative(knowledgeDir, file).split(path.sep).join("/"),
    updatedAt: (await fs.stat(file)).mtime.toISOString(),
    content: await fs.readFile(file, "utf8"),
  })));
}

export async function findTargetContext(targetType: ChatTargetType, targetId: string) {
  const [messages, todos, replies, chats, knowledge] = await Promise.all([readMessages(), readTodos(), readReplies(), readChats(), readKnowledgeFiles()]);
  const target = targetType === "slack_message" ? messages.find((m) => m.id === targetId) : targetType === "todo" ? todos.find((t) => t.id === targetId) : replies.find((r) => r.id === targetId);
  const sourceMessageId = targetType === "slack_message" ? targetId : target && "sourceMessageId" in target ? target.sourceMessageId : undefined;
  return {
    target,
    sourceMessage: messages.find((m) => m.id === sourceMessageId),
    todos: todos.filter((t) => t.sourceMessageId === sourceMessageId),
    replies: replies.filter((r) => r.sourceMessageId === sourceMessageId),
    chat: chats.find((c) => c.target.type === targetType && c.target.id === targetId) ?? null,
    knowledge: knowledge.map(({ path, updatedAt }) => ({ path, updatedAt })),
  };
}
