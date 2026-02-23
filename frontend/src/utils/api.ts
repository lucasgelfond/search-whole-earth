const API_URL =
	import.meta.env.VITE_API_URL ||
	(import.meta.env.DEV
		? "http://localhost:3000"
		: "https://searchable-whole-earth-backend.lucasgelfond.workers.dev");

export interface SearchResult {
	id: string;
	parent_issue_id: string | null;
	page_number: number | null;
	ocr_result: string | null;
	r2_object_id: string | null;
	image_url: string | null;
	score: number;
}

export interface Issue {
	id: string;
	filename: string;
	created_at: string;
	num_pages: number;
	issue_url: string;
	description: string;
	pdf_download: string;
	internet_archive: string;
	collection: string;
	pub_date: string;
}

export type IssueMap = Record<string, Issue>;

export async function search(query: string, matchCount = 30): Promise<SearchResult[]> {
	const response = await fetch(`${API_URL}/search`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, match_count: matchCount }),
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(`Search failed: ${response.status} ${response.statusText} ${body}`);
	}

	return response.json();
}

export async function getIssues(): Promise<IssueMap> {
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
		(acc: IssueMap, issue: Issue) => {
			acc[issue.id] = issue;
			return acc;
		},
		{} as IssueMap
	);
}

export async function warmNamespace(): Promise<void> {
	try {
		const response = await fetch(`${API_URL}/warm-namespace`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			console.error("Failed to warm namespace:", response.status, response.statusText);
		}
	} catch (error) {
		console.error("Failed to warm namespace:", error);
	}
}
