import { useState } from "react";
import type { ChatMessage } from "shared/types";
import { api } from "../api/client";
export function ChatPanel({
  messageId,
  initial,
  onNew,
}: {
  messageId: string;
  initial: ChatMessage[];
  onNew: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.chat(messageId, text);
      setText("");
      onNew();
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card">
      <h2>追加質問チャット</h2>
      <div className="chat">
        {initial.map((m) => (
          <div className={`bubble ${m.role}`} key={m.id}>
            <b>{m.role}</b>
            <p>{m.content}</p>
          </div>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="返信を短くして、ToDoだけ整理して、など"
      />
      <button disabled={busy} onClick={send}>
        {busy ? "送信中..." : "質問する"}
      </button>
    </section>
  );
}
