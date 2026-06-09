import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function DashboardPage() {
  const stats = useAsync(api.stats, [], { pollIntervalMs: 3000 });
  const runs = useAsync(api.runs, [], { pollIntervalMs: 5000 });
  const [running, setRunning] = useState(false); const [result, setResult] = useState<string | null>(null);
  async function runAgent() { setRunning(true); try { const r = await api.agentRun(); setResult(`${r.id}: ${r.status}`); runs.reload(); stats.reload(); } catch (e) { setResult(e instanceof Error ? e.message : String(e)); } finally { setRunning(false); } }
  return <><h1>ダッシュボード</h1><div className="stats"><div className="card"><b>{stats.data?.pendingMessages ?? 0}</b><span>未対応メッセージ</span></div><div className="card"><b>{stats.data?.openTodos ?? 0}</b><span>open ToDo</span></div><div className="card"><b>{stats.data?.pendingReplies ?? 0}</b><span>draft 返信案</span></div></div><section className="card"><h2>手動実行</h2><button onClick={runAgent} disabled={running}>{running ? "実行中..." : "Codex CLIを実行"}</button>{result && <p>{result}</p>}</section><section className="card"><h2>最新実行結果</h2><pre>{JSON.stringify(runs.data?.[0] ?? null, null, 2)}</pre></section></>;
}
