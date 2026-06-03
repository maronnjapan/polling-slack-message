import { useState } from "react";
import type { ChatTargetType } from "shared/types";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

export function ChatPanel({ targetType, targetId }: { targetType: ChatTargetType; targetId: string }) {
  const { data, error, loading, reload } = useAsync(() => api.chat(targetType, targetId), [targetType, targetId]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  async function send() {
    if (!message.trim()) return;
    setSending(true); setSendError(null);
    try { await api.sendChat(targetType, targetId, message); setMessage(""); reload(); } catch (e) { setSendError(e instanceof Error ? e.message : String(e)); } finally { setSending(false); }
  }
  return <section className="card"><h2>対象別相談チャット</h2>{loading && <p>読み込み中...</p>}{error && <p className="error">{error}</p>}<div className="chat-log">{data?.messages?.length ? data.messages.map((m, i) => <div className={`chat ${m.role}`} key={i}><strong>{m.role}</strong><p>{m.content}</p><small>{m.createdAt}</small></div>) : <p>まだチャットはありません。</p>}</div><textarea value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="この返信案で角が立たないか、などを相談" /><button onClick={send} disabled={sending}>{sending ? "回答生成中..." : "送信"}</button>{sendError && <p className="error">{sendError}</p>}</section>;
}
