import { promises as fs } from "node:fs";
import path from "node:path";
import type { AgentRun, ChatThread, ReplyDraft, SlackMessage, TodoItem } from "shared/types";
import { dataDir } from "../readers/paths.js";
import { ensureDataDirs, readMessages } from "../readers/fileStore.js";
import { chatMarkdown, messageMarkdown, replyMarkdown, runMarkdown, todoMarkdown } from "./markdown.js";

async function writeJsonAndMd(fileBase: string, data: unknown, md: string) {
  await fs.mkdir(path.dirname(fileBase), { recursive: true });
  await fs.writeFile(`${fileBase}.json`, `${JSON.stringify(data, null, 2)}\n`);
  await fs.writeFile(`${fileBase}.md`, md);
}

export async function writeMessage(message: SlackMessage) {
  await ensureDataDirs();
  const existing = (await readMessages()).find((m) => m.source.type === message.source.type && m.source.channel === message.source.channel && m.source.messageTs === message.source.messageTs);
  const saved = existing ? { ...message, id: existing.id, createdAt: existing.createdAt, updatedAt: message.updatedAt } : message;
  const day = saved.createdAt.slice(0, 10);
  await writeJsonAndMd(path.join(dataDir, "messages", day, saved.id), saved, messageMarkdown(saved));
  return saved;
}
export async function writeTodo(todo: TodoItem) {
  await ensureDataDirs();
  await writeJsonAndMd(path.join(dataDir, "todos", todo.id), todo, todoMarkdown(todo));
}
export async function writeReply(reply: ReplyDraft) {
  await ensureDataDirs();
  await writeJsonAndMd(path.join(dataDir, "replies", reply.id), reply, replyMarkdown(reply));
}
export async function writeChat(chat: ChatThread) {
  await ensureDataDirs();
  await writeJsonAndMd(path.join(dataDir, "chats", chat.id), chat, chatMarkdown(chat));
}
export async function writeRun(run: AgentRun) {
  await ensureDataDirs();
  await writeJsonAndMd(path.join(dataDir, "runs", run.id), run, runMarkdown(run));
}
