import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { AppConfig } from "../config/appConfig.js";
export class SlackMcpClient {
  private client?: Client;
  constructor(private config: AppConfig) {}
  async connect() {
    if (this.config.mcp.mode !== "stdio" || !this.config.mcp.command) return undefined;
    if (this.client) return this.client;
    const transport = new StdioClientTransport({
      command: this.config.mcp.command,
      args: this.config.mcp.args ?? [],
      env: { ...process.env, ...this.config.mcp.env } as Record<string, string>,
    });
    this.client = new Client({
      name: "local-slack-mcp-agent",
      version: "0.1.0",
    });
    await this.client.connect(transport);
    return this.client;
  }
  async listTools() {
    const c = await this.connect();
    if (!c) return [];
    const res = await c.listTools();
    return res.tools ?? [];
  }
  async callTool(name: string, args: Record<string, unknown>) {
    const c = await this.connect();
    if (!c) throw new Error("Slack MCP is not configured. Set config.mcp.mode=stdio and command.");
    return c.callTool({ name, arguments: args });
  }
}
