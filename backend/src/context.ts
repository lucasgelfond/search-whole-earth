import { AsyncLocalStorage } from "node:async_hooks";
import { z } from "zod";

const envSchema = z
	.object({
		TURBOPUFFER_API_KEY: z.string().min(1),
		TURBOPUFFER_REGION: z.string().default("aws-us-east-1"),
		R2_ACCOUNT_ID: z.string().min(1),
		R2_ACCESS_KEY_ID: z.string().min(1),
		R2_SECRET_ACCESS_KEY: z.string().min(1),
		R2_BUCKET_NAME: z.string().min(1),
	})
	.passthrough();

export type Env = z.infer<typeof envSchema> & { AI: Ai };

const envStorage = new AsyncLocalStorage<Env>();

export function runWithEnv<T>(rawEnv: unknown, fn: () => T): T {
	const env = envSchema.parse(rawEnv) as Env;
	return envStorage.run(env, fn);
}

export function getEnv(): Env {
	const env = envStorage.getStore();
	if (!env) {
		throw new Error("Env not available - must be called within request context");
	}
	return env;
}
