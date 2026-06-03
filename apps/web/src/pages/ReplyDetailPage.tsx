import { api } from "../api/client";
import { ChatPanel } from "../components/ChatPanel";
import { useAsync } from "../hooks/useAsync";

export function ReplyDetailPage({ id }: { id: string }) { const reply = useAsync(() => api.reply(id), [id]); const messages = useAsync(api.messages, []); if (reply.loading) return <p>読み込み中...</p>; if (reply.error || !reply.data) return <p className="error">{reply.error ?? "not found"}</p>; const m = messages.data?.find((x) => x.id === reply.data?.sourceMessageId); return <><h1>返信案詳細</h1><section className="card"><h2>Draft</h2><p className="draft">{reply.data.draftReply}</p><dl><dt>tone</dt><dd>{reply.data.tone}</dd><dt>status</dt><dd>{reply.data.status}</dd><dt>元メッセージ</dt><dd>{m ? <a href={`#/messages/${m.id}`}>{m.summary}</a> : reply.data.sourceMessageId}</dd><dt>判断理由</dt><dd>{reply.data.reasonSummary}</dd></dl><p className="note">Slackへの自動投稿ボタンはありません。内容確認後、必要に応じて手動で返信してください。</p></section><ChatPanel targetType="reply" targetId={id} /></>; }
