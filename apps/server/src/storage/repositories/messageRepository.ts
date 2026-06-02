import type { AppDb } from "../db.js";
import type { InquiryStatus, MessageListItem, NormalizedSlackMessage, RelevanceResult } from "shared/types";
import { nowIso } from "../../utils/date.js";
export class MessageRepository {
  constructor(private db: AppDb) {}
  exists(conversationId:string, ts:string) { return !!this.db.prepare("SELECT 1 FROM slack_messages WHERE conversation_id=? AND slack_ts=?").get(conversationId, ts); }
  insert(msg: NormalizedSlackMessage) { this.db.prepare(`INSERT OR IGNORE INTO slack_messages (id,conversation_id,conversation_name,conversation_type,user_id,user_name,slack_ts,thread_ts,permalink,text_preview,markdown_path,raw_json_path,created_at) VALUES (@id,@conversationId,@conversationName,@conversationType,@userId,@userName,@ts,@threadTs,@permalink,@textPreview,@markdownPath,@rawFilePath,@createdAt)`).run({...msg,textPreview:msg.text.slice(0,240),createdAt:nowIso()}); }
  updateRelevance(id:string, r: RelevanceResult) { this.db.prepare("UPDATE slack_messages SET relevance_category=?, relevance_reason=?, relevance_urgency=?, should_analyze=?, should_show_in_ui=?, status=CASE WHEN ?=1 THEN status ELSE 'not_needed' END WHERE id=?").run(r.category,r.reason,r.urgency,r.shouldAnalyze?1:0,r.shouldShowInUi?1:0,r.shouldShowInUi?1:0,id); }
  markProcessed(id:string) { this.db.prepare("UPDATE slack_messages SET processed=1 WHERE id=?").run(id); }
  markAsOpen(id:string) { this.db.prepare("UPDATE slack_messages SET status='open', should_show_in_ui=1 WHERE id=?").run(id); }
  updateStatus(id:string, status:InquiryStatus) { this.db.prepare("UPDATE slack_messages SET status=? WHERE id=?").run(status,id); }
  list(filters:{status?:string;urgency?:string}={}) { let sql="SELECT * FROM slack_messages WHERE should_show_in_ui=1"; const p:unknown[]=[]; if(filters.status){sql+=" AND status=?";p.push(filters.status)} if(filters.urgency){sql+=" AND relevance_urgency=?";p.push(filters.urgency)} sql+=" ORDER BY created_at DESC"; return this.db.prepare(sql).all(...p).map(rowToMessage) as MessageListItem[]; }
  get(id:string) { const row=this.db.prepare("SELECT * FROM slack_messages WHERE id=?").get(id); return row ? rowToMessage(row) as MessageListItem : undefined; }
  getRelevanceReason(id:string) { return (this.db.prepare("SELECT relevance_reason FROM slack_messages WHERE id=?").get(id) as {relevance_reason?:string}|undefined)?.relevance_reason; }
}
function rowToMessage(r:any): MessageListItem { return { id:r.id, source:"slack", conversationId:r.conversation_id, conversationName:r.conversation_name, conversationType:r.conversation_type, userId:r.user_id, userName:r.user_name, text:r.text_preview ?? "", ts:r.slack_ts, threadTs:r.thread_ts, permalink:r.permalink, rawFilePath:r.raw_json_path, markdownPath:r.markdown_path, receivedAt:r.created_at, status:r.status, relevanceCategory:r.relevance_category, shouldAnalyze:!!r.should_analyze, shouldShowInUi:!!r.should_show_in_ui, processed:!!r.processed, createdAt:r.created_at, textPreview:r.text_preview ?? "" }; }
