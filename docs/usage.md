# 実行手順

Slack問い合わせ整理・返信案生成アプリの起動・運用手順です。
セットアップが未完了の場合は先に [セットアップ手順（setup.md）](./setup.md) を実施してください。

---

## 1. 全体を一括起動（推奨）

API・Web・エージェント常駐（watch）をまとめて起動します。

```bash
pnpm dev
```

起動するもの:

| プロセス | 内容 | アクセス先 |
| --- | --- | --- |
| API (Hono) | `data` / `knowledge` を読み書き | http://127.0.0.1:8787 |
| Web (Vite SPA) | 保存済みデータの閲覧・操作UI | http://127.0.0.1:5173 |
| Agent watch | 60秒間隔で Codex 実行（定期取得・整理） | （バックグラウンド） |

ブラウザで **http://127.0.0.1:5173** を開くとUIが表示されます。

> `pnpm dev` は `pnpm dev:api`・`pnpm dev:web`・`pnpm agent:watch` を並行起動します。
> 常駐の定期実行が不要な場合は、下記の個別起動を使ってください。

---

## 2. 個別に起動する

用途に応じて単体で起動できます。

```bash
# API のみ
pnpm dev:api    # http://127.0.0.1:8787

# Web のみ（API が別途起動している前提）
pnpm dev:web    # http://127.0.0.1:5173
```

開発時の典型構成は「ターミナルA: `pnpm dev:api`」「ターミナルB: `pnpm dev:web`」の2枚です。
エージェントは必要なときだけ手動実行（後述の `pnpm agent:run`）にすると、Codex の呼び出しを制御しやすくなります。

---

## 3. エージェント実行（Slack取得・整理・返信案生成）

すべて Codex CLI を外部プロセスとして呼び出します。実行結果は `data/runs/` にログ（JSON + Markdown）として残ります。

| コマンド | 用途 |
| --- | --- |
| `pnpm agent:setup` | 初回疎通確認（Codex / profile / MCP / Slack取得 / data書き込み） |
| `pnpm agent:run` | 1回だけ手動実行（メッセージ取得→整理→ToDo/返信案生成） |
| `pnpm agent:once` | `agent:run` と同じ（1回実行） |
| `pnpm agent:watch` | 60秒間隔で定期実行（常駐） |

### 手動で1回実行

```bash
pnpm agent:run
```

実行されること（`packages/agent-runner` のプロンプトに基づく）:

1. Slack MCP 経由で未処理・最近のメッセージを取得
2. `knowledge/` を参照（返信は `reply-policy.md`、ToDo判定は `rules/todo-detection-rules.md`）
3. 自分宛て / 対応要否 / ToDo化要否 / 返信要否 / 優先度 を判定
4. 要約・ToDo・返信案・判断理由・関連ナレッジを生成
5. `data/messages` / `data/todos` / `data/replies` に JSON + Markdown で保存
   - 重複は `source.type` / `source.channel` / `source.messageTs` で判定

> **Slackへの返信・自動投稿は一切行いません。** 生成されるのは「返信案」までです。投稿は人間が手動で行います。

### 定期実行（常駐）

```bash
pnpm agent:watch
```

- 60秒間隔で `agent:run` 相当を実行します（`Ctrl+C` で停止）。
- 前回実行がまだ走っている場合、その回はスキップされ、`status: "partial"` の run ログが残ります。

---

## 4. 対象別の相談チャット

特定のメッセージ・ToDo・返信案について、Codex に追加相談できます。
結果は `data/chats/` に保存され、UIからも参照できます。

```bash
pnpm agent:chat <target-type> <target-id> "<相談内容>"
```

- `<target-type>`: `slack_message` / `todo` / `reply` のいずれか
- `<target-id>`: 対象の ID
- `<相談内容>`: 自由記述

例:

```bash
pnpm agent:chat slack_message msg-2026-06-03-001 "もう少し丁寧な返信案にして"
```

Codex 実行に失敗した場合は、チャットに「Codex CLIで回答生成できませんでした。…」というアシスタント応答が記録され、run ログに `failed` が残ります。

---

## 5. UI からの操作

http://127.0.0.1:5173 で以下を確認・操作できます（`apps/web/src/pages`）。

| 画面 | 内容 |
| --- | --- |
| Dashboard | 全体サマリ |
| Messages / Message詳細 | 取得・整理したメッセージ一覧と詳細 |
| Todos / Todo詳細 | ToDo一覧・詳細（ステータス更新可: `PATCH /todos/:id`） |
| Replies / Reply詳細 | 返信案一覧・詳細（更新可: `PATCH /replies/:id`） |
| Runs | エージェント実行ログ |
| Knowledge | `knowledge/` 配下のMarkdown閲覧 |

UI からも手動実行を依頼できます（API: `POST /api/agent/run`、`POST /api/agent/setup`）。
対象詳細画面からチャット送信（`POST /api/chats/:targetType/:targetId/messages`）も可能です。

---

## 6. データ整合性チェック / Lint / テスト

```bash
# data 配下のJSONをスキーマ検証し件数を表示
pnpm data:validate

# 全ワークスペースの型チェック
pnpm lint

# data:validate + lint
pnpm test
```

---

## 7. 主なAPIエンドポイント（参考）

ベースURL: `http://127.0.0.1:8787/api`

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/health` | ヘルスチェック |
| GET | `/messages`, `/messages/:id` | メッセージ一覧・詳細 |
| GET / PATCH | `/todos`, `/todos/:id` | ToDo 取得・更新 |
| GET / PATCH | `/replies`, `/replies/:id` | 返信案 取得・更新 |
| GET / POST | `/chats/:targetType/:targetId`, `/chats/:targetType/:targetId/messages` | チャット取得・送信 |
| GET | `/runs`, `/runs/:id` | 実行ログ |
| POST | `/agent/run`, `/agent/setup` | エージェント手動実行 |
| GET | `/knowledge`, `/knowledge/:path` | ナレッジ取得 |

---

## 運用上の注意

- **Slackへの自動返信・自動投稿はしません**。生成物は「案」です。投稿は人間の判断で行ってください。
- **認証情報を `data` / `knowledge` / ログに保存しないでください**。Slack/MCP/Codex の認証はすべて Codex CLI 側で管理します。
- `data/` は `.gitignore` 済みで、エージェント生成物です。バックアップが必要な場合は別途取得してください。
- `knowledge/`（返信ポリシー・ToDo判定ルール・用語集・人物メモ等）を整備するほど、生成される返信案・判断の精度が安定します。
