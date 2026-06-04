import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function RepliesPage() {
  const { data, loading, error, reload } = useAsync(api.replies, []);
  const [showDone, setShowDone] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const active = data?.filter((r) => r.status === "draft" || r.status === "edited") ?? [];
  const done = data?.filter((r) => r.status === "approved" || r.status === "dismissed") ?? [];

  async function markApproved(id: string) {
    setPending(id);
    try { await api.patchReply(id, "approved"); reload(); } finally { setPending(null); }
  }

  return (
    <>
      <h1>返信案一覧</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>返信案</th><th>status</th><th>tone</th><th>作成日時</th><th></th></tr></thead>
        <tbody>
          {active.map((r) => (
            <tr key={r.id}>
              <td>{r.draftReply.slice(0, 80)}</td>
              <td>{r.status}</td>
              <td>{r.tone}</td>
              <td>{r.createdAt}</td>
              <td style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <a href={`#/replies/${r.id}`}>詳細</a>
                <button className="btn-sm" disabled={pending === r.id} onClick={() => markApproved(r.id)}>
                  {pending === r.id ? "..." : "返信完了"}
                </button>
              </td>
            </tr>
          ))}
          {active.length === 0 && !loading && <tr><td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>未対応の返信案はありません</td></tr>}
        </tbody>
      </table>

      <div style={{ marginTop: "1.5rem" }}>
        <button className="btn-sm btn-outline" onClick={() => setShowDone((v) => !v)}>
          {showDone ? "完了済みを隠す" : `完了済みを表示 (${done.length})`}
        </button>
      </div>

      {showDone && (
        <table style={{ marginTop: "0.5rem", opacity: 0.75 }}>
          <thead><tr><th>返信案</th><th>status</th><th>tone</th><th>作成日時</th><th></th></tr></thead>
          <tbody>
            {done.map((r) => (
              <tr key={r.id}>
                <td>{r.draftReply.slice(0, 80)}</td>
                <td>{r.status}</td>
                <td>{r.tone}</td>
                <td>{r.createdAt}</td>
                <td><a href={`#/replies/${r.id}`}>詳細</a></td>
              </tr>
            ))}
            {done.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>完了済みはありません</td></tr>}
          </tbody>
        </table>
      )}
    </>
  );
}
