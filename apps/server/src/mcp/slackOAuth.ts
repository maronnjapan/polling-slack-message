import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { AppConfig, McpServerConfig, SlackOAuthPkceConfig } from "../config/appConfig.js";
import { resolveProjectPath } from "../config/paths.js";

type SlackOAuthToken = {
  access_token: string;
  token_type?: string;
  scope?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  team?: unknown;
  enterprise?: unknown;
  authed_user?: unknown;
};

type PendingPkce = {
  serverName: string;
  codeVerifier: string;
  redirectUri: string;
  createdAt: number;
};

const STATE_TTL_MS = 10 * 60 * 1000;

export class SlackOAuthService {
  private pending = new Map<string, PendingPkce>();

  constructor(private config: AppConfig) {}

  status(serverName = this.config.mcp.defaultServer) {
    const auth = this.getAuthConfig(serverName);
    const token = auth ? this.readToken(auth) : undefined;
    return {
      serverName,
      configured: Boolean(auth?.clientId),
      authorized: Boolean(token?.access_token || process.env.SLACK_MCP_ACCESS_TOKEN),
      redirectUri: auth?.redirectUri,
      scopes: auth?.scopes ?? [],
      tokenPath: auth?.tokenPath,
      authType: auth?.type,
    };
  }

  createAuthorizationUrl(serverName = this.config.mcp.defaultServer) {
    const auth = this.requireAuthConfig(serverName);
    if (!auth.clientId) {
      throw new Error("Slack MCP OAuth clientId is not configured. Set SLACK_MCP_CLIENT_ID.");
    }

    const codeVerifier = randomBase64Url(64);
    const state = randomBase64Url(32);
    this.pending.set(state, {
      serverName,
      codeVerifier,
      redirectUri: auth.redirectUri,
      createdAt: Date.now(),
    });

    const url = new URL(auth.authorizeUrl);
    url.searchParams.set("client_id", auth.clientId);
    url.searchParams.set("scope", auth.scopes.join(","));
    url.searchParams.set("redirect_uri", auth.redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", sha256Base64Url(codeVerifier));
    url.searchParams.set("code_challenge_method", "S256");
    return { url: url.toString(), redirectUri: auth.redirectUri, scopes: auth.scopes };
  }

  async handleCallback(params: { code?: string; state?: string; error?: string }) {
    if (params.error) throw new Error(`Slack OAuth error: ${params.error}`);
    if (!params.code || !params.state)
      throw new Error("Slack OAuth callback is missing code or state.");

    const pending = this.pending.get(params.state);
    this.pending.delete(params.state);
    if (!pending) throw new Error("Slack OAuth state is unknown or expired.");
    if (Date.now() - pending.createdAt > STATE_TTL_MS) {
      throw new Error("Slack OAuth state expired. Start the OAuth flow again.");
    }

    const auth = this.requireAuthConfig(pending.serverName);
    const token = await this.exchangeCode(
      auth,
      params.code,
      pending.codeVerifier,
      pending.redirectUri,
    );
    this.writeToken(auth, token);
    return {
      ok: true,
      serverName: pending.serverName,
      scope: token.scope,
      expiresAt: token.expires_at,
    };
  }

  async authorizationHeader(server: McpServerConfig) {
    const auth = server.auth;
    if (!auth || auth.type !== "slack-oauth-pkce") return undefined;
    if (process.env.SLACK_MCP_ACCESS_TOKEN) {
      return `Bearer ${process.env.SLACK_MCP_ACCESS_TOKEN}`;
    }
    const token = await this.getToken(auth);
    return token?.access_token ? `Bearer ${token.access_token}` : undefined;
  }

  private async getToken(auth: SlackOAuthPkceConfig) {
    const token = this.readToken(auth);
    if (!token?.access_token) return undefined;
    if (!token.refresh_token || !token.expires_at || token.expires_at - Date.now() > 60_000) {
      return token;
    }
    const refreshed = await this.refreshToken(auth, token.refresh_token);
    this.writeToken(auth, refreshed);
    return refreshed;
  }

  private async exchangeCode(
    auth: SlackOAuthPkceConfig,
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ) {
    return this.postTokenRequest(auth, {
      grant_type: "authorization_code",
      client_id: auth.clientId,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    });
  }

  private async refreshToken(auth: SlackOAuthPkceConfig, refreshToken: string) {
    return this.postTokenRequest(auth, {
      grant_type: "refresh_token",
      client_id: auth.clientId,
      refresh_token: refreshToken,
    });
  }

  private async postTokenRequest(auth: SlackOAuthPkceConfig, body: Record<string, string>) {
    const res = await fetch(auth.tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    });
    const json = (await res.json()) as SlackOAuthToken & { ok?: boolean; error?: string };
    if (!res.ok || json.ok === false || !json.access_token) {
      throw new Error(`Slack OAuth token exchange failed: ${json.error ?? res.statusText}`);
    }
    return {
      ...json,
      expires_at: json.expires_in ? Date.now() + json.expires_in * 1000 : json.expires_at,
    };
  }

  private getAuthConfig(serverName: string) {
    return this.config.mcp.servers[serverName]?.auth;
  }

  private requireAuthConfig(serverName: string) {
    const auth = this.getAuthConfig(serverName);
    if (!auth || auth.type !== "slack-oauth-pkce") {
      throw new Error(`Slack OAuth is not configured for MCP server "${serverName}".`);
    }
    return auth;
  }

  private readToken(auth: SlackOAuthPkceConfig): SlackOAuthToken | undefined {
    try {
      return JSON.parse(readFileSync(resolveTokenPath(auth.tokenPath), "utf8"));
    } catch {
      return undefined;
    }
  }

  private writeToken(auth: SlackOAuthPkceConfig, token: SlackOAuthToken) {
    const path = resolveTokenPath(auth.tokenPath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(token, null, 2)}\n`, { mode: 0o600 });
  }
}

function resolveTokenPath(path: string) {
  return path.startsWith("/") ? path : resolveProjectPath(path);
}

function randomBase64Url(size: number) {
  return randomBytes(size).toString("base64url");
}

function sha256Base64Url(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}
