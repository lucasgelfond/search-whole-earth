import { Hono } from "hono";
import { embedQuery } from "../lib/embed";
import { hybridSearch, startBm25Search } from "../lib/hybrid-search";

export const searchRoute = new Hono();

searchRoute.post("/search", async (c) => {
	const totalStart = performance.now();
	console.log("POST /search");
	try {
		const body = await c.req.json();

		if (!body.query || typeof body.query !== "string") {
			return c.json({ error: "query is required" }, 400);
		}

		const matchCount = body.match_count ?? 30;

		console.log(`  Query: "${body.query}"`);

		// Start BM25 search and embedding in parallel
		// BM25 only needs query text, so we don't have to wait for embedding
		const bm25Promise = startBm25Search(body.query, matchCount);
		const embedding = await embedQuery(body.query);

		// Now run vector search (needs embedding) and wait for BM25 to finish
		const results = await hybridSearch(body.query, embedding, matchCount, bm25Promise);

		const totalEnd = performance.now();
		console.log(`  Found ${results.length} results`);
		console.log(`  [timing] Total search: ${(totalEnd - totalStart).toFixed(0)}ms`);
		return c.json(results);
	} catch (error) {
		console.error("  Search error:", error);
		return c.json({ error: "Search failed" }, 500);
	}
});
