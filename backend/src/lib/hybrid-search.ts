import Turbopuffer from "@turbopuffer/turbopuffer";
import { getEnv } from "../context";
import { reciprocalRankFusion } from "./reciprocal-rank-fusion";
import { getPresignedUrl } from "./presign";

const NAMESPACE = "searchable-whole-earth-page";

type TurbopufferNamespace = ReturnType<Turbopuffer["namespace"]>;

// Singleton Turbopuffer namespace cache (keyed by API key)
const tpufNamespaceCache = new Map<string, TurbopufferNamespace>();

export function getTurbopufferNamespace(): TurbopufferNamespace {
	const env = getEnv();
	const cacheKey = env.TURBOPUFFER_API_KEY;

	let ns = tpufNamespaceCache.get(cacheKey);
	if (!ns) {
		const tpuf = new Turbopuffer({
			apiKey: env.TURBOPUFFER_API_KEY,
			region: env.TURBOPUFFER_REGION,
		});
		ns = tpuf.namespace(NAMESPACE);
		tpufNamespaceCache.set(cacheKey, ns);
	}
	return ns;
}

export interface SearchResult {
	id: string;
	parent_issue_id: string | null;
	page_number: number | null;
	ocr_result: string | null;
	r2_object_id: string | null;
	image_url: string | null;
	score: number;
}

export async function hybridSearch(
	queryText: string,
	embedding: number[],
	matchCount = 30
): Promise<SearchResult[]> {
	const ns = getTurbopufferNamespace();

	const [vectorResponse, bm25Response] = await Promise.all([
		ns.query({
			rank_by: ["vector", "ANN", embedding],
			top_k: matchCount,
			include_attributes: ["parent_issue_id", "page_number", "ocr_result", "r2_object_id"],
		}),
		ns.query({
			rank_by: ["ocr_result", "BM25", queryText],
			top_k: matchCount,
			include_attributes: ["parent_issue_id", "page_number", "ocr_result", "r2_object_id"],
		}),
	]);

	const vectorResults = (vectorResponse.rows ?? []).map((row) => {
		const rowData = row as Record<string, unknown>;
		return {
			id: String(rowData.id),
			score: typeof rowData.$dist === "number" ? rowData.$dist : 0,
			attrs: {
				parent_issue_id: rowData.parent_issue_id,
				page_number: rowData.page_number,
				ocr_result: rowData.ocr_result,
				r2_object_id: rowData.r2_object_id,
			},
		};
	});

	const bm25Results = (bm25Response.rows ?? []).map((row) => {
		const rowData = row as Record<string, unknown>;
		return {
			id: String(rowData.id),
			score: typeof rowData.$dist === "number" ? rowData.$dist : 0,
			attrs: {
				parent_issue_id: rowData.parent_issue_id,
				page_number: rowData.page_number,
				ocr_result: rowData.ocr_result,
				r2_object_id: rowData.r2_object_id,
			},
		};
	});

	const fused = reciprocalRankFusion(vectorResults, bm25Results);
	const topResults = fused.slice(0, matchCount);

	const resultsWithUrls = await Promise.all(
		topResults.map(async (item) => {
			const attrs = item.attrs ?? {};
			const r2ObjectId = attrs.r2_object_id as string | undefined;
			let imageUrl: string | null = null;

			if (r2ObjectId) {
				try {
					imageUrl = await getPresignedUrl(r2ObjectId);
				} catch (error) {
					console.error(`Failed to generate presigned URL for ${r2ObjectId}:`, error);
				}
			}

			return {
				id: item.id,
				parent_issue_id: (attrs.parent_issue_id as string) ?? null,
				page_number: (attrs.page_number as number) ?? null,
				ocr_result: (attrs.ocr_result as string) ?? null,
				r2_object_id: r2ObjectId ?? null,
				image_url: imageUrl,
				score: item.score,
			};
		})
	);

	return resultsWithUrls;
}
