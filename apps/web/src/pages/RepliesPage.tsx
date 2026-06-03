import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function RepliesPage() { const { data, loading, error } = useAsync(api.replies, []); return <><h1>返信案一覧</h1>{loading && <p>読み込み中...</p>}{error && <p className="error">{error}</p>}<table><thead><tr><th>draftReply</th><th>status</th><th>tone</th><th>sourceMessageId</th><th>createdAt</th><th>updatedAt</th><th></th></tr></thead><tbody>{data?.map((r) => <tr key={r.id}><td>{r.draftReply.slice(0, 80)}</td><td>{r.status}</td><td>{r.tone}</td><td>{r.sourceMessageId}</td><td>{r.createdAt}</td><td>{r.updatedAt}</td><td><a href={`#/replies/${r.id}`}>詳細</a></td></tr>)}</tbody></table></>; }
