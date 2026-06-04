import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { repoRoot } from "../readers/paths.js";

export interface CodexResult {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export interface CodexRunOptions {
  approveSlackMcpTools?: boolean;
}

export const slackMcpApprovalTools = [
  "slack_list_channels",
  "slack_get_channel_history",
  "slack_get_thread_replies",
  "slack_get_users",
  "slack_get_user_profile",
];

const slackMcpServerName = "slack-assistant";

function truncate(text: string, maxLength: number) {
  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength)}\n...[truncated ${text.length - maxLength} chars]`;
}

function summarizeStderr(stderr: string) {
  const interestingLines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) =>
      /^(error|warning|failed|cancelled|denied|tokens used|OpenAI Codex|workdir:|model:|approval:|sandbox:|session id:|mcp:)/i.test(
        line,
      ) || /(approval|required|denied|mcp)/i.test(line),
    );
  return truncate(interestingLines.join("\n") || "(no stderr summary)", 4000);
}

function codexCommand(args: string[]) {
  return `codex ${args.map((a) => JSON.stringify(a)).join(" ")}`;
}

function codexCommandWithoutPrompt(args: string[]) {
  return codexCommand([...args.slice(0, -1), "<prompt>"]);
}

function responseLog(exitCode: number | null, stdout: string, stderr: string) {
  return [
    "[response]",
    `exitCode: ${exitCode}`,
    "",
    "[response.stdout]",
    truncate(stdout.trim() || "(empty)", 8000),
    "[/response.stdout]",
    "",
    "[response.stderrSummary]",
    summarizeStderr(stderr),
    "[/response.stderrSummary]",
    "",
    `[finished] ${new Date().toISOString()}`,
    "",
  ].join("\n");
}

function slackMcpApprovalConfigOverrides() {
  return slackMcpApprovalTools.flatMap((tool) => [
    "-c",
    `mcp_servers.${slackMcpServerName}.tools.${tool}.approval_mode="approve"`,
  ]);
}

function buildCodexArgs(prompt: string, mode: "setup" | "normal", options: CodexRunOptions) {
  const args =
    mode === "setup"
      ? ["exec", "--profile", "slack-assistant", "--sandbox", "workspace-write"]
      : [
          "exec",
          "--profile",
          "slack-assistant",
          "--sandbox",
          "workspace-write",
          "-c",
          'approval_policy="never"',
        ];

  if (options.approveSlackMcpTools) {
    args.push(...slackMcpApprovalConfigOverrides());
  }

  args.push(prompt);
  return args;
}

export function needsSlackMcpApproval(result: CodexResult) {
  const text = `${result.stdout}\n${result.stderr}`.toLowerCase();
  const mentionsSlackMcpTool = slackMcpApprovalTools.some((tool) => text.includes(tool));
  return (
    result.exitCode !== 0 &&
    (mentionsSlackMcpTool || (text.includes("mcp") && text.includes("slack"))) &&
    /(approval|approve|permission|denied|not approved|requires approval|承認|認可|許可)/i.test(text)
  );
}

export function runCodex(
  prompt: string,
  mode: "setup" | "normal" = "normal",
  logPath?: string,
  options: CodexRunOptions = {},
): Promise<CodexResult> {
  const args = buildCodexArgs(prompt, mode, options);
  const command = codexCommandWithoutPrompt(args);
  return new Promise((resolve) => {
    const child = spawn("codex", args, { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] });
    const logStream = logPath ? createWriteStream(logPath, { flags: "a" }) : null;
    const writeLog = (text: string) => {
      if (logStream) logStream.write(text);
    };
    let resolved = false;

    writeLog(
      [
        `[started] ${new Date().toISOString()}`,
        "[request]",
        `mode: ${mode}`,
        `command: ${command}`,
        "",
        "[request.prompt]",
        prompt,
        "[/request.prompt]",
        "",
      ].join("\n"),
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: any) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: any) => {
      stderr += chunk.toString();
    });
    child.on("error", (error: any) => {
      if (resolved) return;
      resolved = true;
      const exitCode = error.code === "ENOENT" ? 127 : null;
      writeLog(`\n${responseLog(exitCode, stdout, error.message)}`);
      logStream?.end();
      resolve({ command, exitCode, stdout, stderr: error.message });
    });
    child.on("close", (exitCode: number | null) => {
      if (resolved) return;
      resolved = true;
      writeLog(`\n${responseLog(exitCode, stdout, stderr)}`);
      logStream?.end();
      resolve({ command, exitCode, stdout, stderr });
    });
  });
}
