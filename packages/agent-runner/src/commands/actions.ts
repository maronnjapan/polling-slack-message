import { randomUUID } from "node:crypto";
import type { AgentRun, ChatTargetType } from "shared/types";
import { nowIso } from "shared/utils";
import { needsSlackMcpApproval, runCodex, slackMcpApprovalTools } from "../codex/runCodex.js";
import { ensureDataDirs, findChat, findTargetContext, readMessages, readReplies, readRuns, readSettings, readTodos } from "../readers/fileStore.js";
import { writeChat, writeRun } from "../writers/writeData.js";
import { buildChatPrompt } from "../prompts/chatPrompt.js";
import { buildNormalRunPrompt, setupPrompt } from "../prompts/runPrompt.js";

function runId() {
  return `run-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;
}

function createRun(type: AgentRun["type"], startedAt: string): AgentRun {
  return {
    id: runId(),
    type,
    status: "running",
    startedAt,
    finishedAt: null,
    createdMessages: [],
    createdTodos: [],
    createdReplies: [],
    errors: [],
    approvalRequest: null,
  };
}

function markApprovalRequired(run: AgentRun, result: Awaited<ReturnType<typeof runCodex>>, requestedAt: string) {
  run.status = "approval_required";
  run.finishedAt = requestedAt;
  run.approvalRequest = {
    type: "slack_mcp_tools",
    status: "pending",
    requestedAt,
    tools: slackMcpApprovalTools,
    reason: "Slack MCP tool execution requires human approval before Codex can continue.",
  };
  run.errors.push({
    message: "Slack MCP tool approval required",
    command: result.command,
    startedAt: run.startedAt,
    finishedAt: requestedAt,
    exitCode: result.exitCode,
    stderrSummary: result.stderr.slice(0, 1000),
  });
}

function markFinished(run: AgentRun, result: Awaited<ReturnType<typeof runCodex>>, startedAt: string) {
  run.finishedAt = nowIso();
  run.status = result.exitCode === 0 ? "success" : "failed";
  if (result.exitCode !== 0) {
    run.errors.push({
      message: "Codex CLI execution failed",
      command: result.command,
      startedAt,
      finishedAt: run.finishedAt,
      exitCode: result.exitCode,
      stderrSummary: result.stderr.slice(0, 1000),
    });
  }
}


async function snapshotIds() {
  const [messages, todos, replies] = await Promise.all([readMessages(), readTodos(), readReplies()]);
  return {
    messages: new Set(messages.map((m) => m.id)),
    todos: new Set(todos.map((t) => t.id)),
    replies: new Set(replies.map((r) => r.id)),
  };
}

async function diffCreated(before: Awaited<ReturnType<typeof snapshotIds>>) {
  const [messages, todos, replies] = await Promise.all([readMessages(), readTodos(), readReplies()]);
  return {
    messages: messages.filter((m) => !before.messages.has(m.id)).map((m) => m.id),
    todos: todos.filter((t) => !before.todos.has(t.id)).map((t) => t.id),
    replies: replies.filter((r) => !before.replies.has(r.id)).map((r) => r.id),
  };
}

export async function executeCodexRun(type: "setup" | "manual" | "scheduled") {
  await ensureDataDirs();
  const startedAt = nowIso();
  const run = createRun(type, startedAt);
  const settings = type !== "setup" ? await readSettings() : null;
  const prompt = type === "setup" ? setupPrompt : buildNormalRunPrompt(settings?.allowedChannels, settings?.channelConfigs);
  const mode = type === "setup" ? "setup" : "normal";
  run.codexRequest = { mode, prompt };
  await writeRun(run);
  const before = await snapshotIds();
  const result = await runCodex(prompt, mode);
  const created = await diffCreated(before);
  run.createdMessages = created.messages;
  run.createdTodos = created.todos;
  run.createdReplies = created.replies;
  if (needsSlackMcpApproval(result)) {
    markApprovalRequired(run, result, nowIso());
  } else {
    markFinished(run, result, startedAt);
  }
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
  const run = createRun("chat", startedAt);
  const context = await findTargetContext(targetType, targetId);
  const chatPrompt = buildChatPrompt(targetType, targetId, message, context);
  run.codexRequest = { mode: "normal", prompt: chatPrompt };
  await writeRun(run);
  const before = await snapshotIds();
  const result = await runCodex(chatPrompt, "normal");
  const created = await diffCreated(before);
  run.createdMessages = created.messages;
  run.createdTodos = created.todos;
  run.createdReplies = created.replies;
  if (needsSlackMcpApproval(result)) {
    markApprovalRequired(run, result, nowIso());
  } else {
    markFinished(run, result, startedAt);
  }
  if (run.status === "failed") {
    const fallback = "Codex CLIで回答生成できませんでした。Codex CLI、profile slack-assistant、MCP設定を確認してください。";
    const failedAt = run.finishedAt ?? nowIso();
    chat.messages.push({ role: "assistant", content: fallback, createdAt: failedAt });
    chat.updatedAt = failedAt;
    await writeChat(chat);
  }
  await writeRun(run);
  return { chat, run };
}

export async function approveCodexRun(runId: string) {
  await ensureDataDirs();
  const run = (await readRuns()).find((item) => item.id === runId);
  if (!run) throw new Error(`Run not found: ${runId}`);
  if (run.status !== "approval_required" || run.approvalRequest?.status !== "pending") {
    throw new Error(`Run is not waiting for approval: ${runId}`);
  }

  const approvedAt = nowIso();
  const request = run.codexRequest;
  if (!request) throw new Error(`Run has no stored codex request: ${runId}`);
  run.status = "running";
  run.finishedAt = null;
  run.approvalRequest = { ...run.approvalRequest, status: "approved", approvedAt };
  await writeRun(run);

  const before = await snapshotIds();
  const result = await runCodex(request.prompt, request.mode, { approveSlackMcpTools: true });
  const created = await diffCreated(before);
  run.createdMessages = [...new Set([...run.createdMessages, ...created.messages])];
  run.createdTodos = [...new Set([...run.createdTodos, ...created.todos])];
  run.createdReplies = [...new Set([...run.createdReplies, ...created.replies])];
  markFinished(run, result, approvedAt);
  await writeRun(run);
  return run;
}
