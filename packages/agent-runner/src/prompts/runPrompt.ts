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

処理前にknowledge配下を確認してください。返信案を生成する場合はknowledge/reply-policy.mdを参照し、ToDo化を判断する場合はknowledge/rules/todo-detection-rules.mdを参照してください。

各メッセージについて、要約、自分宛てか、対応必要か、ToDo化必要か、返信必要か、優先度、ToDo、返信案、判断理由サマリ、関連ナレッジを生成してください。

また、各メッセージのsourceフィールドには以下も含めてください:
- senderName: Slack MCP の users_info 等でユーザーの表示名（display_name または real_name）を取得して設定。取得できない場合は null。
- channelName: チャンネル情報（conversations_info 等）からチャンネル名を取得して設定。取得できない場合は null。
- permalink: chat_getPermalink 等でメッセージのパーマリンクURLを取得して設定。取得できない場合は null。

Slackへの返信や投稿は絶対に行わないでください。MCP設定や認証情報は変更しないでください。認証情報をdataやknowledgeやログに保存しないでください。

結果は仕様書にあるJSON形式でdata/messages, data/todos, data/replies配下に保存してください。重複はsource.type, source.channel, source.messageTsで判定してください。`;
}

export const setupPrompt = `Slack問い合わせ整理アプリの初回セットアップ確認です。

Codex CLIの動作、profile slack-assistant、MCP設定、Slack MCP接続、Slackメッセージ取得、data配下への書き込み、knowledge配下の読み取りを確認してください。
Slackへの返信や投稿は絶対に行わないでください。認証情報を保存しないでください。
確認結果をdata/runs配下のrunログとしてJSONで保存してください。`;
