import type { AgentRun, ChatThread, ReplyDraft, SlackMessage, TodoItem } from "shared/types";

export function messageMarkdown(m: SlackMessage) {
  return `# Slack Message\n\n## Summary\n\n${m.summary}\n\n## Raw Message\n\n${m.rawText}\n\n## Judgement\n\n- 自分宛て: ${m.isMentionedToMe}\n- 対応必要: ${m.requiresAction}\n- 返信必要: ${m.requiresReply}\n- 優先度: ${m.priority}\n\n## Reason\n\n${m.reasonSummary}\n\n## Related Knowledge\n\n${m.relatedKnowledge.map((k) => `- ${k}`).join("\n") || "- なし"}\n`;
}
export function todoMarkdown(t: TodoItem) {
  return `# ToDo\n\n## Title\n\n${t.title}\n\n## Description\n\n${t.description}\n\n## Status\n\n${t.status}\n\n## Priority\n\n${t.priority}\n\n## Source Message\n\n${t.sourceMessageId}\n\n## Reason\n\n${t.reasonSummary}\n`;
}
export function replyMarkdown(r: ReplyDraft) {
  return `# Reply Draft\n\n## Draft\n\n${r.draftReply}\n\n## Tone\n\n${r.tone}\n\n## Status\n\n${r.status}\n\n## Source Message\n\n${r.sourceMessageId}\n\n## Reason\n\n${r.reasonSummary}\n`;
}
export function chatMarkdown(c: ChatThread) {
  return `# Chat\n\n## Target\n\n${c.target.type}:${c.target.id}\n\n${c.messages.map((m) => `## ${m.role === "user" ? "User" : "Assistant"}\n\n${m.content}\n`).join("\n")}`;
}
export function runMarkdown(r: AgentRun) {
  const approval = r.approvalRequest
    ? [
        `- type: ${r.approvalRequest.type}`,
        `- status: ${r.approvalRequest.status}`,
        `- requestedAt: ${r.approvalRequest.requestedAt}`,
        `- approvedAt: ${r.approvalRequest.approvedAt ?? ""}`,
        `- tools: ${r.approvalRequest.tools.join(", ")}`,
        `- reason: ${r.approvalRequest.reason}`,
      ].join("\n")
    : "なし";
  return `# Run\n\n- id: ${r.id}\n- type: ${r.type}\n- status: ${r.status}\n- startedAt: ${r.startedAt}\n- finishedAt: ${r.finishedAt ?? ""}\n- createdMessages: ${r.createdMessages.length}\n- createdTodos: ${r.createdTodos.length}\n- createdReplies: ${r.createdReplies.length}\n\n## Approval\n\n${approval}\n\n## Errors\n\n${r.errors.map((e) => `- ${e.message}`).join("\n") || "なし"}\n`;
}
