# Slack MCP Inquiry Support Local App

Slack MCP経由で自分に関係する問い合わせ候補を取得し、ローカルUIでAI要約・返信候補・ToDo・関連ナレッジを確認する個人用支援アプリです。Slack APIは直接呼び出さず、Slackへの自動返信も行いません。

## 構成

- React + Vite SPA (`apps/web`)
- Hono + Node.js Local API (`apps/server`)
- pnpm workspace
- MCP TypeScript SDKによるSlack MCP Provider
- Vercel AI SDK CoreによるAI Provider抽象
- Markdown主保存 + SQLiteメタデータ管理
- 1Password CLI起動スクリプトによるsecret注入

## セットアップ

```bash
pnpm install
pnpm dev
```

デフォルトAI Providerは `mock` なのでAPIキーなしで動作確認できます。

## Secret注入付き起動

APIキーは `.env` に保存しません。1Password CLIで環境変数へ注入して起動します。

```bash
AI_PROVIDER=openrouter AI_MODEL=anthropic/claude-3.5-sonnet pnpm dev:with-secrets
```

OpenAI / Anthropicを使う場合は `AI_PROVIDER` と `AI_MODEL` を切り替えてください。1Password item参照は `OPENROUTER_OP_REF` / `OPENAI_OP_REF` / `ANTHROPIC_OP_REF` で上書きできます。

## MCP設定

`config/app.json` の `mcp` を設定します。

```json
{
  "mcp": {
    "mode": "stdio",
    "command": "your-slack-mcp-server-command",
    "args": [],
    "env": {}
  }
}
```

Slack MCPのtool名が異なる場合は `config/mcp-tools.json` を編集してください。MVPでは read/search/fetch/list/get 系toolのみ呼び出し、send/post/update/delete/invite/create 系toolはブロックします。

## 主なAPI

- `GET /api/health`
- `GET /api/mcp/status`
- `GET /api/ai/status`
- `GET /api/polling/status`
- `POST /api/polling/run-once`
- `GET /api/messages`
- `GET /api/messages/:id`
- `PATCH /api/messages/:id/status`
- `POST /api/messages/:id/chat`
- `GET /api/knowledge`
- `POST /api/knowledge`

## 検証

```bash
pnpm typecheck
pnpm build
```
