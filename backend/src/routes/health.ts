import { Hono } from "hono";

export const healthRoute = new Hono();

healthRoute.get("/health", (c) => {
	console.log("GET /health");
	return c.json({ status: "ok" });
});
