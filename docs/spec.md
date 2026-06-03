# Slack問い合わせ整理・返信案生成アプリ 仕様書

このリポジトリは、Slack等から取得したメッセージをCodex CLI + MCPにより整理し、ローカルUIでメッセージ、ToDo、返信案、判断理由、対象別相談チャット、実行ログ、ナレッジを確認するアプリケーションです。

- Slack/MCP/AI処理はアプリ本体に直接組み込まず、`packages/agent-runner` が Codex CLI を外部プロセスとして実行します。
- APIは`data`配下のJSON/Markdownと`knowledge`配下のMarkdownを読み書きします。
- UIは保存済みデータを表示し、手動実行と対象別チャットをAPIへ依頼します。
- Slackへの自動返信・自動投稿は実装しません。
