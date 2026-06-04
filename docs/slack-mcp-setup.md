# Slack MCP セットアップ手順

この手順は、このアプリからSlack MCPを読みに行ける状態にするためのものです。Slackデータの取得はSlack MCP経由で行います。Slack OAuthの認可とtoken交換だけは、このアプリのローカルcallbackで処理できます。このアプリはSlackへ自動返信せず、Slack tokenやOAuth credentialを`config/app.json`へ保存しない前提で作っています。

## 完了条件

最後に次の状態になればセットアップ完了です。

- `pnpm dev` でアプリが起動する
- `http://localhost:5174/api/slack/oauth/status` が `authorized: true` を返す
- `http://localhost:5174/api/mcp/status` が `connected: true` を返す
- 同じレスポンスで `hasRequiredTools: true` になる
- UIのMCP Server表示が「接続中」になる

## 最短手順

まずSlack公式MCPが使えるworkspaceか確認します。Slack appの作成・MCP設定・認可の途中で「Enterprise」「Enterprise Grid」「organization」などの制約を示すメッセージが出る場合、そのworkspaceではSlack公式MCP endpointへ直接つなぐ方式は使えません。その場合は、この最短手順ではなく `4. 接続方式B: stdioでローカルMCP serverを起動する` に進んでください。

Slack公式MCPが使える場合は、この順番で進めます。

1. Slack appを作ります。
2. Slack appの `OAuth & Permissions` でPKCEを有効化します。
3. Redirect URLに `http://localhost:5174/api/slack/oauth/callback` を登録します。
4. User Token Scopesに、この手順の `1-4` のscopeを追加します。Bot Token Scopesは追加しません。
5. `SLACK_MCP_CLIENT_ID=<Client ID> pnpm dev` でこのアプリを起動します。
6. `http://localhost:5174/api/slack/oauth/authorize` を開いて認可します。
7. `curl http://localhost:5174/api/mcp/status` で `connected: true` を確認します。

## 0. 最初に決めること

Slack MCPの接続方式を1つ選びます。

| 方式              | 使う場面                                                             | このアプリ側の設定                         |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| `streamable-http` | Slack公式MCP endpointまたは認証済みHTTP MCP gatewayへ接続する        | `mode` / `url` / 必要なら `auth` を設定    |
| `stdio`           | ローカルのSlack MCP serverコマンドをこのアプリから子プロセス起動する | `mode` / `command` / `args` / `env` を設定 |

迷う場合は、Slack公式MCP endpointへ `streamable-http` で接続し、このアプリのPKCE OAuthを使ってください。ローカルcallbackは `http://localhost:5174/api/slack/oauth/callback` を使えます。

## 1. Slack側で用意するもの

公式Slack MCP Serverを使う場合、Slack側では「MCP client用のSlack app」を1つ作ります。Slack公式MCPは、登録済みSlack appの固定App IDを使って、OAuthでユーザーにSlackデータへのアクセスを許可してもらう仕組みです。

重要な前提です。

- 公式Slack MCP endpointは `https://mcp.slack.com/mcp`
- transportは Streamable HTTP
- OAuth認可URLは `https://slack.com/oauth/v2_user/authorize`
- OAuth token交換URLは `https://slack.com/api/oauth.v2.user.access`
- Slack公式MCPはSSE接続に対応していません
- Slack公式MCPはDynamic Client Registrationに対応していません
- MCPで使えるSlack appは internal app またはSlack Marketplace公開appです
- このローカルアプリはPKCEを使う場合だけSlack OAuthを処理できます
- PKCE + localhost redirectではbot scopeを要求できません。このアプリではUser Token Scopesだけを使います。
- Slack公式MCPはSlack側のプラン、組織設定、管理者承認、app種別によって使えないことがあります。設定画面や認可画面でEnterprise限定と表示されるworkspaceでは、この方式は使えません。

つまり、Slack側でSlack appを作ったあと、localhostで使う場合はその app の `client_id` をこのアプリへ渡します。`client_secret` は使いません。gateway/sidecar方式を使う場合は、そのgateway/sidecar側でOAuthを処理させ、このアプリはgateway/sidecarへMCP接続します。

### 1-1. 権限を確認する

