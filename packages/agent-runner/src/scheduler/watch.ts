import { executeCodexRun } from "../commands/actions.js";
import { writeRun } from "../writers/writeData.js";
import type { AgentRun } from "shared/types";
import { nowIso } from "shared/utils";

export function watch(intervalMs = 60_000) {
  let running = false;
  const tick = async () => {
    if (running) {
      const at = nowIso();
      const run: AgentRun = { id: `run-${at.replace(/[-:T.Z]/g, "").slice(0, 14)}-skipped`, type: "scheduled", status: "partial", startedAt: at, finishedAt: at, createdMessages: [], createdTodos: [], createdReplies: [], errors: [{ message: "Previous scheduled run is still running; skipped this interval" }] };
      await writeRun(run);
      return;
    }
    running = true;
    try { await executeCodexRun("scheduled"); } finally { running = false; }
  };
  void tick();
  return setInterval(() => void tick(), intervalMs);
}
