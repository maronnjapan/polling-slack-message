import { Hono } from "hono";
import { chatRequestSchema, chatTargetTypeSchema, knowledgeSaveSchema, messagePatchSchema, replyPatchSchema, settingsPatchSchema, todoPatchSchema } from "shared/schemas";
import { approveCodexRun, executeChat, executeCodexRun } from "agent-runner";
import { getChatForTarget, getKnowledge, getMessage, getReply, getRun, getTodo, listKnowledge, listMessages, listReplies, listRuns, listTodos, patchMessage, patchReply, patchTodo, getSettings, patchSettings, saveKnowledge } from "../services/dataService.js";
import { getSlackMcpSetupStatus, applySlackMcpSetup } from "agent-runner";

const routes = new Hono();
const notFound = (c: any) => c.json({ error: "not found" }, 404);

routes.get("/health", (c) => c.json({ ok: true }));
routes.get("/stats", async (c) => {
  const [messages, todos, replies] = await Promise.all([listMessages(), listTodos(), listReplies()]);
  return c.json({
    pendingMessages: messages.filter((m) => (m.status ?? "active") === "active").length,
    openTodos: todos.filter((t) => t.status === "open" || t.status === "in_progress").length,
    pendingReplies: replies.filter((r) => r.status === "draft" || r.status === "edited").length,
  });
});
routes.get("/messages", async (c) => c.json(await listMessages()));
routes.get("/messages/:id", async (c) => { const item = await getMessage(c.req.param("id")); return item ? c.json(item) : notFound(c); });
routes.patch("/messages/:id", async (c) => { const body = messagePatchSchema.parse(await c.req.json()) as any; const item = await patchMessage(c.req.param("id"), body); return item ? c.json(item) : notFound(c); });
routes.get("/todos", async (c) => c.json(await listTodos()));
routes.get("/todos/:id", async (c) => { const item = await getTodo(c.req.param("id")); return item ? c.json(item) : notFound(c); });
routes.patch("/todos/:id", async (c) => { const body = todoPatchSchema.parse(await c.req.json()) as any; const item = await patchTodo(c.req.param("id"), body); return item ? c.json(item) : notFound(c); });
routes.get("/replies", async (c) => c.json(await listReplies()));
routes.get("/replies/:id", async (c) => { const item = await getReply(c.req.param("id")); return item ? c.json(item) : notFound(c); });
routes.patch("/replies/:id", async (c) => { const body = replyPatchSchema.parse(await c.req.json()) as any; const item = await patchReply(c.req.param("id"), body); return item ? c.json(item) : notFound(c); });
routes.get("/chats/:targetType/:targetId", async (c) => { const type = chatTargetTypeSchema.parse(c.req.param("targetType")) as import("shared/types").ChatTargetType; const item = await getChatForTarget(type, c.req.param("targetId")); return c.json(item ?? { id: null, target: { type, id: c.req.param("targetId") }, messages: [] }); });
routes.post("/chats/:targetType/:targetId/messages", async (c) => { const type = chatTargetTypeSchema.parse(c.req.param("targetType")) as import("shared/types").ChatTargetType; const body = chatRequestSchema.parse(await c.req.json()); return c.json(await executeChat(type, c.req.param("targetId"), body.message)); });
routes.get("/runs", async (c) => c.json(await listRuns()));
routes.get("/runs/:id", async (c) => { const item = await getRun(c.req.param("id")); return item ? c.json(item) : notFound(c); });
routes.post("/runs/:id/approve", async (c) => c.json(await approveCodexRun(c.req.param("id"))));
routes.post("/agent/run", async (c) => c.json(await executeCodexRun("manual")));
routes.post("/agent/setup", async (c) => c.json(await executeCodexRun("setup")));
routes.get("/knowledge", async (c) => c.json(await listKnowledge()));
routes.get("/knowledge/:path{.*}", async (c) => { const item = await getKnowledge(c.req.param("path")); return item ? c.json(item) : notFound(c); });
routes.put("/knowledge/:path{.*}", async (c) => { const body = knowledgeSaveSchema.parse(await c.req.json()); const item = await saveKnowledge(c.req.param("path"), body.content); return item ? c.json(item) : c.json({ error: "invalid path" }, 400); });
routes.get("/settings", async (c) => c.json(await getSettings()));
routes.patch("/settings", async (c) => { const body = settingsPatchSchema.parse(await c.req.json()); return c.json(await patchSettings(body)); });
routes.get("/slack/setup/status", (c) => c.json(getSlackMcpSetupStatus()));
routes.post("/slack/setup", (c) => c.json(applySlackMcpSetup()));

export default routes;
