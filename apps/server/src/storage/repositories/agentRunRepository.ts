import type { AgentRun, InquiryAnalysis } from "shared/types";
import type { AppDb } from "../db.js";
import { nowIso } from "../../utils/date.js";
export class AgentRunRepository {
  constructor(private db: AppDb) {}
  insert(id: string, slackMessageId: string, markdownPath: string, analysis: InquiryAnalysis) {
    this.db
      .prepare(
        `INSERT INTO agent_runs (id,slack_message_id,markdown_path,summary,analysis_json,reply_required,todo_required,urgency,confidence,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        slackMessageId,
        markdownPath,
        analysis.summary,
        JSON.stringify(analysis),
        analysis.replyRequired ? 1 : 0,
        analysis.todoRequired ? 1 : 0,
        analysis.urgency,
        analysis.confidence,
        nowIso(),
      );
  }
  latest(slackMessageId: string) {
    const r = this.db
      .prepare("SELECT * FROM agent_runs WHERE slack_message_id=? ORDER BY created_at DESC LIMIT 1")
      .get(slackMessageId) as any;
    return r
      ? ({
          id: r.id,
          slackMessageId: r.slack_message_id,
          markdownPath: r.markdown_path,
          summary: r.summary,
          replyRequired: !!r.reply_required,
          todoRequired: !!r.todo_required,
          urgency: r.urgency,
          confidence: r.confidence,
          createdAt: r.created_at,
          analysis: JSON.parse(r.analysis_json),
        } as AgentRun)
      : undefined;
  }
}
