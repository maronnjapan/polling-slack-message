import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function MessagesPage() {
  const { data, loading, error, reload } = useAsync(api.messages, []);
  const [showDone, setShowDone] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const active = data?.filter((m) => (m.status ?? "active") === "active") ?? [];
  const done = data?.filter((m) => m.status === "done") ?? [];

  async function markDone(id: string) {
    setPending(id);
    try { await api.patchMessage(id, "done"); reload(); } finally { setPending(null); }
  }

  return (
    <>
      <h1>メッセージ一覧</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>要約</th><th>送信者</th><th>チャンネル</th><th>優先度</th><th>作成日時</th><th></th></tr></thead>
        <tbody>
          {active.map((m) => (
            <tr key={m.id}>
              <td>{m.summary}</td>
              <td>{m.source.sender}</td>
              <td>{m.source.channel}</td>
              <td>{m.priority}</td>
              <td>{m.createdAt}</td>
              <td style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <a href={`#/messages/${m.id}`}>詳細</a>
                <button className="btn-sm" disabled={pending === m.id} onClick={() => markDone(m.id)}>
                  {pending === m.id ? "..." : "完了にする"}
                </button>
              </td>
            </tr>
          ))}
          {active.length === 0 && !loading && <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>未対応のメッセージはありません</td></tr>}
        </tbody>
      </table>

      <div style={{ marginTop: "1.5rem" }}>
        <button className="btn-sm btn-outline" onClick={() => setShowDone((v) => !v)}>
          {showDone ? "完了済みを隠す" : `完了済みを表示 (${done.length})`}
        </button>
      </div>

      {showDone && (
        <table style={{ marginTop: "0.5rem", opacity: 0.75 }}>
          <thead><tr><th>要約</th><th>送信者</th><th>チャンネル</th><th>優先度</th><th>作成日時</th><th></th></tr></thead>
          <tbody>
            {done.map((m) => (
              <tr key={m.id}>
                <td>{m.summary}</td>
                <td>{m.source.sender}</td>
                <td>{m.source.channel}</td>
                <td>{m.priority}</td>
                <td>{m.createdAt}</td>
                <td><a href={`#/messages/${m.id}`}>詳細</a></td>
              </tr>
            ))}
            {done.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>完了済みはありません</td></tr>}
          </tbody>
        </table>
      )}
    </>
  );
}
