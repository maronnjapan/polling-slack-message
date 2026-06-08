import type { ChatTargetType } from "shared/types";

export function buildChatPrompt(targetType: ChatTargetType, targetId: string, userMessage: string, context: unknown) {
  return `あなたは対象メッセージ相談アシスタントです。

ユーザーは、特定のSlackメッセージ、ToDo、または返信案について追加相談をしています。
Slackへの返信や投稿は絶対に行わないでください。認証情報を保存しないでください。
回答前にknowledge配下のMarkdown（knowledge/**/*.md）をすべて確認し、返信方針、ToDo判定ルール、人物メモ、プロジェクト文脈、用語、働き方に関する情報を回答へ反映してください。

対象: ${targetType}:${targetId}
ユーザー質問:
${userMessage}

以下のコンテキストを読んで回答してください。回答は、ユーザーがSlackでどう返すか、どう判断するか、どう対応するかを決めやすい内容にしてください。

${JSON.stringify(context, null, 2)}

回答をdata/chats配下の該当チャット履歴JSONにassistantメッセージとして保存し、Markdown確認用ファイルも更新してください。`;
}
