const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface SearchResult {
	id: string;
	parent_issue_id: string | null;
	page_number: number | null;
	ocr_result: string | null;
	r2_object_id: string | null;
	image_url: string | null;
	score: number;
}

export async function search(query: string, matchCount = 30): Promise<SearchResult[]> {
	const response = await fetch(`${API_URL}/search`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, match_count: matchCount }),
	});

	if (!response.ok) {
		throw new Error(`Search failed: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export async function getIssues(): Promise<Record<string, any>> {
	const response = await fetch("/issues.json");

	if (!response.ok) {
		console.error("Failed to fetch issues:", response.status, response.statusText);
		return {};
	}

	const issues = await response.json();

	if (!Array.isArray(issues)) {
		console.error("Issues response is not an array:", issues);
		return {};
	}

	return issues.reduce(
		(acc: Record<string, any>, issue: any) => {
			acc[issue.id] = issue;
			return acc;
		},
		{} as Record<string, any>
	);
}