先に、Slack workspaceで次の作業ができるか確認してください。

- Slack appを作成できる
- Slack appへOAuth scopeを追加できる
- Slack appをworkspaceへインストール、またはインストール申請できる
- 必要ならworkspace管理者にapp approvalを依頼できる

会社やチームのSlackでは、一般ユーザーが自由にappを作成・インストールできないことがあります。その場合は、この手順で作るapp名、目的、必要scopeを管理者に渡して承認してもらいます。

### 1-2. Slack appを作る

ブラウザでSlackのApp Managementを開きます。

```text
https://api.slack.com/apps
```

手順です。

1. Slackにログインします。
2. `Create New App` を押します。
3. `From scratch` を選びます。
4. App Nameに分かりやすい名前を入れます。例: `Local Slack MCP Inquiry Agent`
5. Development Slack Workspaceで、このアプリに読ませたいworkspaceを選びます。
6. `Create App` を押します。

app作成後、左メニューの `Basic Information` で次を確認します。

- `App ID`
- `Client ID`
- `Client Secret`

`Client Secret` はsecretです。README、`config/app.json`、Git管理されるファイルには書かないでください。

### 1-3. OAuth redirect URLを設定する

左メニューの `OAuth & Permissions` を開き、`Redirect URLs` にOAuth callback URLを追加します。

localhostでこのアプリから直接Slack公式MCPへ接続する場合は、次を登録します。

```text
http://localhost:5174/api/slack/oauth/callback
```

同じ `OAuth & Permissions` 画面でPKCEを有効にしてください。SlackではPKCEを有効にしたappの `http://localhost:...` redirectはデスクトップリダイレクトとして扱われます。PKCEは一度有効にすると通常は自分では無効化できないため、このローカル接続専用のSlack appで有効化するのが無難です。

PKCE + localhost redirectでは、User Token Scopesだけを使います。Bot Token Scopesを同時に要求するとSlack側で拒否されます。

MCP gateway/sidecarにOAuthを任せる場合は、このローカルアプリのURLではなく、gateway/sidecarのcallback URLを登録します。

例です。

```text
https://your-mcp-gateway.example.com/slack/oauth/callback
```

PKCEを使わない通常のサーバーOAuthでは、SlackのRedirect URLはHTTPSが必要です。その場合は、ngrok、Cloudflare Tunnel、社内のHTTPS gatewayなどを使い、公開HTTPS URLをgateway/sidecarへ向けます。

使っているMCP gateway/sidecarのドキュメントにcallback pathが書かれている場合は、そのURLをそのまま登録してください。分からない場合は、gateway/sidecar側で「Slack OAuth redirect URL」「callback URL」「redirect_uri」と書かれている項目を探します。

### 1-4. User Token Scopesを追加する

`OAuth & Permissions` の `Scopes` で、Bot Token Scopesではなく User Token Scopes に追加します。Slack公式MCPのOAuth scopes表は user token 前提です。

このアプリの読み取り用途では、まず次を追加します。

```text
search:read.public
search:read.private
search:read.mpim
search:read.im
channels:history
groups:history
mpim:history
im:history
users:read
```

それぞれの意味です。

| scope                 | 用途                           |
| --------------------- | ------------------------------ |
| `search:read.public`  | public channelの検索           |
| `search:read.private` | private channelの検索          |
| `search:read.mpim`    | 複数人DMの検索                 |
| `search:read.im`      | 1対1 DMの検索                  |
| `channels:history`    | public channelの履歴読み取り   |
| `groups:history`      | private channelの履歴読み取り  |
| `mpim:history`        | 複数人DMの履歴読み取り         |
| `im:history`          | 1対1 DMの履歴読み取り          |
| `users:read`          | ユーザー名やプロフィールの取得 |

最初からDMやprivate channelを読ませたくない場合は、対象を絞れます。

- public channelだけ: `search:read.public` と `channels:history` と `users:read`
- private channelも読む: `search:read.private` と `groups:history` を追加
- DMも読む: `search:read.im` と `im:history` を追加
- 複数人DMも読む: `search:read.mpim` と `mpim:history` を追加

このローカルアプリはSlackへ書き込まないので、通常は `chat:write` などの書き込みscopeは不要です。

