import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import type { KnowledgeFile } from "shared/types";

type Mode = "view" | "edit" | "create";

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  children: TreeNode[];
  updatedAt?: string;
};

function buildTree(files: KnowledgeFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.path.split("/");
    let nodes = root;
    let pathSoFar = "";
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      pathSoFar = pathSoFar ? `${pathSoFar}/${seg}` : seg;
      let dir = nodes.find((n) => n.type === "dir" && n.name === seg);
      if (!dir) {
        dir = { name: seg, path: pathSoFar, type: "dir", children: [] };
        nodes.push(dir);
      }
      nodes = dir.children;
    }
    const name = parts[parts.length - 1];
    nodes.push({ name, path: file.path, type: "file", children: [], updatedAt: file.updatedAt });
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sort(n.children));
  };
  sort(root);
  return root;
}

function FileTreeNode({
  node,
  selected,
  onSelect,
  depth = 0,
}: {
  node: TreeNode;
  selected: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(true);
  const indent = depth * 14;

  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            width: "100%",
            textAlign: "left",
            background: "transparent",
            color: "#374151",
            padding: "3px 6px",
            paddingLeft: `${indent + 6}px`,
            borderRadius: "5px",
            fontSize: "0.84rem",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: "0.6rem", opacity: 0.6, width: "10px", flexShrink: 0 }}>
            {open ? "▼" : "▶"}
          </span>
          <span style={{ marginRight: "4px" }}>
            {open ? "📂" : "📁"}
          </span>
          {node.name}
        </button>
        {open && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                selected={selected}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selected === node.path;
  return (
    <button
      onClick={() => onSelect(node.path)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        width: "100%",
        textAlign: "left",
        background: isSelected ? "#c7d2fe" : "transparent",
        color: isSelected ? "#1e3a8a" : "#374151",
        padding: "3px 6px",
        paddingLeft: `${indent + 6}px`,
        borderRadius: "5px",
        fontSize: "0.84rem",
        fontWeight: isSelected ? 600 : 400,
      }}
    >
      <span style={{ width: "10px", flexShrink: 0 }} />
      <span style={{ marginRight: "4px" }}>📄</span>
      {node.name}
    </button>
  );
}

function FileTree({
  files,
  selected,
  onSelect,
}: {
  files: KnowledgeFile[];
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const tree = buildTree(files);
  return (
    <div style={{ fontFamily: "ui-monospace, monospace" }}>
      {tree.map((node) => (
        <FileTreeNode key={node.path} node={node} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

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
        <section className="card" style={{ padding: "0.75rem" }}>
          <div style={{ padding: "0 0.25rem 0.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ファイル一覧
            </span>
          </div>
          {files.data && files.data.length > 0 ? (
            <FileTree files={files.data} selected={selected} onSelect={handleSelect} />
          ) : (
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", padding: "0.5rem" }}>ファイルがありません</p>
          )}
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
