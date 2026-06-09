import { useState, type ReactNode } from "react";
import { useAsync } from "../hooks/useAsync";
import { api } from "../api/client";

export function Layout({ children }: { children: ReactNode }) {
  const { data: stats } = useAsync(api.stats, [], { pollIntervalMs: 3000 });
  const { data: setupStatus, reload: reloadSetup } = useAsync(api.slackSetupStatus, [], { pollIntervalMs: 10000 });
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  async function handleApplySetup() {
    setApplying(true);
    setApplyError(null);
    try {
      await api.applySlackSetup();
      reloadSetup();
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : String(e));
    } finally {
      setApplying(false);
    }
  }

  const navItems: [string, string, number | undefined][] = [
    ["/", "Dashboard", undefined],
    ["/messages", "Messages", stats?.pendingMessages],
    ["/todos", "ToDos", stats?.openTodos],
    ["/replies", "Replies", stats?.pendingReplies],
    ["/runs", "Runs", undefined],
    ["/knowledge", "Knowledge", undefined],
    ["/settings", "Settings", undefined],
  ];

  const showSetupBanner = setupStatus && !setupStatus.configured;

  return (
    <div className="app-shell">
      <aside>
        <h1>Slack Assistant</h1>
        <p>Codex CLI + MCP の結果を確認するローカルUI</p>
        <nav>
          {navItems.map(([href, label, count]) => (
            <a key={href} href={`#${href}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{label}</span>
              {count != null && count > 0 && <span className="nav-badge">{count}</span>}
            </a>
          ))}
        </nav>
      </aside>
      <main>
        {showSetupBanner && (
          <div style={{
            background: "var(--color-warning-bg, #fffbe6)",
            border: "1px solid var(--color-warning-border, #ffe58f)",
            borderRadius: "6px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}>
            <div>
              <strong>Slack MCP の権限設定が必要です</strong>
              <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted, #666)" }}>
                Codex が Slack MCP ツールを実行するための承認設定が完了していません。設定するとエラーなく実行できます。
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {applyError && <span style={{ color: "var(--color-error, red)", fontSize: "0.875rem" }}>{applyError}</span>}
              <button className="btn-sm" onClick={handleApplySetup} disabled={applying}>
                {applying ? "設定中..." : "今すぐ設定する"}
              </button>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
