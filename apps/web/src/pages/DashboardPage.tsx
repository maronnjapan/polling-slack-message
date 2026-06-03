import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function DashboardPage() {
  const messages = useAsync(api.messages, []); const todos = useAsync(api.todos, []); const replies = useAsync(api.replies, []); const runs = useAsync(api.runs, []);
  const [running, setRunning] = useState(false); const [result, setResult] = useState<string | null>(null);
  async function runAgent() { setRunning(true); try { const r = await api.agentRun(); setResult(`${r.id}: ${r.status}`); runs.reload(); } catch (e) { setResult(e instanceof Error ? e.message : String(e)); } finally { setRunning(false); } }
  const unresolved = messages.data?.filter((m) => m.requiresAction || m.requiresReply).length ?? 0;
  return <><h1>ダッシュボード</h1><div className="stats"><div className="card"><b>{unresolved}</b><span>未対応メッセージ</span></div><div className="card"><b>{todos.data?.filter((t) => t.status === "open").length ?? 0}</b><span>open ToDo</span></div><div className="card"><b>{replies.data?.filter((r) => r.status === "draft").length ?? 0}</b><span>draft 返信案</span></div></div><section className="card"><h2>手動実行</h2><button onClick={runAgent} disabled={running}>{running ? "実行中..." : "Codex CLIを実行"}</button>{result && <p>{result}</p>}</section><section className="card"><h2>最新実行結果</h2><pre>{JSON.stringify(runs.data?.[0] ?? null, null, 2)}</pre></section><section className="card"><h2>最新取得メッセージ</h2><pre>{JSON.stringify(messages.data?.[0] ?? null, null, 2)}</pre></section></>;
}