scopeを追加・変更した場合は、もう一度 `http://localhost:5174/api/slack/oauth/authorize` から認可し直してください。

### 1-5. manifestで作る場合

Slack app作成時に `From an app manifest` を選ぶ場合は、次のYAMLをベースにできます。localhostで使う場合はPKCEを有効化し、`redirect_urls` にこのアプリのcallback URLを入れます。

```yaml
display_information:
  name: Local Slack MCP Inquiry Agent
  description: Read Slack messages through Slack MCP for local inquiry triage.
oauth_config:
  redirect_urls:
    - http://localhost:5174/api/slack/oauth/callback
  scopes:
    user:
      - search:read.public
      - search:read.private
      - search:read.mpim
      - search:read.im
      - channels:history
      - groups:history
      - mpim:history
      - im:history
      - users:read
  pkce_enabled: true
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

manifestにsecretは含めません。localhost + PKCEで使う場合、`Client Secret` は使いません。gateway/sidecar方式の場合だけ、app作成後の `Basic Information` で確認してgateway/sidecarのsecret管理に入れます。

### 1-6. appをインストール、または承認申請する

`OAuth & Permissions` から `Install to Workspace` を押します。

管理者承認が不要なworkspaceでは、そのまま許可画面が出ます。表示されたscopeを確認し、問題なければ許可します。

管理者承認が必要なworkspaceでは、インストール申請になります。管理者には次を伝えると通しやすいです。

- app名: `Local Slack MCP Inquiry Agent`
- 目的: 自分に関係するSlack問い合わせ候補をローカルで要約・整理する
- Slackへの書き込み: しない
- 必要scope: 上のUser Token Scopes
- token保存先: このアプリの `data/secrets/slack-mcp-token.json`、またはOAuth対応MCP gateway/sidecar側

### 1-7. `client_id` をこのアプリへ設定する

Slack appの `Basic Information` から次を取り出します。

- `App ID`
- `Client ID`
- `Client Secret`

localhost + PKCEで使う場合、このアプリに必要なのは `Client ID` だけです。`Client Secret` は使いません。

起動時に環境変数で渡すのが簡単です。

```bash
SLACK_MCP_CLIENT_ID=1234567890.1234567890 pnpm dev
```

`config/app.json` の `mcp.servers.slack.auth.clientId` に入れることもできますが、`Client Secret` やSlack tokenは入れないでください。

OAuthで取得したtokenは `data/secrets/slack-mcp-token.json` に保存されます。`data/` は `.gitignore` に入っているため、通常はGit管理されません。

gateway/sidecar方式を使う場合は、gateway/sidecar側のSlack OAuth設定へ `client_id` / `client_secret` / `redirect_uri` を入れます。このローカルアプリの `config/app.json` には、認証完了済みgateway/sidecarのMCP endpoint、またはstdio commandだけを書きます。

### 1-8. OAuth認可を完了する

このアプリを起動してから、ブラウザで次を開きます。

```text
http://localhost:5174/api/slack/oauth/authorize
```

またはUIの設定画面で `Slackに接続` を押します。

OAuthの流れは次のようになります。

1. このアプリのSlack接続URLを開く
2. Slackの認可画面に移動する
3. workspaceとscopeを確認して許可する
4. Slackが `http://localhost:5174/api/slack/oauth/callback` に一時codeを返す
5. このアプリがPKCEの `code_verifier` でcodeをuser tokenへ交換する
6. tokenが `data/secrets/slack-mcp-token.json` に保存される
7. このアプリがSlack MCP endpointへBearer token付きで接続できる状態になる

OAuth開始からcallback完了までの間は、このアプリのserver processを再起動しないでください。PKCEの `state` と `code_verifier` は一時的にメモリへ保持されます。再起動した場合は、もう一度 `http://localhost:5174/api/slack/oauth/authorize` から始めます。

認可状態は次で確認できます。

```bash
curl http://localhost:5174/api/slack/oauth/status
```

### 1-9. Slack側の準備完了チェック

次の状態ならSlack側の準備は完了です。

