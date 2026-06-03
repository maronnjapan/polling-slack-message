import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const links = [["/", "Dashboard"], ["/messages", "Messages"], ["/todos", "ToDos"], ["/replies", "Replies"], ["/runs", "Runs"], ["/knowledge", "Knowledge"]];
  return <div className="app-shell"><aside><h1>Slack Assistant</h1><p>Codex CLI + MCP の結果を確認するローカルUI</p><nav>{links.map(([href, label]) => <a key={href} href={`#${href}`}>{label}</a>)}</nav></aside><main>{children}</main></div>;
}
