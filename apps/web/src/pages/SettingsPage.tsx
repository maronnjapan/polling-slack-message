import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function SettingsPage() {
  const { data, loading, error, reload } = useAsync(api.settings, []);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: setupStatus, loading: setupLoading, reload: reloadSetup } = useAsync(api.slackSetupStatus, []);
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

  async function addChannel() {
    const trimmed = input.trim();
    if (!trimmed || !data) return;
    const next = [...new Set([...data.allowedChannels, trimmed])];
    await save(next);
    setInput("");
  }

  async function removeChannel(ch: string) {
    if (!data) return;
    await save(data.allowedChannels.filter((c) => c !== ch));
  }

  async function save(allowedChannels: string[]) {
    setSaving(true);
    setSaveError(null);
    try {
      await api.patchSettings({ allowedChannels });
      reload();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>設定</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Slack MCP 権限</h2>
        <p style={{ color: "var(--text-muted, #666)", fontSize: "0.875rem" }}>
          Codex が Slack MCP ツールを承認なしで実行できるよう、<code>.codex/config.toml</code> に権限設定を書き込みます。
          初回のみ必要です。設定後は Codex 実行が権限エラーで中断されなくなります。
        </p>

        {setupLoading && <p>読み込み中...</p>}

        {setupStatus && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.3rem 0.6rem",
              borderRadius: "4px",
              fontSize: "0.875rem",
              background: setupStatus.configured ? "var(--color-success-bg, #f6ffed)" : "var(--color-warning-bg, #fffbe6)",
              border: `1px solid ${setupStatus.configured ? "var(--color-success-border, #b7eb8f)" : "var(--color-warning-border, #ffe58f)"}`,
              color: setupStatus.configured ? "var(--color-success, #389e0d)" : "var(--color-warning, #ad6800)",
            }}>
              {setupStatus.configured ? "設定済み" : `未設定（${setupStatus.approvedTools.length}/${setupStatus.requiredTools.length} ツール承認済み）`}
            </span>
            {!setupStatus.configured && (
              <button className="btn-sm" onClick={handleApplySetup} disabled={applying}>
                {applying ? "設定中..." : "権限を設定する"}
              </button>
            )}
          </div>
        )}

        {applyError && <p className="error" style={{ marginTop: "0.5rem" }}>{applyError}</p>}

        {setupStatus && (
          <ul style={{ marginTop: "0.75rem", padding: 0, listStyle: "none" }}>
            {setupStatus.requiredTools.map((tool) => {
              const approved = setupStatus.approvedTools.includes(tool);
              return (
                <li key={tool} style={{ fontSize: "0.8rem", color: "var(--text-muted, #666)", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                  <span style={{ color: approved ? "var(--color-success, #389e0d)" : "var(--color-warning, #ad6800)" }}>
                    {approved ? "✓" : "○"}
                  </span>
                  <code>{tool}</code>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>読み取り対象チャンネル</h2>
        <p style={{ color: "var(--text-muted, #666)", fontSize: "0.875rem" }}>
          指定したチャンネルのみを Slack MCP の読み取り対象にします。空の場合はすべてのチャンネルが対象です。
          チャンネル ID（例: C01ABCDEF）またはチャンネル名（例: general）を入力してください。
        </p>

        {loading && <p>読み込み中...</p>}
        {error && <p className="error">{error}</p>}
        {saveError && <p className="error">{saveError}</p>}

        {data && (
          <>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addChannel()}
                placeholder="チャンネル ID またはチャンネル名"
                style={{ flex: 1, padding: "0.4rem 0.6rem", fontSize: "0.875rem" }}
                disabled={saving}
              />
              <button className="btn-sm" onClick={addChannel} disabled={saving || !input.trim()}>
                追加
              </button>
            </div>

            {data.allowedChannels.length === 0 ? (
              <p style={{ color: "var(--text-muted, #666)", fontSize: "0.875rem" }}>
                制限なし（すべてのチャンネルを読み取ります）
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {data.allowedChannels.map((ch) => (
                  <li
                    key={ch}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.4rem 0.6rem",
                      marginBottom: "0.25rem",
                      background: "var(--surface-2, #f5f5f5)",
                      borderRadius: "4px",
                    }}
                  >
                    <code style={{ fontSize: "0.875rem" }}>{ch}</code>
                    <button
                      className="btn-sm"
                      onClick={() => removeChannel(ch)}
                      disabled={saving}
                      style={{ marginLeft: "1rem" }}
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  );
}
