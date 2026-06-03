import { spawn } from "node:child_process";
import { repoRoot } from "../readers/paths.js";

export interface CodexResult { command: string; exitCode: number | null; stdout: string; stderr: string }

export function runCodex(prompt: string, mode: "setup" | "normal" = "normal"): Promise<CodexResult> {
  const args = mode === "setup"
    ? ["exec", "--profile", "slack-assistant", "--sandbox", "workspace-write", prompt]
    : ["exec", "--profile", "slack-assistant", "--sandbox", "workspace-write", "--ask-for-approval", "never", prompt];
  const command = `codex ${args.map((a) => JSON.stringify(a)).join(" ")}`;
  return new Promise((resolve) => {
    const child = spawn("codex", args, { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: any) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: any) => { stderr += chunk.toString(); });
    child.on("error", (error: any) => resolve({ command, exitCode: error.code === "ENOENT" ? 127 : null, stdout, stderr: error.message }));
    child.on("close", (exitCode: number | null) => resolve({ command, exitCode, stdout, stderr }));
  });
}
