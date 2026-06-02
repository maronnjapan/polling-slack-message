import { useState } from "react";
export function ReplySuggestion({ reply }: { reply: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="reply">
      <pre>{reply}</pre>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(reply);
          setCopied(true);
        }}
      >
        返信候補をコピー
      </button>
      {copied && <span className="ok">コピーしました</span>}
    </div>
  );
}
