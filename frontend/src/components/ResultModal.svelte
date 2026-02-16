<script lang="ts">
import type { PageData, PageMap } from '$lib/page-utils';
import { fetchAllPages } from '$lib/page-utils';
import { onMount, onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import { collectionMap } from '../utils/collections';
import IssueInformation from './IssueInformation.svelte';
import { highlightQuery, searchQuery, isFullScreen, updateUrlParams } from '$lib';
import { getIssues } from '../utils/api';

// Accept either pre-loaded data (click flow) or just IDs (URL flow)
export let item: PageData | null = null;
export let issue: any = null;
export let issueId: string = '';
export let initialPageNumber: number = 0;
export let initialFullScreen: boolean = false;

let fullScreen = initialFullScreen;
isFullScreen.set(fullScreen);

function toggleFullScreen() {
	fullScreen = !fullScreen;
	isFullScreen.set(fullScreen);
	updateUrlParams({ fullscreen: fullScreen ? '1' : null });
}

const currentPageNumber = writable(Number(item?.page_number || initialPageNumber) || 1);
const allPages = writable<PageMap>({});
const loading = writable(false);

let imageLoaded = false;

$: {
	$currentPageNumber;
	imageLoaded = false;
}

const preloadedPages = new Set<number>();

function preloadNearbyImages(pages: PageMap, currentPage: number) {
	if (!issue) return;
	const start = Math.max(1, currentPage - 10);
	const end = Math.min(issue.num_pages, currentPage + 10);

	for (let i = start; i <= end; i++) {
		if (pages[i]?.image_url && !preloadedPages.has(i)) {
			preloadedPages.add(i);
			const img = new Image();
			img.src = pages[i].image_url;
		}
	}
}

async function loadAllPages() {
	if (!issue) return;
	loading.set(true);
	try {
		const pages = await fetchAllPages(issue.id);
		allPages.set(pages);
		preloadNearbyImages(pages, $currentPageNumber);
	} finally {
		loading.set(false);
	}
}

function changePage(pageNum: number) {
	if ($loading || !issue) return;
	if (pageNum < 1 || pageNum > issue.num_pages) return;
	if (!$allPages[pageNum]) return;

	currentPageNumber.set(pageNum);
	preloadNearbyImages($allPages, pageNum);
	updateUrlParams({ page: String(pageNum) });
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && fullScreen) {
		toggleFullScreen();
		event.stopImmediatePropagation();
		return;
	}
	if (!issue) return;
	if (event.key === 'ArrowLeft' && $currentPageNumber > 1) {
		changePage($currentPageNumber - 1);
	} else if (event.key === 'ArrowRight' && $currentPageNumber < issue.num_pages) {
		changePage($currentPageNumber + 1);
	}
}

let touchStartX: number;

function handleTouchStart(event: TouchEvent) {
	touchStartX = event.touches[0].clientX;
}

function handleTouchEnd(event: TouchEvent) {
	if (!issue) return;
	const diff = touchStartX - event.changedTouches[0].clientX;
	if (Math.abs(diff) < 50) return;

	if (diff > 0 && $currentPageNumber < issue.num_pages) {
		changePage($currentPageNumber + 1);
	} else if (diff < 0 && $currentPageNumber > 1) {
		changePage($currentPageNumber - 1);
	}
}

onMount(async () => {
	if (!issue && issueId) {
		const issues = await getIssues();
		issue = issues[issueId];
	}

	if (item) {
		allPages.set({ [item.page_number]: item });
	}

	// Capture phase so Escape for fullscreen fires before modal close handler
	window.addEventListener('keydown', handleKeydown, true);
	loadAllPages();
});

onDestroy(() => {
	if (typeof window !== 'undefined') {
		window.removeEventListener('keydown', handleKeydown, true);
	}
	isFullScreen.set(false);
});
</script>

