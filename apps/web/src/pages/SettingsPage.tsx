import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import type { ChannelConfig } from "shared/types";

function ChannelItem({
  channel,
  config,
  saving,
  onRemove,
  onSaveConfig,
}: {
  channel: string;
  config: ChannelConfig;
  saving: boolean;
  onRemove: () => void;
  onSaveConfig: (ch: string, cfg: ChannelConfig) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [mcpInput, setMcpInput] = useState(config.additionalMcps.join(", "));
  const [promptInput, setPromptInput] = useState(config.additionalPrompt);

  function handleSave() {
    const mcps = mcpInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSaveConfig(channel, { additionalMcps: mcps, additionalPrompt: promptInput });
    setExpanded(false);
  }

  function handleCancel() {
    setMcpInput(config.additionalMcps.join(", "));
    setPromptInput(config.additionalPrompt);
    setExpanded(false);
  }

  const hasConfig = config.additionalMcps.length > 0 || config.additionalPrompt;

  return (
    <li
      style={{
        marginBottom: "0.5rem",
        background: "var(--surface-2, #f5f5f5)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.4rem 0.6rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <code style={{ fontSize: "0.875rem" }}>{channel}</code>
          {hasConfig && (
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.1rem 0.4rem",
                background: "var(--color-info-bg, #e6f7ff)",
                border: "1px solid var(--color-info-border, #91d5ff)",
                borderRadius: "3px",
                color: "var(--color-info, #0050b3)",
              }}
            >
              設定あり
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            className="btn-sm"
            onClick={() => setExpanded((v) => !v)}
            disabled={saving}
          >
            {expanded ? "閉じる" : "設定"}
          </button>
          <button className="btn-sm" onClick={onRemove} disabled={saving}>
            削除
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            padding: "0.75rem",
            borderTop: "1px solid var(--border, #e0e0e0)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <label style={{ fontSize: "0.875rem" }}>
            <div style={{ marginBottom: "0.25rem", fontWeight: 500 }}>追加MCPサーバー</div>
            <input
              type="text"
              value={mcpInput}
              onChange={(e) => setMcpInput(e.target.value)}
              placeholder="例: notion-assistant, google-calendar（カンマ区切り）"
              style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.875rem", boxSizing: "border-box" }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #888)", marginTop: "0.2rem" }}>
              このチャンネル処理時に追加で使用するMCPサーバー名をカンマ区切りで入力
            </div>
          </label>

          <label style={{ fontSize: "0.875rem" }}>
            <div style={{ marginBottom: "0.25rem", fontWeight: 500 }}>追加プロンプト</div>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="このチャンネル専用の追加指示を入力"
              rows={3}
              style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.875rem", resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #888)", marginTop: "0.2rem" }}>
              このチャンネルのメッセージ処理時にエージェントへ渡す追加の指示
            </div>
          </label>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-sm" onClick={handleSave} disabled={saving}>
              保存
            </button>
            <button className="btn-sm" onClick={handleCancel} disabled={saving}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

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
    if (data.allowedChannels.includes(trimmed)) return;
    const next = [...data.allowedChannels, trimmed];
    await save(next, data.channelConfigs);
    setInput("");
  }

  async function removeChannel(ch: string) {
    if (!data) return;
    const nextChannels = data.allowedChannels.filter((c) => c !== ch);
    const nextConfigs = { ...data.channelConfigs };
    delete nextConfigs[ch];
    await save(nextChannels, nextConfigs);
  }

  async function saveChannelConfig(ch: string, cfg: ChannelConfig) {
    if (!data) return;
    const nextConfigs = { ...data.channelConfigs, [ch]: cfg };
    await save(data.allowedChannels, nextConfigs);
  }

  async function save(allowedChannels: string[], channelConfigs: Record<string, ChannelConfig>) {
    setSaving(true);
    setSaveError(null);
    try {
      await api.patchSettings({ allowedChannels, channelConfigs });
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
          各チャンネルに追加のMCPサーバーや追加プロンプトを設定できます。
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
                  <ChannelItem
                    key={ch}
                    channel={ch}
                    config={data.channelConfigs[ch] ?? { additionalMcps: [], additionalPrompt: "" }}
                    saving={saving}
                    onRemove={() => removeChannel(ch)}
                    onSaveConfig={saveChannelConfig}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  );
}
