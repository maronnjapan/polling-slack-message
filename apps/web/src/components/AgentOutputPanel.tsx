import type { AgentRun } from "shared/types";
import { ReplySuggestion } from "./ReplySuggestion";
import { TodoList } from "./TodoList";
import { KnowledgeReferences } from "./KnowledgeReferences";
export function AgentOutputPanel({ run }: { run?: AgentRun }) {
  if (!run?.analysis)
    return (
      <section className="card">
        <h2>AI分析</h2>
        <p>まだAI分析結果はありません。</p>
      </section>
    );
  const a = run.analysis;
  return (
    <section className="card">
      <h2>AI分析</h2>
      <p>{a.summary}</p>
      <div className="chips">
        <span>返信必要: {a.replyRequired ? "はい" : "いいえ"}</span>
        <span>ToDo: {a.todoRequired ? "あり" : "なし"}</span>
        <span>緊急度: {a.urgency}</span>
        <span>信頼度: {a.confidence}</span>
      </div>
      <h3>返信候補</h3>
      {a.suggestedReplies.map((r, i) => (
        <ReplySuggestion key={i} reply={r} />
      ))}
      <h3>ToDo</h3>
      <TodoList todos={a.todos} />
      <h3>追加確認事項</h3>
      <TodoList todos={a.questionsToUser} />
      <h3>関連ナレッジ</h3>
      <KnowledgeReferences items={a.references} />
    </section>
  );
}
