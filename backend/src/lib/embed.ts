import Together from "together-ai";
import { getEnv } from "../context";

const EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5";

// Singleton Together client cache (keyed by API key)
const togetherClientCache = new Map<string, Together>();

function getTogetherClient(): Together {
	const env = getEnv();
	const cacheKey = env.TOGETHER_API_KEY;

	let client = togetherClientCache.get(cacheKey);
	if (!client) {
		client = new Together({ apiKey: env.TOGETHER_API_KEY });
		togetherClientCache.set(cacheKey, client);
	}
	return client;
}

export async function embedQuery(text: string): Promise<number[]> {
	const together = getTogetherClient();
	const response = await together.embeddings.create({
		model: EMBEDDING_MODEL,
		input: text,
	});
	return response.data[0].embedding;
}
