import { readFileSync } from "node:fs";
import { resolve } from "node:path";
export type ToolMap = { serverName: string; tools: Record<string, string> };
export function loadToolMap(path = resolve(process.cwd(), "config/mcp-tools.json")): ToolMap {
  return JSON.parse(readFileSync(path, "utf8"));
}
export const isReadOnlyTool = (name: string) =>
  /(?:get|list|search|fetch|read|history)/i.test(name) &&
  !/(?:send|post|update|delete|invite|create)/i.test(name);
