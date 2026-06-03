import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { useAsync } from "../hooks/useAsync";

export function MessagesPage() {
  const { data, loading, error } = useAsync(api.messages, []);
  return <><h1>メッセージ一覧</h1>{loading && <p>読み込み中...</p>}{error && <p className="error">{error}</p>}<table><thead><tr><th>要約</th><th>送信者</th><th>チャンネル</th><th>対応</th><th>返信</th><th>優先度</th><th>作成日時</th><th></th></tr></thead><tbody>{data?.map((m) => <tr key={m.id}><td>{m.summary}</td><td>{m.source.sender}</td><td>{m.source.channel}</td><td><StatusBadge value={m.requiresAction} /></td><td><StatusBadge value={m.requiresReply} /></td><td>{m.priority}</td><td>{m.createdAt}</td><td><a href={`#/messages/${m.id}`}>詳細</a></td></tr>)}</tbody></table></>;
}
