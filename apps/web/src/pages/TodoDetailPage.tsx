import { useState } from "react";
import { api } from "../api/client";
import { ChatPanel } from "../components/ChatPanel";
import { NotesPanel } from "../components/NotesPanel";
import { useAsync } from "../hooks/useAsync";
import type { TodoStatus } from "shared/types";

const STATUS_OPTIONS: { value: TodoStatus; label: string }[] = [
  { value: "open", label: "未着手" },
  { value: "in_progress", label: "対応中" },
  { value: "done", label: "完了" },
  { value: "dismissed", label: "却下" },
];

export function TodoDetailPage({ id }: { id: string }) {
  const todo = useAsync(() => api.todo(id), [id]);
  const messages = useAsync(api.messages, []);
  const replies = useAsync(api.replies, []);
  const [busy, setBusy] = useState(false);

  if (todo.loading) return <p>読み込み中...</p>;
  if (todo.error || !todo.data) return <p className="error">{todo.error ?? "not found"}</p>;

  const m = messages.data?.find((x) => x.id === todo.data?.sourceMessageId);

  async function changeStatus(status: TodoStatus) {
    if (!todo.data || todo.data.status === status) return;
    setBusy(true);
    try { await api.patchTodo(id, status); todo.reload(); } finally { setBusy(false); }
  }

  return (
    <>
      <h1>ToDo詳細</h1>
      <section className="card">
        <h2>{todo.data.title}</h2>
        <p>{todo.data.description}</p>
        <dl>
          <dt>status</dt>
          <dd>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`btn-sm ${todo.data?.status === opt.value ? "" : "btn-outline"}`}
                  disabled={busy || todo.data?.status === opt.value}
                  onClick={() => changeStatus(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </dd>
          <dt>priority</dt><dd>{todo.data.priority}</dd>
          <dt>due</dt><dd>{todo.data.due ?? "なし"}</dd>
          <dt>判断理由</dt><dd>{todo.data.reasonSummary}</dd>
          <dt>元メッセージ</dt><dd>{m ? <a href={`#/messages/${m.id}`}>{m.summary}</a> : todo.data.sourceMessageId}</dd>
        </dl>
      </section>
      <section className="card">
        <h2>関連返信案</h2>
        {replies.data?.filter((r) => r.sourceMessageId === todo.data?.sourceMessageId).map((r) => (
          <p key={r.id}><a href={`#/replies/${r.id}`}>{r.draftReply}</a></p>
        ))}
      </section>
      <NotesPanel notes={todo.data.notes} onAdd={async (body) => { await api.addTodoNote(id, body); todo.reload(); }} />
      <ChatPanel targetType="todo" targetId={id} />
    </>
  );
}
