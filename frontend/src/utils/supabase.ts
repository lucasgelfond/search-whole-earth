import { type SupabaseClient, createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://quqkbbcfqdgmgnzutqer.supabase.co';
const SUPABASE_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cWtiYmNmcWRnbWduenV0cWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTAxMjUsImV4cCI6MjA1NzAyNjEyNX0.QXmOk7-4_9GpzJjrx7Zr_bACKecNM8_bkAMo7zECYPI';

// Create Supabase client
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
	if (!_supabase) {
		_supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	}
	return _supabase;
}

export const supabase = getSupabase();

/**
 * Fetches all issues from static JSON file
 * @returns A record mapping issue IDs to issue objects
 */
export async function getIssuesSupabase(): Promise<Record<string, any>> {
	try {
		const response = await fetch('/issues.json');
		const staticIssues = await response.json();

		return staticIssues.reduce(
			(acc: Record<string, any>, issue: any) => {
				acc[issue.id] = issue;
				return acc;
			},
			{} as Record<string, any>
		);
	} catch (err) {
		console.error('Error fetching issues:', err);
		return {};
	}
}

/**
 * Generates an embedding vector for the given text using Supabase Edge Function
 * @param input The text to generate an embedding for
 * @returns The embedding vector
 */
export async function supabaseEmbed(input: string): Promise<number[]> {
	console.log('generating embedding with supabase');
	try {
		const response = await fetch(
			'https://quqkbbcfqdgmgnzutqer.supabase.co/functions/v1/embeddings',
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					Authorization:
						'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cWtiYmNmcWRnbWduenV0cWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTAxMjUsImV4cCI6MjA1NzAyNjEyNX0.QXmOk7-4_9GpzJjrx7Zr_bACKecNM8_bkAMo7zECYPI'
				},
				body: JSON.stringify({ input })
			}
		);

		if (!response.ok) {
			throw new Error(`Embedding request failed: ${response.status} ${response.statusText}`);
		}

		const { embedding } = await response.json();
		return embedding;
	} catch (error) {
		console.error('Embedding error:', error);
		throw error;
	}
}

/**
 * Performs a semantic search using the Supabase Edge Function
 * @param query The search query
 * @param matchCount Number of results to return
 * @returns Array of search results
 */
export async function searchSupabaseEmbedSearch(query: string, matchCount = 30): Promise<any[]> {
	try {
		const response = await fetch(
			'https://quqkbbcfqdgmgnzutqer.supabase.co/functions/v1/embed-search',
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					Authorization:
						'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cWtiYmNmcWRnbWduenV0cWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTAxMjUsImV4cCI6MjA1NzAyNjEyNX0.QXmOk7-4_9GpzJjrx7Zr_bACKecNM8_bkAMo7zECYPI'
				},
				body: JSON.stringify({
					query: query,
					match_count: matchCount
				})
			}
		);

		if (!response.ok) {
			throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		// Filter out any results with errors
		return data.filter((item: any) => !item?.error);
	} catch (error) {
		console.error('Search error:', error);
		throw error;
	}
}

/**
 * Fetches search results using a pre-computed embedding
 * @param queryText The original search text
 * @param embedding The embedding vector
 * @param matchCount Number of results to return
 * @returns Array of search results
 */
export async function supabaseResultsFromEmbedding(
	queryText: string,
	embedding: number[],
	matchCount = 30
): Promise<any[]> {
	try {
		console.log('Using supabase to fetch results with embedding:', {
			queryText,
			embeddingLength: embedding.length
		});

		// Use the Supabase client to call the RPC function directly
		const { data, error } = await supabase.rpc('hybrid_search', {
			query_text: queryText,
			query_embedding: embedding,
			match_count: matchCount
		});

		if (error) {
			console.error('Supabase RPC error:', error);
			throw error;
		}

		// Filter out any results with errors
		return data.filter((item: any) => !item?.error);
	} catch (error) {
		console.error('Search error details:', error);
		throw error;
	}
}
