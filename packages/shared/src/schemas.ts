import { z } from "zod";

export const prioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export const messageStatusSchema = z.enum(["active", "done"]);
export const todoStatusSchema = z.enum(["open", "in_progress", "done", "dismissed"]);
export const replyStatusSchema = z.enum(["draft", "edited", "approved", "dismissed"]);
export const chatTargetTypeSchema = z.enum(["slack_message", "todo", "reply"]);
export const runTypeSchema = z.enum(["setup", "manual", "scheduled", "chat"]);
export const runStatusSchema = z.enum(["success", "failed", "partial", "running", "approval_required"]);

export const slackMessageSchema = z.object({
  id: z.string().min(1),
  source: z.object({
    type: z.literal("slack"),
    channel: z.string(),
    messageTs: z.string(),
    sender: z.string(),
    permalink: z.string().nullable(),
  }),
  rawText: z.string(),
  summary: z.string(),
  isMentionedToMe: z.boolean(),
  requiresAction: z.boolean(),
  requiresReply: z.boolean(),
  priority: prioritySchema,
  relatedKnowledge: z.array(z.string()),
  reasonSummary: z.string(),
  status: messageStatusSchema.optional().default("active"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const todoSchema = z.object({
  id: z.string().min(1),
  sourceMessageId: z.string(),
  title: z.string(),
  description: z.string(),
  status: todoStatusSchema,
  priority: prioritySchema,
  due: z.string().nullable(),
  reasonSummary: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const replySchema = z.object({
  id: z.string().min(1),
  sourceMessageId: z.string(),
  status: replyStatusSchema,
  draftReply: z.string(),
  tone: z.string(),
  reasonSummary: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string(),
});

export const chatThreadSchema = z.object({
  id: z.string(),
  target: z.object({ type: chatTargetTypeSchema, id: z.string() }),
  messages: z.array(chatMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const runErrorSchema = z.object({
  message: z.string(),
  command: z.string().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  exitCode: z.number().nullable().optional(),
  stderrSummary: z.string().optional(),
});

export const runApprovalRequestSchema = z.object({
  type: z.literal("slack_mcp_tools"),
  status: z.enum(["pending", "approved"]),
  requestedAt: z.string(),
  approvedAt: z.string().optional(),
  tools: z.array(z.string()),
  reason: z.string(),
});

export const agentRunSchema = z.object({
  id: z.string(),
  type: runTypeSchema,
  status: runStatusSchema,
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  createdMessages: z.array(z.string()),
  createdTodos: z.array(z.string()),
  createdReplies: z.array(z.string()),
  errors: z.array(runErrorSchema),
  approvalRequest: runApprovalRequestSchema.nullable().optional(),
});

export const chatRequestSchema = z.object({ message: z.string().min(1) });
export const messagePatchSchema = z.object({ status: messageStatusSchema.optional() });
export const todoPatchSchema = z.object({ status: todoStatusSchema.optional(), priority: prioritySchema.optional(), due: z.string().nullable().optional() });
export const replyPatchSchema = z.object({ status: replyStatusSchema.optional(), draftReply: z.string().optional(), tone: z.string().optional() });

export const appSettingsSchema = z.object({
  allowedChannels: z.array(z.string()).default([]),
});
export const settingsPatchSchema = z.object({
  allowedChannels: z.array(z.string()).optional(),
});
