import { getEnv } from "../context";

const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5" as const;

export async function embedQuery(text: string): Promise<number[]> {
	const start = performance.now();
	const env = getEnv();
	const response = await env.AI.run(EMBEDDING_MODEL, { text: [text] });
	console.log(
		`  [timing] CF Workers AI embedding: ${(performance.now() - start).toFixed(0)}ms`,
	);
	if (!("data" in response) || !response.data) {
		throw new Error("Unexpected embedding response format");
	}
	return response.data[0];
}
