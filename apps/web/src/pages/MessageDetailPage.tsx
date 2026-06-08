import { useState } from "react";
import { api } from "../api/client";
import { ChatPanel } from "../components/ChatPanel";
import { NotesPanel } from "../components/NotesPanel";
import { useAsync } from "../hooks/useAsync";

export function MessageDetailPage({ id }: { id: string }) {
  const m = useAsync(() => api.message(id), [id]);
  const todos = useAsync(api.todos, []);
  const replies = useAsync(api.replies, []);
  const [busy, setBusy] = useState(false);

  if (m.loading) return <p>読み込み中...</p>;
  if (m.error || !m.data) return <p className="error">{m.error ?? "not found"}</p>;

  const relatedTodos = todos.data?.filter((t) => t.sourceMessageId === id) ?? [];
  const relatedReplies = replies.data?.filter((r) => r.sourceMessageId === id) ?? [];

  async function toggleStatus() {
    if (!m.data) return;
    setBusy(true);
    try { await api.patchMessage(id, m.data.status === "done" ? "active" : "done"); m.reload(); } finally { setBusy(false); }
  }

  return (
    <>
      <h1>メッセージ詳細</h1>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2>{m.data.summary}</h2>
          <button className="btn-sm" disabled={busy} onClick={toggleStatus}>
            {busy ? "..." : m.data.status === "done" ? "未対応に戻す" : "完了にする"}
          </button>
        </div>
        <details style={{ marginTop: "0.75rem" }}>
          <summary style={{ cursor: "pointer", color: "#64748b", fontSize: "0.875rem" }}>元のメッセージを表示</summary>
          <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>{m.data.rawText}</p>
        </details>
        <dl>
          <dt>送信者</dt>
          <dd>
            {m.data.source.senderName ?? m.data.source.sender}
          </dd>
          <dt>チャンネル</dt>
          <dd>
            {m.data.source.channelName ?? m.data.source.channel}
          </dd>
          {m.data.source.permalink && (
            <>
              <dt>Slackリンク</dt>
              <dd><a href={m.data.source.permalink} target="_blank" rel="noreferrer">Slackで開く</a></dd>
            </>
          )}
          <dt>対応要否</dt><dd>{String(m.data.requiresAction)}</dd>
          <dt>返信要否</dt><dd>{String(m.data.requiresReply)}</dd>
          <dt>優先度</dt><dd>{m.data.priority}</dd>
          <dt>ステータス</dt><dd>{m.data.status ?? "active"}</dd>
          <dt>判断理由</dt><dd>{m.data.reasonSummary}</dd>
          <dt>関連ナレッジ</dt><dd>{m.data.relatedKnowledge.join(", ") || "なし"}</dd>
        </dl>
      </section>
      <section className="card">
        <h2>関連ToDo</h2>
        {relatedTodos.map((t) => <p key={t.id}><a href={`#/todos/${t.id}`}>{t.title}</a></p>)}
      </section>
      <section className="card">
        <h2>関連返信案</h2>
        {relatedReplies.map((r) => <p key={r.id}><a href={`#/replies/${r.id}`}>{r.draftReply}</a></p>)}
      </section>
      <NotesPanel notes={m.data.notes} onAdd={async (body) => { await api.addMessageNote(id, body); m.reload(); }} />
      <ChatPanel targetType="slack_message" targetId={id} />
    </>
  );
}
