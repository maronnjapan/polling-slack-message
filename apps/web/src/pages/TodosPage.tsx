import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function TodosPage() {
  const { data, loading, error, reload } = useAsync(api.todos, []);
  const [showDone, setShowDone] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const active = data?.filter((t) => t.status === "open" || t.status === "in_progress") ?? [];
  const done = data?.filter((t) => t.status === "done" || t.status === "dismissed") ?? [];

  async function markDone(id: string) {
    setPending(id);
    try { await api.patchTodo(id, "done"); reload(); } finally { setPending(null); }
  }

  return (
    <>
      <h1>ToDo一覧</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>title</th><th>status</th><th>priority</th><th>due</th><th>作成日時</th><th></th></tr></thead>
        <tbody>
          {active.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{t.status}</td>
              <td>{t.priority}</td>
              <td>{t.due ?? ""}</td>
              <td>{t.createdAt}</td>
              <td style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <a href={`#/todos/${t.id}`}>詳細</a>
                <button className="btn-sm" disabled={pending === t.id} onClick={() => markDone(t.id)}>
                  {pending === t.id ? "..." : "完了にする"}
                </button>
              </td>
            </tr>
          ))}
          {active.length === 0 && !loading && <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>未完了のToDoはありません</td></tr>}
        </tbody>
      </table>

      <div style={{ marginTop: "1.5rem" }}>
        <button className="btn-sm btn-outline" onClick={() => setShowDone((v) => !v)}>
          {showDone ? "完了済みを隠す" : `完了済みを表示 (${done.length})`}
        </button>
      </div>

      {showDone && (
        <table style={{ marginTop: "0.5rem", opacity: 0.75 }}>
          <thead><tr><th>title</th><th>status</th><th>priority</th><th>due</th><th>作成日時</th><th></th></tr></thead>
          <tbody>
            {done.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{t.status}</td>
                <td>{t.priority}</td>
                <td>{t.due ?? ""}</td>
                <td>{t.createdAt}</td>
                <td><a href={`#/todos/${t.id}`}>詳細</a></td>
              </tr>
            ))}
            {done.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>完了済みはありません</td></tr>}
          </tbody>
        </table>
      )}
    </>
  );
}