{#if fullScreen}
<div
  class="fixed inset-0 z-[100] bg-black flex items-center justify-center"
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
>
  {#if $allPages[$currentPageNumber]?.image_url}
    <img
      src={$allPages[$currentPageNumber].image_url}
      alt="Page {$currentPageNumber}"
      class="max-h-full max-w-full object-contain transition-opacity duration-150"
      class:opacity-0={!imageLoaded}
      on:load={() => imageLoaded = true}
    />
  {/if}
  {#if !imageLoaded}
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
    </div>
  {/if}

  <div class="absolute inset-y-0 left-0 right-0 flex justify-between items-center pointer-events-none">
    <button
      aria-label="Previous page"
      class="pointer-events-auto bg-black/70 text-white p-4 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
      disabled={$currentPageNumber <= 1 || $loading || !$allPages[$currentPageNumber - 1]}
      on:click={() => changePage($currentPageNumber - 1)}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <button
      aria-label="Next page"
      class="pointer-events-auto bg-black/70 text-white p-4 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
      disabled={!issue || $currentPageNumber >= issue.num_pages || $loading || !$allPages[$currentPageNumber + 1]}
      on:click={() => changePage($currentPageNumber + 1)}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  </div>

  <button
    aria-label="Exit fullscreen"
    class="absolute top-4 right-4 bg-black/70 text-white p-2 hover:bg-black/90 flex items-center justify-center"
    on:click={toggleFullScreen}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
  </button>

  {#if issue}
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 text-sm">
      pg <strong>{$currentPageNumber}</strong>/{issue.num_pages}
    </div>
  {/if}
</div>
{/if}

{#if issue}
<!-- Desktop Layout -->
<div class="hidden md:flex bg-black text-white h-full">
  <!-- Image column -->
  <div
    class="flex-1 flex items-center justify-center p-6 min-h-0 min-w-0 relative"
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
  >
    {#if $allPages[$currentPageNumber]?.image_url}
      <img
        src={$allPages[$currentPageNumber].image_url}
        alt="Page {$currentPageNumber}"
        class="max-h-full max-w-full object-contain transition-opacity duration-150"
        class:opacity-0={!imageLoaded}
        on:load={() => imageLoaded = true}
      />
    {/if}
    {#if !imageLoaded}
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      </div>
    {/if}

    <div class="absolute inset-y-0 left-0 right-0 flex justify-between items-center pointer-events-none px-2">
      <button
        aria-label="Previous page"
        class="pointer-events-auto bg-black/70 text-white p-4 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={$currentPageNumber <= 1 || $loading || !$allPages[$currentPageNumber - 1]}
        on:click={() => changePage($currentPageNumber - 1)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button
        aria-label="Next page"
        class="pointer-events-auto bg-black/70 text-white p-4 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={$currentPageNumber >= issue.num_pages || $loading || !$allPages[$currentPageNumber + 1]}
        on:click={() => changePage($currentPageNumber + 1)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>

    <button
      aria-label="Enter fullscreen"
      class="absolute top-4 right-4 bg-black/70 text-white p-2 hover:bg-black/90 flex items-center justify-center"
      on:click={toggleFullScreen}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
    </button>
  </div>

  <!-- Content column -->
  <div class="w-[300px] lg:w-[500px] flex-none flex flex-col p-6 border-l border-white/20">
    <div class="flex-none">
      <IssueInformation
        {issue}
        {collectionMap}
        currentPageNumber={$currentPageNumber}
      />
    </div>

    <div class="flex-1 overflow-y-auto mt-6 min-h-0">
      <div class="text-sm tracking-[0.01em] leading-[1.6]">
        {@html highlightQuery($allPages[$currentPageNumber]?.ocr_result || '', $searchQuery)}
      </div>
    </div>
  </div>
</div>
<!-- Mobile Layout -->
<div class="md:hidden flex flex-col h-full bg-black text-white">
  <div
    class="flex-none relative h-[35vh]"
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
  >
    {#if $allPages[$currentPageNumber]?.image_url}
      <img
        src={$allPages[$currentPageNumber].image_url}
        alt="Page {$currentPageNumber}"
        class="w-full h-full object-contain transition-opacity duration-150"
        class:opacity-0={!imageLoaded}
        on:load={() => imageLoaded = true}
      />
    {/if}
    {#if !imageLoaded}
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      </div>
    {/if}

    <div class="absolute inset-y-0 left-0 flex items-center">
      <button
        aria-label="Previous page"
        class="bg-black/70 text-white p-2 rounded-r-lg hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={$currentPageNumber <= 1 || $loading || !$allPages[$currentPageNumber - 1]}
        on:click={() => changePage($currentPageNumber - 1)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
    </div>

    <div class="absolute inset-y-0 right-0 flex items-center">
      <button
        aria-label="Next page"
        class="bg-black/70 text-white p-2 rounded-l-lg hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={$currentPageNumber >= issue.num_pages || $loading || !$allPages[$currentPageNumber + 1]}
        on:click={() => changePage($currentPageNumber + 1)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>

    <button
      aria-label="Enter fullscreen"
      class="absolute top-3 right-12 bg-black/70 text-white p-2 rounded-sm hover:bg-black/90 flex items-center justify-center"
      on:click={toggleFullScreen}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
    </button>
  </div>

  <div class="p-4 flex-none border-b border-white/20">
    <div class="text-sm text-white/70">{issue.pub_date}</div>
    <div class="text-lg font-bold">{collectionMap[issue.collection]}</div>
    <div class="mt-2 flex justify-between items-center">
      <div class="flex gap-4">
        <a href={issue.internet_archive} class="text-blue-400 hover:underline" target="_blank">Archive</a>
        <a href={issue.issue_url} class="text-blue-400 hover:underline" target="_blank">Info</a>
        <a href={issue.pdf_download} class="text-blue-400 hover:underline" target="_blank">PDF</a>
      </div>
      <div>pg <strong>{$currentPageNumber}</strong>/{issue.num_pages}</div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 min-h-0">
    <div class="text-sm tracking-[0.01em] leading-[1.6]">
      {@html highlightQuery($allPages[$currentPageNumber]?.ocr_result || '', $searchQuery)}
    </div>
  </div>
</div>
{:else}
<div class="flex items-center justify-center h-full bg-black">
  <span class="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
</div>
{/if}