- Slack appが作成されている
- `OAuth & Permissions` に必要なUser Token Scopesが入っている
- Redirect URLが `http://localhost:5174/api/slack/oauth/callback` になっている
- PKCEが有効化されている
- appがworkspaceへインストール済み、または管理者承認済み
- `SLACK_MCP_CLIENT_ID` または `config/app.json` の `auth.clientId` が設定されている
- `http://localhost:5174/api/slack/oauth/status` が `authorized: true` を返す

scopeの正確な要件はSlack MCP serverの実装と使うtoolで変わります。2026-06-02時点の公式情報は [Slack MCP Server docs](https://docs.slack.dev/ai/slack-mcp-server/) と [Installing with OAuth](https://docs.slack.dev/authentication/installing-with-oauth/) を確認してください。

## 2. このアプリの依存関係を入れる

初回だけ実行します。

```bash
pnpm install
```

AI Providerは初期状態で`mock`なので、Slack MCPの疎通だけならAI APIキーは不要です。

## 3. 接続方式A: HTTP endpointへ接続する

Slack公式の `https://mcp.slack.com/mcp` へ直接接続する場合はこの方式を使います。localhostでOAuth callbackを受ける場合は、Slack app側でPKCEを有効化してください。

Slack側でEnterprise限定と表示される場合、この方式は使えません。`https://mcp.slack.com/mcp` は公式hosted MCP endpointなので、アプリ側の実装だけではSlack側の利用条件を回避できません。その場合は、次のどちらかに切り替えます。

- ローカルで動くSlack MCP serverを用意し、`stdio` でこのアプリから起動する
- OAuth対応のMCP gateway/sidecarを自分の環境で用意し、このアプリはそのgateway/sidecarへ接続する

どちらもSlack公式hosted MCP endpointではなく、Slack Web API tokenを使ってSlackを読むMCP server/gatewayを別途用意する方式です。

`config/app.json` の `mcp.servers.slack` を次の形にします。

```json
{
  "mode": "streamable-http",
  "url": "https://mcp.slack.com/mcp",
  "command": "",
  "args": [],
  "env": {},
  "headers": {},
  "auth": {
    "type": "slack-oauth-pkce",
    "clientId": "",
    "redirectUri": "http://localhost:5174/api/slack/oauth/callback",
    "scopes": [
      "search:read.public",
      "search:read.private",
      "search:read.mpim",
      "search:read.im",
      "channels:history",
      "groups:history",
      "mpim:history",
      "im:history",
      "users:read"
    ],
    "tokenPath": "data/secrets/slack-mcp-token.json",
    "authorizeUrl": "https://slack.com/oauth/v2_user/authorize",
    "tokenUrl": "https://slack.com/api/oauth.v2.user.access"
  }
}
```

`clientId` は空のままにして、起動時に `SLACK_MCP_CLIENT_ID` で渡せます。設定ファイルへ書く場合でも、`Client Secret` とSlack tokenは書かないでください。

認可済みtokenを環境変数で直接渡す場合は `SLACK_MCP_ACCESS_TOKEN` も使えます。ただし通常はOAuth認可で `auth.tokenPath` に保存する方法を使ってください。

gateway/sidecarを使う場合は `url` を実際のMCP endpointに合わせます。

- ローカルgatewayを使う例: `http://localhost:3000/mcp`
- 公式Slack MCP endpointを扱うgatewayを使う例: gateway側のURL
- 公式Slack MCP endpointへ直接接続できる構成の場合: `https://mcp.slack.com/mcp`

`headers` にtokenなどのsecretを直書きしないでください。Slack OAuthで取得したtokenは `auth.tokenPath` のファイルへ保存され、MCP接続時に自動で `Authorization` ヘッダーへ入ります。secretが必要なgatewayを使う場合は、gateway側の設定または起動時の環境変数で扱います。

## 4. 接続方式B: stdioでローカルMCP serverを起動する

ローカルのSlack MCP serverコマンドをこのアプリから起動する場合はこの方式を使います。Slack公式MCPがEnterprise制約で使えないworkspaceでは、この方式が現実的な代替です。

この方式では、Slack公式hosted MCP endpointではなく、ローカルのMCP serverがSlack Web APIを呼び出します。Slack tokenなどのsecretは親プロセスの環境変数や1Password CLIから渡します。

`config/app.json` の `mcp.servers.slack` を次の形にします。

```json
{
  "mode": "stdio",
  "command": "your-slack-mcp-server-command",
  "args": [],
  "env": {
    "MCP_LOG_LEVEL": "info"
  },
  "url": "",
  "headers": {}
}
```

例として、MCP serverを `pnpm exec slack-mcp-server --stdio` で起動する実装なら次のように分けます。

```json
{
  "mode": "stdio",
  "command": "pnpm",
  "args": ["exec", "slack-mcp-server", "--stdio"],
  "env": {
    "MCP_LOG_LEVEL": "info"
  },
  "url": "",
  "headers": {}
}
```

`env` にはsecretではない値だけを書きます。Slack tokenやOAuth credentialが必要なMCP serverを使う場合は、次のように起動時に環境変数として渡します。

```bash
SLACK_MCP_TOKEN=... pnpm dev
```

1Password CLIを使う場合は、既存の起動スクリプトにMCP server用の環境変数を追加してから起動します。

```bash
pnpm dev:with-secrets
```

## 5. tool名の対応を確認する

このアプリはSlack MCP serverのtoolを次の名前で呼ぶ前提です。

```json
{
  "getCurrentUser": "slack_get_current_user",
  "searchMessages": "slack_search_messages",
  "fetchRecentMessages": "slack_fetch_recent_messages",
  "fetchThread": "slack_fetch_thread",
  "getUserInfo": "slack_get_user",
  "getConversationInfo": "slack_get_conversation"
}
```

使っているMCP serverのtool名が違う場合は、`config/mcp-tools.json` だけを編集します。左側のキーはこのアプリ内の役割なので変更せず、右側のtool名をMCP serverが公開している名前に合わせます。

`fetchRecentMessages` / `getUserInfo` / `getConversationInfo` は補助的なtoolです。まず接続確認で重要なのは `getCurrentUser` / `searchMessages` / `fetchThread` です。

## 6. アプリを起動する

```bash
pnpm dev
```

起動後、通常は次のURLを使います。

- Web UI: `http://localhost:5173`
- Local API: `http://localhost:5174`
- Slack OAuth authorize: `http://localhost:5174/api/slack/oauth/authorize`
- Slack OAuth status: `http://localhost:5174/api/slack/oauth/status`
- MCP status: `http://localhost:5174/api/mcp/status`
- MCP tools: `http://localhost:5174/api/mcp/tools`

## 7. 疎通確認する

まずSlack OAuthの認可状態を確認します。

```bash
curl http://localhost:5174/api/slack/oauth/status
```

成功例です。`tokenPath` は保存先だけを返し、token本文は返しません。

```json
{
  "serverName": "slack",
  "configured": true,
  "authorized": true,
  "redirectUri": "http://localhost:5174/api/slack/oauth/callback",
  "scopes": ["search:read.public", "channels:history", "users:read"],
  "tokenPath": "data/secrets/slack-mcp-token.json",
  "authType": "slack-oauth-pkce"
}
```

`authorized: false` の場合は、次をブラウザで開いて認可します。

```text
http://localhost:5174/api/slack/oauth/authorize
```

ブラウザまたはcurlで確認します。

```bash
curl http://localhost:5174/api/mcp/status
```

成功例です。

```json
{
  "connected": true,
  "serverName": "slack",
  "availableTools": 6,
  "hasRequiredTools": true,
  "tools": []
}
```

`tools` には実際のtool定義が入ります。数や詳細は使うMCP serverによって変わります。

`hasRequiredTools: false` の場合は、次も見ます。

```bash
curl http://localhost:5174/api/mcp/tools
```

返ってきたtool名を見て、`config/mcp-tools.json` の右側を合わせます。

## 8. ポーリングを試す

MCP statusが成功したら、1回だけポーリングします。

```bash
curl -X POST http://localhost:5174/api/polling/run-once
```

UIでは `http://localhost:5173` を開き、問い合わせ候補が表示されるか確認します。初期設定ではAI Providerが`mock`なので、分析内容は動作確認用の仮レスポンスです。

## 9. よくあるエラー

### `connected: false` で `MCP server "slack" is not configured`

`config/app.json` の `mcp.servers.slack.mode` が `disabled` のままです。`streamable-http` または `stdio` に変更してください。

### `connected: false` でHTTPやOAuth系のエラーが出る

HTTP endpoint側の認証が完了していません。Slack公式MCPへ直接接続する場合は、`http://localhost:5174/api/slack/oauth/status` を確認し、`authorized: false` なら `http://localhost:5174/api/slack/oauth/authorize` から認可してください。

gateway/sidecarを使う場合は、MCP serverまたはgateway側でOAuth認可を完了してください。

### Slack OAuthで `bad_redirect_uri` が出る

Slack appの `OAuth & Permissions` で、Redirect URLに次が登録されているか確認してください。

```text
http://localhost:5174/api/slack/oauth/callback
```

localhost redirectを使う場合はPKCEも有効化してください。PKCEを使わない通常のサーバーOAuthではHTTPS callbackが必要です。

### Slack側でEnterprise限定と表示される

そのworkspaceではSlack公式hosted MCP endpointを使う条件を満たしていません。このアプリ側で `localhost` callbackやPKCEを実装しても、Slack側のプラン・組織・app種別の制約は回避できません。

対応は次のどちらかです。

- Enterprise Gridなど、Slack公式MCPが利用できる環境で管理者に承認してもらう
- この手順の `4. 接続方式B: stdioでローカルMCP serverを起動する` に切り替え、Slack Web API tokenを使うローカルMCP serverを接続する

### Slack OAuthで `invalid_scope` やscope系エラーが出る

PKCE + localhost redirectではBot Token Scopesを要求できません。Slack appの `OAuth & Permissions` で、この手順のUser Token Scopesだけを追加し、`chat:write` などのbot scopeや書き込みscopeを外してください。

### `Slack MCP OAuth clientId is not configured`

`SLACK_MCP_CLIENT_ID` が未設定です。Slack appの `Basic Information` にある `Client ID` を使って起動してください。

```bash
SLACK_MCP_CLIENT_ID=1234567890.1234567890 pnpm dev
```

### `Slack OAuth state is unknown or expired`

OAuth開始後にserver processを再起動した、または時間が経ちすぎています。もう一度 `http://localhost:5174/api/slack/oauth/authorize` を開いて認可を始めてください。

### `availableTools` はあるが `hasRequiredTools: false`

tool名の対応がずれています。`curl http://localhost:5174/api/mcp/tools` で実際のtool名を確認し、`config/mcp-tools.json` の右側を書き換えてください。

### ポーリングしてもメッセージが出ない

次を順に確認します。

- Slack側のscopeに検索と履歴読み取りが含まれているか
- 認可したSlackユーザーが対象チャンネルを読めるか
- `config/app.json` の `polling.initialLookbackHours` が短すぎないか
- `config/app.json` の `polling.maxMessagesPerPoll` が小さすぎないか

### Slackへ書き込まれるのが心配

このアプリのSlack MCP adapterは read/search/fetch/list/get 系toolだけを許可します。`send` / `post` / `update` / `delete` / `invite` / `create` を含むtool名はブロックします。

## 10. 環境変数で一時的に上書きする

設定ファイルを書き換えずに接続先だけ試す場合は、起動時に環境変数を指定できます。

```bash
SLACK_MCP_CLIENT_ID=1234567890.1234567890 MCP_MODE=streamable-http MCP_URL=https://mcp.slack.com/mcp pnpm dev
```

stdioのcommandだけ差し替える場合です。

```bash
MCP_MODE=stdio MCP_COMMAND=your-slack-mcp-server-command pnpm dev
```

`MCP_SERVER` で `config/app.json` の `mcp.servers` にある別サーバー名を選ぶこともできます。

OAuth関連は次の環境変数で上書きできます。

```bash
SLACK_MCP_CLIENT_ID=...
SLACK_MCP_ACCESS_TOKEN=...
SLACK_MCP_REDIRECT_URI=http://localhost:5174/api/slack/oauth/callback
SLACK_MCP_SCOPES=search:read.public,channels:history,users:read
SLACK_MCP_TOKEN_PATH=data/secrets/slack-mcp-token.json
```

`SLACK_MCP_ACCESS_TOKEN` は一時的な検証用です。通常はOAuth flowでtokenを取得し、`SLACK_MCP_TOKEN_PATH` のファイルから読み込ませます。
