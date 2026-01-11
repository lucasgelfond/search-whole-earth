import { Hono } from "hono";
import { embedQuery } from "../lib/embed";
import { hybridSearch } from "../lib/hybrid-search";

export const searchRoute = new Hono();

searchRoute.post("/search", async (c) => {
	console.log("POST /search");
	try {
		const body = await c.req.json();

		if (!body.query || typeof body.query !== "string") {
			return c.json({ error: "query is required" }, 400);
		}

		const matchCount = body.match_count ?? 30;

		console.log(`  Embedding query: "${body.query}"`);
		const embedding = await embedQuery(body.query);

		console.log("  Performing hybrid search...");
		const results = await hybridSearch(body.query, embedding, matchCount);

		console.log(`  Found ${results.length} results`);
		return c.json(results);
	} catch (error) {
		console.error("  Search error:", error);
		return c.json({ error: "Search failed" }, 500);
	}
});
