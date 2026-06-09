import { useState } from "react";
import { api } from "../api/client";
import { ChatPanel } from "../components/ChatPanel";
import { useAsync } from "../hooks/useAsync";
import { getMessageTitle } from "../lib/messages";
import type { ReplyStatus } from "shared/types";

const STATUS_OPTIONS: { value: ReplyStatus; label: string }[] = [
  { value: "draft", label: "下書き" },
  { value: "edited", label: "編集済み" },
  { value: "approved", label: "返信完了" },
  { value: "dismissed", label: "却下" },
];

export function ReplyDetailPage({ id }: { id: string }) {
  const reply = useAsync(() => api.reply(id), [id]);
  const messages = useAsync(api.messages, []);
  const [busy, setBusy] = useState(false);

  if (reply.loading) return <p>読み込み中...</p>;
  if (reply.error || !reply.data) return <p className="error">{reply.error ?? "not found"}</p>;

  const m = messages.data?.find((x) => x.id === reply.data?.sourceMessageId);

  async function changeStatus(status: ReplyStatus) {
    if (!reply.data || reply.data.status === status) return;
    setBusy(true);
    try { await api.patchReply(id, status); reply.reload(); } finally { setBusy(false); }
  }

  return (
    <>
      <h1>返信案詳細</h1>
      <section className="card">
        <h2>Draft</h2>
        <p className="draft">{reply.data.draftReply}</p>
        <dl>
          <dt>tone</dt><dd>{reply.data.tone}</dd>
          <dt>status</dt>
          <dd>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`btn-sm ${reply.data?.status === opt.value ? "" : "btn-outline"}`}
                  disabled={busy || reply.data?.status === opt.value}
                  onClick={() => changeStatus(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </dd>
          <dt>元メッセージ</dt><dd>{m ? <a href={`#/messages/${m.id}`}>{getMessageTitle(m)}</a> : reply.data.sourceMessageId}</dd>
          <dt>判断理由</dt><dd>{reply.data.reasonSummary}</dd>
        </dl>
        <p className="note">Slackへの自動投稿ボタンはありません。内容確認後、必要に応じて手動で返信してください。</p>
      </section>
      <ChatPanel targetType="reply" targetId={id} />
    </>
  );
}
