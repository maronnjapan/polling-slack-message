import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function RunsPage() { const { data, loading, error } = useAsync(api.runs, []); return <><h1>実行ログ一覧</h1>{loading && <p>読み込み中...</p>}{error && <p className="error">{error}</p>}<table><thead><tr><th>run id</th><th>type</th><th>status</th><th>startedAt</th><th>finishedAt</th><th>messages</th><th>todos</th><th>replies</th><th>errors</th></tr></thead><tbody>{data?.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.type}</td><td>{r.status}</td><td>{r.startedAt}</td><td>{r.finishedAt}</td><td>{r.createdMessages.length}</td><td>{r.createdTodos.length}</td><td>{r.createdReplies.length}</td><td>{r.errors.map((e) => e.message).join("; ")}</td></tr>)}</tbody></table></>; }
