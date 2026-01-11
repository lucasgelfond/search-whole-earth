import Together from "together-ai";
import { env } from "../env";

const EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5";

const together = new Together({ apiKey: env.TOGETHER_API_KEY });

export async function embedQuery(text: string): Promise<number[]> {
	const response = await together.embeddings.create({
		model: EMBEDDING_MODEL,
		input: text,
	});
	return response.data[0].embedding;
}
