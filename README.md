# Slack問い合わせ整理・返信案生成アプリ

Codex CLI と MCP 設定を利用してSlack問い合わせを整理し、ローカルの Vite SPA + Hono API で保存済みデータを確認するアプリです。

## Commands

```bash
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm agent:setup
pnpm agent:run
pnpm agent:watch
pnpm agent:once
pnpm agent:chat slack_message <message-id> "相談内容"
pnpm data:validate
pnpm lint
pnpm test
```

Slack API、MCP client、token管理、Slack自動投稿はアプリ本体に実装していません。Codex CLI実行は `packages/agent-runner` に閉じ込めています。
