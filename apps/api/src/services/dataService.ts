import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readChats, readKnowledgeFiles, readMessages, readReplies, readRuns, readTodos, writeReply, writeTodo } from "agent-runner";
import type { ReplyDraft, TodoItem } from "shared/types";
import { byUpdatedDesc, nowIso } from "shared/utils";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");
const knowledgeRoot = path.join(repoRoot, "knowledge");

export const listMessages = async () => (await readMessages()).sort(byUpdatedDesc);
export const getMessage = async (id: string) => (await readMessages()).find((m) => m.id === id) ?? null;
export const listTodos = async () => ((await readTodos()) as TodoItem[]).sort(byUpdatedDesc);
export const getTodo = async (id: string) => ((await readTodos()) as TodoItem[]).find((t) => t.id === id) ?? null;
export const listReplies = async () => ((await readReplies()) as ReplyDraft[]).sort(byUpdatedDesc);
export const getReply = async (id: string) => ((await readReplies()) as ReplyDraft[]).find((r) => r.id === id) ?? null;
export const listRuns = async () => (await readRuns()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
export const getRun = async (id: string) => (await readRuns()).find((r) => r.id === id) ?? null;
export const getChatForTarget = async (type: any, id: string) => (await readChats()).find((c) => c.target.type === type && c.target.id === id) ?? null;

export async function patchTodo(id: string, patch: Partial<TodoItem>) {
  const todo = await getTodo(id);
  if (!todo) return null;
  const updated = { ...todo, ...patch, id: todo.id, updatedAt: nowIso() };
  await writeTodo(updated as TodoItem);
  return updated;
}
export async function patchReply(id: string, patch: Partial<ReplyDraft>) {
  const reply = await getReply(id);
  if (!reply) return null;
  const updated = { ...reply, ...patch, id: reply.id, updatedAt: nowIso() };
  await writeReply(updated as ReplyDraft);
  return updated;
}
export const listKnowledge = async () => (await readKnowledgeFiles()).map(({ path, updatedAt }) => ({ path, updatedAt }));
export async function getKnowledge(filePath: string) {
  const normalized = path.normalize(filePath).replace(/^[/\\]+/, "");
  if (normalized.startsWith("..") || path.isAbsolute(normalized) || !normalized.endsWith(".md")) return null;
  const fullPath = path.join(knowledgeRoot, normalized);
  try { return { path: normalized.split(path.sep).join("/"), updatedAt: (await fs.stat(fullPath)).mtime.toISOString(), content: await fs.readFile(fullPath, "utf8") }; } catch { return null; }
}
