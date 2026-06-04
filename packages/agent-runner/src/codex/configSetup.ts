import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "../readers/paths.js";
import { slackMcpApprovalTools } from "./runCodex.js";

const codexConfigPath = path.join(repoRoot, ".codex", "config.toml");
const slackMcpServerName = "slack-assistant";

function readConfig(): string {
  try {
    return readFileSync(codexConfigPath, "utf8");
  } catch {
    return "";
  }
}

function isToolApproved(content: string, tool: string): boolean {
  const header = `[mcp_servers.${slackMcpServerName}.tools.${tool}]`;
  const idx = content.indexOf(header);
  if (idx < 0) return false;
  const after = content.slice(idx + header.length);
  const nextSection = after.search(/^\[/m);
  const section = nextSection >= 0 ? after.slice(0, nextSection) : after;
  return /approval_mode\s*=\s*"approve"/.test(section);
}

export function getSlackMcpSetupStatus() {
  const content = readConfig();
  const approvedTools = slackMcpApprovalTools.filter((t) => isToolApproved(content, t));
  return {
    configured: approvedTools.length === slackMcpApprovalTools.length,
    approvedTools,
    requiredTools: slackMcpApprovalTools,
  };
}

export function applySlackMcpSetup() {
  const content = readConfig();
  const missing = slackMcpApprovalTools.filter((t) => !isToolApproved(content, t));
  if (missing.length > 0) {
    const additions = missing
      .map((t) => `\n[mcp_servers.${slackMcpServerName}.tools.${t}]\napproval_mode = "approve"`)
      .join("\n");
    writeFileSync(codexConfigPath, `${content.trimEnd()}\n${additions}\n`, "utf8");
  }
  return getSlackMcpSetupStatus();
}
