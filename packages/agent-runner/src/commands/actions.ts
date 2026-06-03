import { randomUUID } from "node:crypto";
import type { AgentRun, ChatTargetType } from "shared/types";
import { nowIso } from "shared/utils";
import { runCodex } from "../codex/runCodex.js";
import { ensureDataDirs, findChat, findTargetContext } from "../readers/fileStore.js";
import { writeChat, writeRun } from "../writers/writeData.js";
import { buildChatPrompt } from "../prompts/chatPrompt.js";
import { normalRunPrompt, setupPrompt } from "../prompts/runPrompt.js";

function runId() {
  return `run-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;
}

export async function executeCodexRun(type: "setup" | "manual" | "scheduled") {
  await ensureDataDirs();
  const startedAt = nowIso();
  const run: AgentRun = { id: runId(), type, status: "running", startedAt, finishedAt: null, createdMessages: [], createdTodos: [], createdReplies: [], errors: [] };
  await writeRun(run);
  const result = await runCodex(type === "setup" ? setupPrompt : normalRunPrompt, type === "setup" ? "setup" : "normal");
  run.finishedAt = nowIso();
  run.status = result.exitCode === 0 ? "success" : "failed";
  if (result.exitCode !== 0) run.errors.push({ message: "Codex CLI execution failed", command: result.command, startedAt, finishedAt: run.finishedAt, exitCode: result.exitCode, stderrSummary: result.stderr.slice(0, 1000) });
  await writeRun(run);
  return run;
}

export async function executeChat(targetType: ChatTargetType, targetId: string, message: string) {
  await ensureDataDirs();
  const now = nowIso();
  const existing = await findChat(targetType, targetId) as import("shared/types").ChatThread | null;
  const chat: import("shared/types").ChatThread = existing ?? ({ id: `chat-${randomUUID()}`, target: { type: targetType, id: targetId }, messages: [], createdAt: now, updatedAt: now } as import("shared/types").ChatThread);
  chat.messages.push({ role: "user", content: message, createdAt: now });
  chat.updatedAt = now;
  await writeChat(chat);

  const startedAt = nowIso();
  const run: AgentRun = { id: runId(), type: "chat", status: "running", startedAt, finishedAt: null, createdMessages: [], createdTodos: [], createdReplies: [], errors: [] };
  await writeRun(run);
  const context = await findTargetContext(targetType, targetId);
  const result = await runCodex(buildChatPrompt(targetType, targetId, message, context), "normal");
  run.finishedAt = nowIso();
  run.status = result.exitCode === 0 ? "success" : "failed";
  if (result.exitCode !== 0) {
    const fallback = "Codex CLIで回答生成できませんでした。Codex CLI、profile slack-assistant、MCP設定を確認してください。";
    chat.messages.push({ role: "assistant", content: fallback, createdAt: run.finishedAt });
    chat.updatedAt = run.finishedAt;
    run.errors.push({ message: "Codex CLI chat execution failed", command: result.command, startedAt, finishedAt: run.finishedAt, exitCode: result.exitCode, stderrSummary: result.stderr.slice(0, 1000) });
    await writeChat(chat);
  }
  await writeRun(run);
  return { chat, run };
}
