import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import routes from "./routes/index.js";

const app = new Hono();
app.use("*", cors());
app.route("/api", routes);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
