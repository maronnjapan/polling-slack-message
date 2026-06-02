import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig } from "./config/loadConfig.js";
import { logger } from "./utils/logger.js";
const config = loadConfig();
serve(
  {
    fetch: createApp(config).fetch,
    port: config.app.port,
    hostname: "127.0.0.1",
  },
  (info) =>
    logger.info(`Local Slack MCP Agent API listening on http://${info.address}:${info.port}`),
);
