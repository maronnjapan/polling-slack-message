# セットアップ手順

Slack問い合わせ整理・返信案生成アプリのローカルセットアップ手順です。
本アプリは以下の3要素で構成されています。

- **Web (SPA)**: `apps/web` — Vite + React。保存済みデータを閲覧・操作するUI。
- **API**: `apps/api` — Hono。`data` / `knowledge` 配下のファイルを読み書きするローカルAPI。
- **Agent Runner**: `packages/agent-runner` — Codex CLI を外部プロセスとして実行する常駐/バッチ処理。Slack/MCP/AI処理はここに閉じ込められています。

> アプリ本体は Slack Web API / MCP client / token管理 / 自動投稿を **持ちません**。
> Slack連携・AI処理はすべて Codex CLI 経由（`agent-runner`）で行います。

---

## 1. 前提条件

| 項目 | 要件 | 用途 |
| --- | --- | --- |
| Node.js | v18 以上（推奨 v20+） | API / Web / Agent Runner の実行 |
| pnpm | v8 以上 | モノレポのワークスペース管理 |
| Codex CLI | `codex` コマンドが PATH 上にあること | Slack取得・整理・返信案生成 |
| Codex profile | `slack-assistant` プロファイルが設定済みであること | エージェント実行時に `--profile slack-assistant` で参照 |
| MCP設定 | Codex 側に Slack MCP サーバが設定済みであること | Slackメッセージ取得 |

> **重要**: Slackトークン・MCP認証情報・Codex認証情報は、このリポジトリ（`data` / `knowledge` / ログ）に**保存しません**。
> 認証情報はすべて Codex CLI 側の設定に閉じ込めてください。

### Codex CLI の確認

エージェント実行は内部的に次のようなコマンドを呼び出します（`packages/agent-runner/src/codex/runCodex.ts`）。

```bash
# 通常実行
codex exec --profile slack-assistant --sandbox workspace-write --ask-for-approval never "<プロンプト>"

# 初回セットアップ確認
codex exec --profile slack-assistant --sandbox workspace-write "<プロンプト>"
```

事前に手動で `codex exec --profile slack-assistant ...` が通ることを確認しておくとトラブルが減ります。

---

## 2. 依存関係のインストール

リポジトリのルートで実行します。

```bash
cd polling-slack-message
pnpm install
```

ワークスペース（`apps/*`, `packages/*`）の依存がまとめて解決されます。

---

## 3. ビルド確認 / 型チェック

各 `pnpm dev:*` / `pnpm agent:*` スクリプトは実行前に必要なパッケージ（`zod` / `shared` / `agent-runner` など）を自動ビルドしますが、初回は通しでビルドできることを確認しておくと安心です。

```bash
# 型チェック（全ワークスペース）
pnpm lint

# データ整合性チェック + lint
pnpm test
```

`pnpm test` は `pnpm data:validate`（`data` 配下のJSONをスキーマ検証）と `pnpm lint` を実行します。

---

## 4. ディレクトリ構成と保存先

```
polling-slack-message/
├── apps/
│   ├── web/         # Vite + React SPA (UI)
│   └── api/         # Hono API
├── packages/
│   ├── agent-runner/  # Codex CLI 実行（Slack/MCP/AI はここのみ）
│   ├── shared/        # 共有 types / schemas
│   └── ...            # vite/react/hono 等のワークスペース内パッケージ
├── knowledge/       # ナレッジ（Markdown・人手で編集）
│   ├── profile.md, work-style.md, reply-policy.md, glossary.md, project-context.md
│   ├── people/      # 人物別メモ
│   └── rules/       # slack-reply-rules.md, todo-detection-rules.md
└── data/            # エージェント生成データ（.gitignore 対象・自動生成）
    ├── messages/    # 取得・整理したメッセージ（日付別フォルダ）
    ├── todos/       # ToDo
    ├── replies/     # 返信案
    ├── chats/       # 対象別相談チャット
    └── runs/        # 実行ログ
```

- `data/` 配下は **JSONがUIの真実のソース**、同名の **Markdownが人間確認用**として両方保存されます。
- `data/` は `.gitignore` 済みです（コミットされません）。`data` ディレクトリはエージェント実行時に自動生成されます。
- `knowledge/` は人手で編集する前提のファイルです。返信ポリシー・ToDo判定ルールなどを運用に合わせて整備してください。

---

## 5. 環境変数（任意）

| 変数 | 既定値 | 説明 |
| --- | --- | --- |
| `PORT` | `8787` | API のリッスンポート（`apps/api/src/server.ts`） |
| `VITE_API_BASE` | `http://127.0.0.1:8787/api` | Web からの API 接続先（`apps/web/src/api/client.ts`） |

既定値のままで動作します。ポートを変える場合は `PORT` と `VITE_API_BASE` を整合させてください。

`.env` は `.gitignore` 済みです。**Slackトークン等の機密情報をここに置かないでください**（認証はCodex側で管理）。

---

## 6. 初回セットアップ確認（エージェント疎通）

依存インストール後、Codex CLI / `slack-assistant` プロファイル / MCP / Slack取得 / `data` 書き込みが通るかを確認します。

```bash
pnpm agent:setup
```

- 成功すると `data/runs/` に run ログ（JSON + Markdown）が `status: "success"` で保存されます。
- 失敗した場合は `status: "failed"` となり、`errors` に `command` / `exitCode` / `stderrSummary` が記録されます。Codex CLI・プロファイル・MCP設定を見直してください。

セットアップが通れば、[実行手順（usage.md）](./usage.md) に進んでください。

---

## トラブルシューティング

| 症状 | 確認ポイント |
| --- | --- |
| `agent:setup` / `agent:run` が `exitCode: 127` で失敗 | `codex` コマンドが PATH に無い。Codex CLI のインストールを確認 |
| run が `failed`（127以外） | `slack-assistant` プロファイル・MCP設定・Slack認証を確認。手動で `codex exec --profile slack-assistant ...` が通るか確認 |
| Web から API に繋がらない | API が起動しているか、`VITE_API_BASE` / `PORT` の整合を確認 |
| `data:validate` でスキーマエラー | `data/` 配下のJSONが破損。該当ファイルを修正、または再生成 |
| チャットで「Codex CLIで回答生成できませんでした」 | Codex CLI / プロファイル / MCP 設定を確認 |
