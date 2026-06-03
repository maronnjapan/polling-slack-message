import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function TodosPage() { const { data, loading, error } = useAsync(api.todos, []); return <><h1>ToDo一覧</h1>{loading && <p>読み込み中...</p>}{error && <p className="error">{error}</p>}<table><thead><tr><th>title</th><th>status</th><th>priority</th><th>due</th><th>sourceMessageId</th><th>createdAt</th><th>updatedAt</th><th></th></tr></thead><tbody>{data?.map((t) => <tr key={t.id}><td>{t.title}</td><td>{t.status}</td><td>{t.priority}</td><td>{t.due ?? ""}</td><td>{t.sourceMessageId}</td><td>{t.createdAt}</td><td>{t.updatedAt}</td><td><a href={`#/todos/${t.id}`}>詳細</a></td></tr>)}</tbody></table></>; }
