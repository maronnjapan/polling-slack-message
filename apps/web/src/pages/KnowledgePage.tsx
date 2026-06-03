import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function KnowledgePage() { const files = useAsync(api.knowledge, []); const [selected, setSelected] = useState<string | null>(null); const content = useAsync(() => selected ? api.knowledgeFile(selected) : Promise.resolve(null), [selected]); return <><h1>ナレッジ閲覧</h1><div className="split"><section className="card"><h2>ファイル一覧</h2>{files.data?.map((f) => <button className="link-button" key={f.path} onClick={() => setSelected(f.path)}>{f.path}<small>{f.updatedAt}</small></button>)}</section><section className="card"><h2>{content.data?.path ?? "Markdown本文"}</h2>{content.data && <p>最終更新日時: {content.data.updatedAt}</p>}<pre className="markdown">{content.data?.content ?? "ファイルを選択してください"}</pre></section></div></>; }
