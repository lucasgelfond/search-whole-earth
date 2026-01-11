import { Hono } from "hono";
import { getTurbopufferNamespace } from "../lib/hybrid-search";
import { getPresignedUrl } from "../lib/presign";

export const pagesRoute = new Hono();

pagesRoute.get("/pages/:issueId", async (c) => {
	const issueId = c.req.param("issueId");
	console.log(`GET /pages/${issueId}`);

	try {
		const ns = getTurbopufferNamespace();

		const response = await ns.query({
			top_k: 1000,
			include_attributes: ["page_number", "ocr_result", "r2_object_id"],
			filters: ["parent_issue_id", "Eq", issueId],
		});

		const rows = response.rows ?? [];

		const pagesWithUrls = await Promise.all(
			rows.map(async (row) => {
				const rowData = row as Record<string, unknown>;
				const r2ObjectId = rowData.r2_object_id as string | undefined;
				let imageUrl: string | null = null;

				if (r2ObjectId) {
					try {
						imageUrl = await getPresignedUrl(r2ObjectId);
					} catch (error) {
						console.error(`  Failed to presign ${r2ObjectId}:`, error);
					}
				}

				return {
					page_number: rowData.page_number as number,
					image_url: imageUrl,
					ocr_result: rowData.ocr_result as string,
				};
			})
		);

		console.log(`  Found ${pagesWithUrls.length} pages`);
		return c.json(pagesWithUrls);
	} catch (error) {
		console.error("  Pages error:", error);
		return c.json({ error: "Failed to fetch pages" }, 500);
	}
});
