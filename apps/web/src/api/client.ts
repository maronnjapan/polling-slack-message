import type { AgentRun, ChatTargetType, ChatThread, KnowledgeFile, ReplyDraft, SlackMessage, TodoItem } from "shared/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8787/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, ...init });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  messages: () => request<SlackMessage[]>("/messages"),
  message: (id: string) => request<SlackMessage>(`/messages/${id}`),
  todos: () => request<TodoItem[]>("/todos"),
  todo: (id: string) => request<TodoItem>(`/todos/${id}`),
  patchTodo: (id: string, body: Partial<TodoItem>) => request<TodoItem>(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  replies: () => request<ReplyDraft[]>("/replies"),
  reply: (id: string) => request<ReplyDraft>(`/replies/${id}`),
  patchReply: (id: string, body: Partial<ReplyDraft>) => request<ReplyDraft>(`/replies/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  chat: (type: ChatTargetType, id: string) => request<ChatThread>(`/chats/${type}/${id}`),
  sendChat: (type: ChatTargetType, id: string, message: string) => request<{ chat: ChatThread }>(`/chats/${type}/${id}/messages`, { method: "POST", body: JSON.stringify({ message }) }),
  runs: () => request<AgentRun[]>("/runs"),
  run: (id: string) => request<AgentRun>(`/runs/${id}`),
  agentRun: () => request<AgentRun>("/agent/run", { method: "POST" }),
  agentSetup: () => request<AgentRun>("/agent/setup", { method: "POST" }),
  knowledge: () => request<KnowledgeFile[]>("/knowledge"),
  knowledgeFile: (path: string) => request<KnowledgeFile>(`/knowledge/${path}`),
};
