import { spawn } from "node:child_process";
export function openBrowser(url: string) {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", url] : [url];
  spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
}
