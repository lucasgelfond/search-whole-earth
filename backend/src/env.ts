import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),
	TOGETHER_API_KEY: z.string().min(1, "TOGETHER_API_KEY is required"),
	TURBOPUFFER_API_KEY: z.string().min(1, "TURBOPUFFER_API_KEY is required"),
	TURBOPUFFER_REGION: z.string().default("aws-us-east-1"),
	R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
	R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
	R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
	R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
	console.error("Environment validation failed:");
	for (const error of result.error.errors) {
		console.error(`  - ${error.path.join(".")}: ${error.message}`);
	}
	process.exit(1);
}

export const env = result.data;
