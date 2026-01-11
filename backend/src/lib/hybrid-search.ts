import Turbopuffer from "@turbopuffer/turbopuffer";
import { getEnv } from "../context";
import { reciprocalRankFusion } from "./reciprocal-rank-fusion";
import { getPresignedUrl } from "./presign";

const NAMESPACE = "searchable-whole-earth-page";

export type TurbopufferNamespace = ReturnType<Turbopuffer["namespace"]>;
export type Bm25Promise = Promise<Awaited<ReturnType<TurbopufferNamespace["query"]>>>;

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

/**
 * Start BM25 search early (can run in parallel with embedding generation)
 */
export function startBm25Search(queryText: string, matchCount = 30): Bm25Promise {
	const ns = getTurbopufferNamespace();
	const start = performance.now();
	const promise = ns.query({
		rank_by: ["ocr_result", "BM25", queryText],
		top_k: matchCount,
		include_attributes: ["parent_issue_id", "page_number", "ocr_result", "r2_object_id"],
	});
	promise.then(() => {
		console.log(`  [timing] BM25 search: ${(performance.now() - start).toFixed(0)}ms`);
	});
	return promise;
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
	matchCount = 30,
	bm25Promise?: Promise<Awaited<ReturnType<TurbopufferNamespace["query"]>>>
): Promise<SearchResult[]> {
	const ns = getTurbopufferNamespace();

	const vectorStart = performance.now();
	const vectorResponsePromise = ns.query({
		rank_by: ["vector", "ANN", embedding],
		top_k: matchCount,
		include_attributes: ["parent_issue_id", "page_number", "ocr_result", "r2_object_id"],
	});

	// Use pre-started BM25 promise if provided, otherwise start it now
	const bm25ResponsePromise =
		bm25Promise ??
		ns.query({
			rank_by: ["ocr_result", "BM25", queryText],
			top_k: matchCount,
			include_attributes: ["parent_issue_id", "page_number", "ocr_result", "r2_object_id"],
		});

	const [vectorResponse, bm25Response] = await Promise.all([
		vectorResponsePromise,
		bm25ResponsePromise,
	]);
	const vectorEnd = performance.now();
	console.log(`  [timing] Vector search: ${(vectorEnd - vectorStart).toFixed(0)}ms`);

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

	const urlStart = performance.now();
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
	console.log(`  [timing] URL presigning (${topResults.length} urls): ${(performance.now() - urlStart).toFixed(0)}ms`);

	return resultsWithUrls;
}
