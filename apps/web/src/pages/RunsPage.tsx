import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function RunsPage() {
  const { data, loading, error, reload } = useAsync(api.runs, []);
  const [approvingRunId, setApprovingRunId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  async function approve(runId: string) {
    setApprovingRunId(runId);
    setApproveError(null);
    try {
      await api.approveRun(runId);
      reload();
    } catch (error) {
      setApproveError(error instanceof Error ? error.message : String(error));
    } finally {
      setApprovingRunId(null);
    }
  }

  return (
    <>
      <h1>実行ログ一覧</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p className="error">{error}</p>}
      {approveError && <p className="error">{approveError}</p>}
      <table>
        <thead>
          <tr>
            <th>run id</th>
            <th>type</th>
            <th>status</th>
            <th>startedAt</th>
            <th>finishedAt</th>
            <th>messages</th>
            <th>todos</th>
            <th>replies</th>
            <th>approval</th>
            <th>errors</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((run) => (
            <tr key={run.id}>
              <td>{run.id}</td>
              <td>{run.type}</td>
              <td>{run.status}</td>
              <td>{run.startedAt}</td>
              <td>{run.finishedAt}</td>
              <td>{run.createdMessages.length}</td>
              <td>{run.createdTodos.length}</td>
              <td>{run.createdReplies.length}</td>
              <td>
                {run.status === "approval_required" && run.approvalRequest?.status === "pending" ? (
                  <button className="btn-sm" disabled={approvingRunId === run.id} onClick={() => approve(run.id)}>
                    Slack MCPを承認
                  </button>
                ) : (
                  run.approvalRequest?.status ?? "-"
                )}
              </td>
              <td>{run.errors.map((e) => e.message).join("; ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
