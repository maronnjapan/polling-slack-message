import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ChatMessage, InquiryAnalysis, KnowledgeItem, NormalizedSlackMessage, RelevanceResult } from "shared/types";
import { newId } from "../utils/ids.js";
import { nowIso } from "../utils/date.js";
import { agentRunPath, chatPath, knowledgePath, rawSlackPath, slackMarkdownPath } from "./paths.js";
import { frontmatter } from "./frontmatter.js";
const ensure = async (p:string) => mkdir(dirname(p), { recursive:true });
export class MarkdownStore {
  constructor(private dataDir: string) {}
  pathsForSlack(id:string, iso?:string) { return { raw: rawSlackPath(this.dataDir,id,iso), md: slackMarkdownPath(this.dataDir,id,iso) }; }
  async saveRawSlackMessage(id:string, raw:unknown, iso?:string) { const p=rawSlackPath(this.dataDir,id,iso); await ensure(p); await writeFile(p, JSON.stringify(raw,null,2)); return p; }
  async saveSlackMessage(msg: NormalizedSlackMessage, relevance?: RelevanceResult) { const p=msg.markdownPath; await ensure(p); await writeFile(p, frontmatter({id:msg.id,source:"slack",conversation_id:msg.conversationId,conversation_name:msg.conversationName,conversation_type:msg.conversationType,user_id:msg.userId,user_name:msg.userName,slack_ts:msg.ts,thread_ts:msg.threadTs,received_at:msg.receivedAt,detected_by:"slack_mcp_polling",relevance_category:relevance?.category,should_analyze:relevance?.shouldAnalyze,should_show_in_ui:relevance?.shouldShowInUi})+`# Slack Message\n\n## Text\n\n${msg.text}\n\n## Metadata\n\n- conversation_id: ${msg.conversationId}\n- conversation_name: ${msg.conversationName ?? ""}\n- user_id: ${msg.userId ?? ""}\n- user_name: ${msg.userName ?? ""}\n- slack_ts: ${msg.ts}\n- thread_ts: ${msg.threadTs ?? ""}\n\n## Normalized Text\n\n${msg.text}\n`); return p; }
  async saveAgentRun(slackMessageId:string, analysis: InquiryAnalysis) { const id=newId("agent-run"); const p=agentRunPath(this.dataDir,id); await ensure(p); await writeFile(p, frontmatter({id,slack_message_id:slackMessageId,created_at:nowIso(),reply_required:analysis.replyRequired,todo_required:analysis.todoRequired,urgency:analysis.urgency,confidence:analysis.confidence})+`# Agent Output\n\n## Summary\n\n${analysis.summary}\n\n## Suggested Replies\n\n${analysis.suggestedReplies.map((r,i)=>`### Reply ${i+1}\n\n${r}`).join("\n\n")}\n\n## Todos\n\n${analysis.todos.map(t=>`- ${t}`).join("\n")}\n\n## Questions To User\n\n${analysis.questionsToUser.map(q=>`- ${q}`).join("\n")}\n\n## References\n\n${analysis.references.map(r=>`- ${r.path}`).join("\n")}\n`); return { id, path:p }; }
  async appendChatMessage(msg: ChatMessage) { const p=chatPath(this.dataDir, msg.slackMessageId); await ensure(p); await writeFile(p, `\n\n## ${msg.role} - ${msg.createdAt}\n\n${msg.content}\n`, { flag:"a" }); return p; }
  async saveKnowledge(title:string, content:string, tags:string[]) { const id=newId("knowledge"); const p=knowledgePath(this.dataDir,id); await ensure(p); const updatedAt=nowIso(); await writeFile(p, frontmatter({id,title,tags,updated_at:updatedAt})+`# ${title}\n\n${content}\n`); return { id, title, tags, markdownPath:p, updatedAt }; }
}
