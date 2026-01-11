import { Hono } from "hono";
import { getTurbopufferNamespace } from "../lib/hybrid-search";

export const warmNamespaceRoute = new Hono();

warmNamespaceRoute.post("/warm-namespace", async (c) => {
	console.log("POST /warm-namespace");
	try {
		const ns = getTurbopufferNamespace();
		const result = await ns.hintCacheWarm();

		console.log("  Cache warm result:", result);
		return c.json({ status: result.status, message: result.message });
	} catch (error) {
		console.error("  Warm namespace error:", error);
		return c.json({ error: "Failed to warm namespace cache" }, 500);
	}
});
