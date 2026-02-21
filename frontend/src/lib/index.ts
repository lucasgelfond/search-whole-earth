import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

export const searchQuery = writable('');
export const isFullScreen = writable(false);
export const isDarkMode = writable(true);

export function initTheme() {
	const params = new URLSearchParams(window.location.search);
	const isLight = params.get('theme') === 'light';
	isDarkMode.set(!isLight);
	if (isLight) {
		document.documentElement.classList.remove('dark');
	} else {
		document.documentElement.classList.add('dark');
	}
}

export function toggleTheme() {
	isDarkMode.update((dark) => {
		const newDark = !dark;
		if (newDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		updateUrlParams({ theme: newDark ? null : 'light' });
		return newDark;
	});
}

const GOTO_OPTS = { replaceState: true, keepFocus: true, noScroll: true } as const;

export function updateUrlParams(params: Record<string, string | null>) {
	const url = new URL(window.location.href);
	for (const [key, value] of Object.entries(params)) {
		if (value === null) {
			url.searchParams.delete(key);
		} else {
			url.searchParams.set(key, value);
		}
	}
	goto(url.pathname + url.search, GOTO_OPTS);
}

export function highlightQuery(text: string, query: string): string {
	const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	if (!query.trim()) return escaped;
	const pattern = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return escaped.replace(new RegExp(`(${pattern})`, 'gi'), '<span class="bg-black text-white dark:bg-white dark:text-black">$1</span>');
}
