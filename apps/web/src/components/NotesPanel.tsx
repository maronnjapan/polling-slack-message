import { useState } from "react";
import type { Note } from "shared/types";

export function NotesPanel({
  notes,
  onAdd,
}: {
  notes: Note[] | undefined;
  onAdd: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd(body.trim());
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const items = notes ?? [];

  return (
    <section className="card">
      <h2>メモ</h2>
      <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 0 }}>
        書いたメモは次回ポーリング時にAIが内容へ反映します。反映済みのメモは以降AIには読み込まれません。
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {items.length ? (
          items.map((note) => (
            <div
              key={note.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                background: note.appliedAt ? "#f8fafc" : "#fffbeb",
              }}
            >
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{note.body}</p>
              <small style={{ color: "#64748b" }}>
                {note.appliedAt ? `AI反映済み (${note.appliedAt})` : "未反映"} ・ {note.createdAt}
              </small>
            </div>
          ))
        ) : (
          <p>まだメモはありません。</p>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e: any) => setBody(e.target.value)}
        placeholder="例: この件は対応済みなので完了にしたい / 期限は今週金曜に変更"
      />
      <button onClick={add} disabled={saving}>
        {saving ? "保存中..." : "メモを追加"}
      </button>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
