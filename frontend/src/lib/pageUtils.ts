import { supabase } from '../utils/supabase';

export type PageData = {
	page_number: number;
	image_url: string;
	ocr_result: string;
};

export type PageMap = Record<number, PageData>;

export async function fetchAllPages(issueId: string): Promise<PageMap> {
	const { data } = await supabase
		.from('page')
		.select('page_number,image_url,ocr_result')
		.eq('parent_issue_id', issueId);

	if (!data) return {};

	return data.reduce((acc: PageMap, page: any) => {
		// Convert page_number to number since it's stored as string
		const pageNum = Number.parseInt(page.page_number as string, 10);
		if (!Number.isNaN(pageNum)) {
			acc[pageNum] = {
				...page,
				page_number: pageNum
			};
		}
		return acc;
	}, {} as PageMap);
}
