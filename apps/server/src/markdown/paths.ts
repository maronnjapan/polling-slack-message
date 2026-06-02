import { join } from "node:path";
import { yyyyMm } from "../utils/date.js";
export const slackMarkdownPath = (dataDir: string, id: string, iso?: string) => {
  const { year, month } = yyyyMm(iso);
  return join(dataDir, "inbox", "slack", year, month, `${id}.md`);
};
export const rawSlackPath = (dataDir: string, id: string, iso?: string) => {
  const { year, month } = yyyyMm(iso);
  return join(dataDir, "raw", "slack", year, month, `${id}.json`);
};
export const agentRunPath = (dataDir: string, id: string, iso?: string) => {
  const { year, month } = yyyyMm(iso);
  return join(dataDir, "agent-runs", year, month, `${id}.md`);
};
export const chatPath = (dataDir: string, id: string) => join(dataDir, "chats", `${id}.md`);
export const knowledgePath = (dataDir: string, id: string) =>
  join(dataDir, "knowledge", "notes", `${id}.md`);
