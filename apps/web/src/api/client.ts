import type { AiStatus, MessageDetail, MessageListItem, PollingStatus } from "shared/types";
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5174";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export const api = {
  health: () => request<{ ok: boolean }>("/api/health"),
  aiStatus: () => request<AiStatus>("/api/ai/status"),
  mcpStatus: () => request<any>("/api/mcp/status"),
  pollingStatus: () => request<PollingStatus>("/api/polling/status"),
  pollingStart: () => request<PollingStatus>("/api/polling/start", { method: "POST" }),
  pollingStop: () => request<PollingStatus>("/api/polling/stop", { method: "POST" }),
  pollingRunOnce: () => request<PollingStatus>("/api/polling/run-once", { method: "POST" }),
  messages: (status?: string) =>
    request<{ messages: MessageListItem[] }>(`/api/messages${status ? `?status=${status}` : ""}`),
  message: (id: string) => request<MessageDetail>(`/api/messages/${id}`),
  updateStatus: (id: string, status: string) =>
    request<{ ok: boolean }>(`/api/messages/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  chat: (id: string, message: string) =>
    request<any>(`/api/messages/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  knowledge: () => request<any>("/api/knowledge"),
  createKnowledge: (body: {
    title: string;
    content: string;
    tags: string[];
    sourceMessageId?: string;
  }) =>
    request<any>("/api/knowledge", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
