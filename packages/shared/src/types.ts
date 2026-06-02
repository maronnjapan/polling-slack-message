export type Urgency = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";
export type InquiryStatus = "open" | "in_progress" | "pending" | "done" | "not_needed";
export type ConversationType = "public_channel" | "private_channel" | "im" | "mpim" | "unknown";
export type RelevanceCategory = "direct_message" | "mention_to_me" | "reply_to_my_thread" | "question" | "request" | "todo_required" | "information_only" | "noise" | "unknown";

export type NormalizedSlackMessage = {
  id: string; source: "slack"; conversationId: string; conversationName?: string; conversationType: ConversationType;
  userId?: string; userName?: string; text: string; ts: string; threadTs?: string; permalink?: string;
  rawFilePath: string; markdownPath: string; receivedAt: string;
};
export type SlackMcpMessage = { id?: string; channelId?: string; channelName?: string; conversationId?: string; conversationName?: string; conversationType?: ConversationType; userId?: string; userName?: string; text: string; ts?: string; timestamp?: string; threadTs?: string; permalink?: string; raw?: unknown; botId?: string; subtype?: string; };
export type SlackMcpUser = { id: string; name?: string; realName?: string; displayName?: string; raw?: unknown };
export type SlackMcpConversation = { id: string; name?: string; type?: ConversationType; raw?: unknown };
export type McpToolInfo = { name: string; description?: string; inputSchema?: unknown };
export type RelevanceResult = { shouldAnalyze: boolean; shouldShowInUi: boolean; category: RelevanceCategory; reason: string; urgency: Urgency };
export type KnowledgeReference = { id?: string; title: string; summary?: string; reason?: string; path: string };
export type KnowledgeItem = KnowledgeReference & { tags: string[]; content: string; updatedAt: string };
export type InquiryAnalysis = { summary: string; replyRequired: boolean; todoRequired: boolean; suggestedReplies: string[]; todos: string[]; questionsToUser: string[]; references: KnowledgeReference[]; urgency: Urgency; confidence: Confidence };
export type ChatMessage = { id: string; slackMessageId: string; role: "user" | "assistant"; content: string; createdAt: string };
export type AgentRun = { id: string; slackMessageId: string; markdownPath: string; summary: string; replyRequired: boolean; todoRequired: boolean; urgency: Urgency; confidence: Confidence; createdAt: string; analysis?: InquiryAnalysis };
export type MessageListItem = NormalizedSlackMessage & { status: InquiryStatus; relevanceCategory?: RelevanceCategory; shouldAnalyze: boolean; shouldShowInUi: boolean; processed: boolean; createdAt: string; textPreview: string; agentRun?: AgentRun };
export type MessageDetail = { message: MessageListItem; agentRun?: AgentRun; chatMessages: ChatMessage[]; relatedKnowledge: KnowledgeItem[]; threadMessages: NormalizedSlackMessage[]; relevanceReason?: string };
export type AiStatus = { provider: string; model: string; configured: boolean };
export type PollingStatus = { running: boolean; intervalMs: number; lastPolledAt?: string; lastError?: string };
