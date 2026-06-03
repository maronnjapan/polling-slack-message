import { api } from "../api/client";
import { ChatPanel } from "../components/ChatPanel";
import { useAsync } from "../hooks/useAsync";

export function MessageDetailPage({ id }: { id: string }) {
  const m = useAsync(() => api.message(id), [id]); const todos = useAsync(api.todos, []); const replies = useAsync(api.replies, []);
  if (m.loading) return <p>読み込み中...</p>; if (m.error || !m.data) return <p className="error">{m.error ?? "not found"}</p>;
  const relatedTodos = todos.data?.filter((t) => t.sourceMessageId === id) ?? []; const relatedReplies = replies.data?.filter((r) => r.sourceMessageId === id) ?? [];
  return <><h1>メッセージ詳細</h1><section className="card"><h2>{m.data.summary}</h2><p>{m.data.rawText}</p><dl><dt>送信者</dt><dd>{m.data.source.sender}</dd><dt>チャンネル</dt><dd>{m.data.source.channel}</dd><dt>対応要否</dt><dd>{String(m.data.requiresAction)}</dd><dt>返信要否</dt><dd>{String(m.data.requiresReply)}</dd><dt>優先度</dt><dd>{m.data.priority}</dd><dt>判断理由</dt><dd>{m.data.reasonSummary}</dd><dt>関連ナレッジ</dt><dd>{m.data.relatedKnowledge.join(", ") || "なし"}</dd></dl></section><section className="card"><h2>関連ToDo</h2>{relatedTodos.map((t) => <p key={t.id}><a href={`#/todos/${t.id}`}>{t.title}</a></p>)}</section><section className="card"><h2>関連返信案</h2>{relatedReplies.map((r) => <p key={r.id}><a href={`#/replies/${r.id}`}>{r.draftReply}</a></p>)}</section><ChatPanel targetType="slack_message" targetId={id} /></>;
}
