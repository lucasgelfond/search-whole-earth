export interface RankedItem {
	id: string;
	score: number;
	attrs: Record<string, unknown>;
}

export function reciprocalRankFusion(
	vectorResults: RankedItem[],
	bm25Results: RankedItem[],
	k = 60
): RankedItem[] {
	const scores = new Map<string, { score: number; attrs: Record<string, unknown> }>();

	vectorResults.forEach((item, rank) => {
		const rrfScore = 1.0 / (k + rank + 1);
		const existing = scores.get(item.id);
		if (existing) {
			existing.score += rrfScore;
		} else {
			scores.set(item.id, { score: rrfScore, attrs: item.attrs });
		}
	});

	bm25Results.forEach((item, rank) => {
		const rrfScore = 1.0 / (k + rank + 1);
		const existing = scores.get(item.id);
		if (existing) {
			existing.score += rrfScore;
		} else {
			scores.set(item.id, { score: rrfScore, attrs: item.attrs });
		}
	});

	return Array.from(scores.entries())
		.map(([id, data]) => ({ id, score: data.score, attrs: data.attrs }))
		.sort((a, b) => b.score - a.score);
}
