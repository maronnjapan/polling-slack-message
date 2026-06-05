import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

type Mode = "view" | "edit" | "create";

export function KnowledgePage() {
  const files = useAsync(api.knowledge, []);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [editPath, setEditPath] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const content = useAsync(
    () => (selected && mode === "view" ? api.knowledgeFile(selected) : Promise.resolve(null)),
    [selected, mode]
  );

  const handleSelect = (path: string) => {
    setSelected(path);
    setMode("view");
    setSaveError(null);
  };

  const handleEdit = () => {
    if (!content.data) return;
    setEditPath(content.data.path);
    setEditContent(content.data.content ?? "");
    setMode("edit");
    setSaveError(null);
  };

  const handleCreate = () => {
    setEditPath("");
    setEditContent("");
    setMode("create");
    setSelected(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    const savePath = mode === "edit" ? selected! : editPath;
    if (!savePath) return;
    const finalPath = savePath.endsWith(".md") ? savePath : `${savePath}.md`;
    setSaving(true);
    setSaveError(null);
    try {
      await api.saveKnowledge(finalPath, editContent);
      await files.reload();
      setSelected(finalPath);
      setMode("view");
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setMode("view");
    setSaveError(null);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>ナレッジ</h1>
        <button className="btn-sm" onClick={handleCreate}>+ 新規追加</button>
      </div>
      <div className="split">
        <section className="card">
          <h2>ファイル一覧</h2>
          {files.data?.map((f) => (
            <button
              className="link-button"
              key={f.path}
              onClick={() => handleSelect(f.path)}
              style={selected === f.path ? { background: "#c7d2fe" } : undefined}
            >
              {f.path}
              <small>{f.updatedAt}</small>
            </button>
          ))}
        </section>
        <section className="card">
          {mode === "view" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0 }}>{content.data?.path ?? "Markdown本文"}</h2>
                {content.data && (
                  <button className="btn-sm btn-outline" onClick={handleEdit}>編集</button>
                )}
              </div>
              {content.data && <p className="note">最終更新日時: {content.data.updatedAt}</p>}
              <pre className="markdown">{content.data?.content ?? "ファイルを選択してください"}</pre>
            </>
          )}
          {(mode === "edit" || mode === "create") && (
            <>
              <h2>{mode === "create" ? "新規ナレッジ追加" : `編集: ${editPath}`}</h2>
              {mode === "create" && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontWeight: 700, marginBottom: "0.25rem" }}>
                    ファイルパス（例: glossary.md / rules/my-rule.md）
                  </label>
                  <input
                    type="text"
                    value={editPath}
                    onChange={(e) => setEditPath(e.target.value)}
                    placeholder="filename.md"
                    style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "8px", font: "inherit", boxSizing: "border-box" }}
                  />
                </div>
              )}
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.25rem" }}>内容</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ minHeight: "300px" }}
                placeholder="Markdownで記述してください"
              />
              {saveError && <p className="error">{saveError}</p>}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={handleSave} disabled={saving || (mode === "create" && !editPath)}>
                  {saving ? "保存中..." : "保存"}
                </button>
                <button className="btn-outline" onClick={handleCancel}>キャンセル</button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
