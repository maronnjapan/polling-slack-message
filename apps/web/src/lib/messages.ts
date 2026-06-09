import type { SlackMessage } from "shared/types";

const mentionPattern = /^<[@#!][^>]+>$/;

export function getMessageTitle(message: SlackMessage) {
  const explicitTitle = message.title?.trim();
  if (explicitTitle) return explicitTitle;

  const candidate = message.rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !mentionPattern.test(line) && line.length > 1);

  if (!candidate) return message.summary;
  return candidate.length > 80 ? `${candidate.slice(0, 79)}...` : candidate;
}
