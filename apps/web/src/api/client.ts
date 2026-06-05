import type { AgentRun, AppSettings, ChatTargetType, ChatThread, KnowledgeFile, MessageStatus, ReplyDraft, ReplyStatus, SlackMessage, TodoItem, TodoStatus } from "shared/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8787/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, ...init });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface Stats { pendingMessages: number; openTodos: number; pendingReplies: number; }

export interface SlackMcpSetupStatus {
  configured: boolean;
  approvedTools: string[];
  requiredTools: string[];
}

export const api = {
  stats: () => request<Stats>("/stats"),
  messages: () => request<SlackMessage[]>("/messages"),
  message: (id: string) => request<SlackMessage>(`/messages/${id}`),
  patchMessage: (id: string, status: MessageStatus) => request<SlackMessage>(`/messages/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  todos: () => request<TodoItem[]>("/todos"),
  todo: (id: string) => request<TodoItem>(`/todos/${id}`),
  patchTodo: (id: string, status: TodoStatus) => request<TodoItem>(`/todos/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  replies: () => request<ReplyDraft[]>("/replies"),
  reply: (id: string) => request<ReplyDraft>(`/replies/${id}`),
  patchReply: (id: string, status: ReplyStatus) => request<ReplyDraft>(`/replies/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  chat: (type: ChatTargetType, id: string) => request<ChatThread>(`/chats/${type}/${id}`),
  sendChat: (type: ChatTargetType, id: string, message: string) => request<{ chat: ChatThread }>(`/chats/${type}/${id}/messages`, { method: "POST", body: JSON.stringify({ message }) }),
  runs: () => request<AgentRun[]>("/runs"),
  run: (id: string) => request<AgentRun>(`/runs/${id}`),
  approveRun: (id: string) => request<AgentRun>(`/runs/${id}/approve`, { method: "POST" }),
  agentRun: () => request<AgentRun>("/agent/run", { method: "POST" }),
  agentSetup: () => request<AgentRun>("/agent/setup", { method: "POST" }),
  knowledge: () => request<KnowledgeFile[]>("/knowledge"),
  knowledgeFile: (path: string) => request<KnowledgeFile>(`/knowledge/${path}`),
  saveKnowledge: (path: string, content: string) => request<KnowledgeFile>(`/knowledge/${path}`, { method: "PUT", body: JSON.stringify({ content }) }),
  settings: () => request<AppSettings>("/settings"),
  patchSettings: (patch: Partial<AppSettings>) => request<AppSettings>("/settings", { method: "PATCH", body: JSON.stringify(patch) }),
  slackSetupStatus: () => request<SlackMcpSetupStatus>("/slack/setup/status"),
  applySlackSetup: () => request<SlackMcpSetupStatus>("/slack/setup", { method: "POST" }),
};
