import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";
import { searchRoute } from "./routes/search";
import { healthRoute } from "./routes/health";
import { pagesRoute } from "./routes/pages";

const app = new Hono();

app.use("*", cors());

app.route("/", healthRoute);
app.route("/", searchRoute);
app.route("/", pagesRoute);

serve({ fetch: app.fetch, port: env.PORT }, () => {
	console.log(`Server running at http://localhost:${env.PORT}`);
});
