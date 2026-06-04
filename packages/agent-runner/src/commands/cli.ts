#!/usr/bin/env node
import { chatTargetTypeSchema } from "shared/schemas";
import { approveCodexRun, executeChat, executeCodexRun } from "./actions.js";
import { validateData } from "./validate.js";
import { watch } from "../scheduler/watch.js";

const command = process.argv[2] ?? "run";

if (command === "setup") {
  console.log(JSON.stringify(await executeCodexRun("setup"), null, 2));
} else if (command === "run" || command === "once") {
  console.log(JSON.stringify(await executeCodexRun("manual"), null, 2));
} else if (command === "watch") {
  console.log("agent-runner watch started (interval: 600000ms)");
  watch();
} else if (command === "chat") {
  const targetType = chatTargetTypeSchema.parse(
    process.argv[3] ?? process.env.TARGET_TYPE ?? "slack_message",
  ) as import("shared/types").ChatTargetType;
  const targetId = process.argv[4] ?? process.env.TARGET_ID;
  const message = process.argv.slice(5).join(" ") || process.env.CHAT_MESSAGE;
  if (!targetId || !message)
    throw new Error("Usage: pnpm agent:chat <slack_message|todo|reply> <targetId> <message>");
  console.log(JSON.stringify(await executeChat(targetType, targetId, message), null, 2));
} else if (command === "approve") {
  const runId = process.argv[3];
  if (!runId) throw new Error("Usage: pnpm --filter agent-runner run dev approve <runId>");
  console.log(JSON.stringify(await approveCodexRun(runId), null, 2));
} else if (command === "validate") {
  console.log(JSON.stringify(await validateData(), null, 2));
} else {
  throw new Error(`Unknown command: ${command}`);
}
