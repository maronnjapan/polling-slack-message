# AGENTS.md

This repository implements a local Slack inquiry organizer UI wrapper. Follow `docs/spec.md` as the source of truth.

## Required architecture

- Frontend: Vite + React + TypeScript under `apps/web`.
- Backend: Hono + TypeScript under `apps/api`.
- Agent runner: Node.js + TypeScript under `packages/agent-runner`; all Codex CLI execution must stay here.
- Shared types/schemas: `packages/shared`.
- Storage: file system under `data` using JSON as UI source of truth and Markdown as human-readable companion files.
- Knowledge: Markdown files under `knowledge`.

## Prohibitions

- Do not add Next.js.
- Do not call Slack Web API directly from the app.
- Do not store Slack tokens, MCP credentials, or Codex credentials.
- Do not implement a Slack Bot, Slack Events API, Socket Mode, automatic replies, or automatic Slack posting.
- Do not add MCP client logic to `apps/api` or `apps/web`; MCP is only used indirectly by Codex CLI.
