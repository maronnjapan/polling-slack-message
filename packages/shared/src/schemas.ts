import { z } from "zod";
export const inquiryStatusSchema = z.enum(["open", "in_progress", "pending", "done", "not_needed"]);
export const knowledgeCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  sourceMessageId: z.string().optional(),
});
export const chatRequestSchema = z.object({ message: z.string().min(1) });
export const statusUpdateSchema = z.object({ status: inquiryStatusSchema });
export const inquiryAnalysisSchema = z.object({
  summary: z.string(),
  replyRequired: z.boolean(),
  todoRequired: z.boolean(),
  suggestedReplies: z.array(z.string()),
  todos: z.array(z.string()),
  questionsToUser: z.array(z.string()),
  references: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        summary: z.string().optional(),
        reason: z.string().optional(),
        path: z.string(),
      }),
    )
    .default([]),
  urgency: z.enum(["low", "medium", "high"]),
  confidence: z.enum(["low", "medium", "high"]),
});
