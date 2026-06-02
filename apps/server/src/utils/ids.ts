import { createHash, randomUUID } from "node:crypto";
export const newId = (prefix: string) => `${prefix}-${randomUUID()}`;
export const stableMessageId = (conversationId: string, ts: string) =>
  `slack-message-${createHash("sha1").update(`${conversationId}:${ts}`).digest("hex").slice(0, 16)}`;
