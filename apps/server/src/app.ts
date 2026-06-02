import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { chatRequestSchema, knowledgeCreateSchema, statusUpdateSchema } from "shared/schemas";
import type { AppConfig } from "./config/appConfig.js";
import { createDb } from "./storage/db.js";
import { MessageRepository } from "./storage/repositories/messageRepository.js";
import { AgentRunRepository } from "./storage/repositories/agentRunRepository.js";
import { ChatRepository } from "./storage/repositories/chatRepository.js";
import { KnowledgeRepository } from "./storage/repositories/knowledgeRepository.js";
import { PollingRepository } from "./storage/repositories/pollingRepository.js";
import { MarkdownStore } from "./markdown/markdownStore.js";
import { KnowledgeSearch } from "./knowledge/knowledgeSearch.js";
import { EnvSecretProvider } from "./secrets/envSecretProvider.js";
import { createModelProvider } from "./ai/providers/createModelProvider.js";
import { DefaultLlmClient } from "./ai/llmClient.js";
import { InquiryAgent } from "./agent/inquiryAgent.js";
import { ChatAgent } from "./agent/chatAgent.js";
import { SlackMcpClient } from "./mcp/mcpClient.js";
import { SlackMcpProvider } from "./mcp/slackMcpProvider.js";
import { PollingService } from "./polling/pollingService.js";
import { PollingScheduler } from "./polling/pollingScheduler.js";
export function createApp(config: AppConfig) {
  const db = createDb(config.storage.sqlitePath);
  const messages = new MessageRepository(db);
  const agentRuns = new AgentRunRepository(db);
  const chats = new ChatRepository(db);
  const knowledgeRepo = new KnowledgeRepository(db);
  const pollingRepo = new PollingRepository(db);
  const markdown = new MarkdownStore(config.storage.dataDir);
  const knowledge = new KnowledgeSearch(config.knowledge.rootDir);
  const secrets = new EnvSecretProvider();
  const provider = createModelProvider(config, secrets);
  const llm = new DefaultLlmClient(provider, config);
  const inquiryAgent = new InquiryAgent(llm);
  const chatAgent = new ChatAgent(llm);
  const mcp = new SlackMcpProvider(new SlackMcpClient(config));
  const pollingService = new PollingService({
    config,
    mcp,
    messages,
    agentRuns,
    polling: pollingRepo,
    markdown,
    knowledge,
    inquiryAgent,
  });
  const scheduler = new PollingScheduler(config, pollingService, pollingRepo);
  if (config.polling.enabled) scheduler.start();
  const app = new Hono();
  app.use("*", cors({ origin: config.web.origin }));
  app.get("/api/health", (c) => c.json({ ok: true }));
  app.get("/api/ai/status", async (c) =>
    c.json({
      provider: provider.name,
      model: config.ai.model,
      configured: await provider.configured(),
    }),
  );
  app.get("/api/mcp/status", async (c) => c.json(await mcp.status()));
  app.get("/api/mcp/tools", async (c) => c.json({ tools: await mcp.listAvailableTools() }));
  app.get("/api/polling/status", (c) => c.json(scheduler.status()));
  app.post("/api/polling/start", (c) => {
    scheduler.start();
    return c.json(scheduler.status());
  });
  app.post("/api/polling/stop", (c) => {
    scheduler.stop();
    return c.json(scheduler.status());
  });
  app.post("/api/polling/run-once", async (c) => {
    await scheduler.runOnce();
    return c.json(scheduler.status());
  });
  app.get("/api/messages", (c) =>
    c.json({
      messages: messages.list({
        status: c.req.query("status"),
        urgency: c.req.query("urgency"),
      }),
    }),
  );
  app.get("/api/messages/:id", async (c) => {
    const id = c.req.param("id");
    const message = messages.get(id);
    if (!message) return c.json({ error: "not found" }, 404);
    const agentRun = agentRuns.latest(id);
    return c.json({
      message: { ...message, text: message.textPreview },
      agentRun,
      chatMessages: chats.list(id),
      relatedKnowledge: agentRun?.analysis?.references ?? [],
      threadMessages: [],
      relevanceReason: messages.getRelevanceReason(id),
    });
  });
  app.patch("/api/messages/:id/status", zValidator("json", statusUpdateSchema), (c) => {
    messages.updateStatus(c.req.param("id"), c.req.valid("json").status);
    return c.json({ ok: true });
  });
  app.post("/api/messages/:id/chat", zValidator("json", chatRequestSchema), async (c) => {
    const id = c.req.param("id");
    const message = messages.get(id);
    if (!message) return c.json({ error: "not found" }, 404);
    const user = chats.add(id, "user", c.req.valid("json").message);
    await markdown.appendChatMessage(user);
    const related = await knowledge.search(message.textPreview);
    const assistant = await chatAgent.chat({
      messageId: id,
      userMessage: user.content,
      context: {
        slackMessage: message,
        agentOutput: agentRuns.latest(id)?.analysis,
        chatHistory: chats.list(id),
        relatedKnowledge: related,
      },
    });
    const saved = chats.add(id, "assistant", assistant.content);
    await markdown.appendChatMessage(saved);
    return c.json(saved);
  });
  app.get("/api/knowledge", async (c) => c.json({ knowledge: await knowledge.list() }));
  app.post("/api/knowledge", zValidator("json", knowledgeCreateSchema), async (c) => {
    const body = c.req.valid("json");
    const saved = await markdown.saveKnowledge(body.title, body.content, body.tags);
    knowledgeRepo.upsert(saved);
    return c.json(saved, 201);
  });
  app.get("/api/settings", (c) => c.json(config));
  return app;
}
