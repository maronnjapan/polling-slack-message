export type Priority = "low" | "normal" | "high" | "urgent";
export type TodoStatus = "open" | "in_progress" | "done" | "dismissed";
export type ReplyStatus = "draft" | "edited" | "approved" | "dismissed";
export type ChatTargetType = "slack_message" | "todo" | "reply";
export type RunType = "setup" | "manual" | "scheduled" | "chat";
export type RunStatus = "success" | "failed" | "partial" | "running";

export interface SlackMessage {
  id: string;
  source: {
    type: "slack";
    channel: string;
    messageTs: string;
    sender: string;
    permalink: string | null;
  };
  rawText: string;
  summary: string;
  isMentionedToMe: boolean;
  requiresAction: boolean;
  requiresReply: boolean;
  priority: Priority;
  relatedKnowledge: string[];
  reasonSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  sourceMessageId: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: Priority;
  due: string | null;
  reasonSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReplyDraft {
  id: string;
  sourceMessageId: string;
  status: ReplyStatus;
  draftReply: string;
  tone: string;
  reasonSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  target: { type: ChatTargetType; id: string };
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface RunError {
  message: string;
  command?: string;
  startedAt?: string;
  finishedAt?: string;
  exitCode?: number | null;
  stderrSummary?: string;
}

export interface AgentRun {
  id: string;
  type: RunType;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  createdMessages: string[];
  createdTodos: string[];
  createdReplies: string[];
  errors: RunError[];
}

export interface KnowledgeFile {
  path: string;
  updatedAt: string;
  content?: string;
}
