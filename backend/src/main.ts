import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { runWithEnv } from "./context";
import { searchRoute } from "./routes/search";
import { healthRoute } from "./routes/health";
import { pagesRoute } from "./routes/pages";
import { warmNamespaceRoute } from "./routes/warm-namespace";

const app = new Hono<{ Bindings: Env }>();

// Tech debt - you'll need to add any URL we use for the frontend (i.e. if we swap domains) here
app.use(
	"*",
	cors({
		origin: (origin) => {
			if (!origin) return null;
			if (
				origin === "https://searchable-whole-earth.pages.dev" ||
				origin === "https://searchwhole.earth" ||
				origin.startsWith("http://localhost")
			) {
				return origin;
			}
			return null;
		},
		allowHeaders: ["Content-Type"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		maxAge: 86400,
	})
);

app.use("*", async (c, next) => {
	return runWithEnv(c.env, () => next());
});

app.route("/", healthRoute);
app.route("/", searchRoute);
app.route("/", pagesRoute);
app.route("/", warmNamespaceRoute);

export default app;
