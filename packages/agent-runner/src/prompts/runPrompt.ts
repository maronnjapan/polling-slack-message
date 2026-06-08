function buildChannelLine(channel: string, config?: { additionalMcps: string[]; additionalPrompt: string }) {
  const lines = [`- ${channel}`];
  if (config?.additionalMcps && config.additionalMcps.length > 0) {
    lines.push(`  追加使用するMCPサーバー: ${config.additionalMcps.join(", ")}`);
  }
  if (config?.additionalPrompt) {
    lines.push(`  このチャンネル専用の追加指示: ${config.additionalPrompt}`);
  }
  return lines.join("\n");
}

export function buildNormalRunPrompt(
  allowedChannels: string[] = [],
  channelConfigs: Record<string, { additionalMcps: string[]; additionalPrompt: string }> = {},
): string {
  const channelRestriction =
    allowedChannels.length > 0
      ? `\n読み取り対象チャンネルを以下に限定してください（チャンネルIDまたはチャンネル名）:\n${allowedChannels.map((c) => buildChannelLine(c, channelConfigs[c])).join("\n")}\nそれ以外のチャンネルのメッセージは絶対に読み取らないでください。\n`
      : "";

  return `あなたはSlack問い合わせ整理アシスタントです。
${channelRestriction}
Slack MCPを使用して、未処理または最近のメッセージを取得してください。
取得したメッセージのうち、自分宛ての問い合わせ、対応が必要な依頼、返信した方がよい内容、ToDo化すべき内容を抽出してください。

処理前にknowledge配下のMarkdown（knowledge/**/*.md）をすべて確認し、内容を判断の前提として使用してください。特に、返信案を生成する場合はknowledge/reply-policy.mdとknowledge/rules/slack-reply-rules.mdを必ず参照し、ToDo化を判断する場合はknowledge/rules/todo-detection-rules.mdを必ず参照してください。人物名、プロジェクト名、用語、働き方に関係する内容があれば、knowledge/people、knowledge/project-context.md、knowledge/glossary.md、knowledge/work-style.mdも判断に反映してください。

各メッセージについて、要約、自分宛てか、対応必要か、ToDo化必要か、返信必要か、優先度、ToDo、返信案、判断理由サマリ、関連ナレッジを生成してください。

また、各メッセージのsourceフィールドには以下も含めてください:
- senderName: Slack MCP の users_info 等でユーザーの表示名（display_name または real_name）を取得して設定。取得できない場合は null。
- channelName: チャンネル情報（conversations_info 等）からチャンネル名を取得して設定。取得できない場合は null。
- permalink: chat_getPermalink 等でメッセージのパーマリンクURLを取得して設定。取得できない場合は null。

【ユーザーメモの反映】
data/messages配下の各メッセージJSON、およびdata/todos配下の各ToDo JSONには、ユーザーが手書きしたメモを保持する notes 配列があります。各メモは { id, body, createdAt, appliedAt } の形式です。
- appliedAt が null のメモのみを処理対象としてください。これらはユーザーが新たに書いた未反映の指示です。
- appliedAt に日時が入っているメモは既に反映済みです。内容を読み込まず、判断材料にもせず、そのまま変更せずに残してください。
- 未反映メモ（appliedAt が null）の内容に従って、対象のメッセージやToDo、および関連する返信案（data/replies）の内容を最新の状態に更新してください。例: 要約・対応要否・返信要否・優先度・status・ToDoのtitle/description/status/priority/due・返信案本文など、メモの指示に応じて適切に反映します。
- 反映したメモは notes 配列から削除せず、その id と body を保持したまま appliedAt にISO8601形式の現在日時を設定してください。これにより次回以降のポーリングでは読み込まれなくなります。
- メモを反映してアイテムを更新した場合は、そのアイテムの updatedAt も現在日時に更新してください。

Slackへの返信や投稿は絶対に行わないでください。MCP設定や認証情報は変更しないでください。認証情報をdataやknowledgeやログに保存しないでください。

結果は仕様書にあるJSON形式でdata/messages, data/todos, data/replies配下に保存してください。重複はsource.type, source.channel, source.messageTsで判定してください。新規に作成するメッセージやToDoには空の notes 配列（"notes": []）を含めてください。`;
}

export const setupPrompt = `Slack問い合わせ整理アプリの初回セットアップ確認です。

Codex CLIの動作、profile slack-assistant、MCP設定、Slack MCP接続、Slackメッセージ取得、data配下への書き込み、knowledge配下の読み取りを確認してください。
Slackへの返信や投稿は絶対に行わないでください。認証情報を保存しないでください。
確認結果をdata/runs配下のrunログとしてJSONで保存してください。`;
