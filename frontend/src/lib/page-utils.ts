const API_URL =
	import.meta.env.VITE_API_URL ||
	(import.meta.env.DEV
		? "http://localhost:3000"
		: "https://searchable-whole-earth-backend.lucasgelfond.workers.dev");

export type PageData = {
	page_number: number;
	image_url: string;
	ocr_result: string;
};

export type PageMap = Record<number, PageData>;

export async function fetchAllPages(issueId: string): Promise<PageMap> {
	const response = await fetch(`${API_URL}/pages/${issueId}`);

	if (!response.ok) {
		console.error("Failed to fetch pages:", response.status);
		return {};
	}

	const data: PageData[] = await response.json();

	return data.reduce((acc: PageMap, page) => {
		if (page.page_number != null) {
			acc[page.page_number] = page;
		}
		return acc;
	}, {} as PageMap);
}
