<script lang="ts">
import type { PageData, PageMap } from '$lib/page-utils';
import { fetchAllPages } from '$lib/page-utils';
import { onMount } from 'svelte';
import { writable } from 'svelte/store';
import { collectionMap } from '../utils/collections';
import IssueInformation from './IssueInformation.svelte';

export let item: PageData;
export let issue: any;

const currentPageNumber = writable(Number(item.page_number) || 1);
const allPages = writable<PageMap>({});
const loading = writable(false);

const preloadedPages = new Set<number>();

function preloadNearbyImages(pages: PageMap, currentPage: number) {
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
	loading.set(true);
	try {
		const pages = await fetchAllPages(issue.id);
		allPages.set(pages);
		preloadNearbyImages(pages, $currentPageNumber);
	} finally {
		loading.set(false);
	}
}

function changePage(newPageNumber: number) {
	if ($loading) return;
	const pageNum = Number(newPageNumber);
	if (pageNum < 1 || pageNum > issue.num_pages) return;
	if (!$allPages[pageNum]) return;

	currentPageNumber.set(pageNum);
	preloadNearbyImages($allPages, pageNum);
}

// Handle keyboard and touch navigation
function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'ArrowLeft' && $currentPageNumber > 1) {
		changePage($currentPageNumber - 1);
	} else if (event.key === 'ArrowRight' && $currentPageNumber < issue.num_pages) {
		changePage($currentPageNumber + 1);
	}
}

let touchStart: number;
function handleTouchStart(event: TouchEvent) {
	touchStart = event.touches[0].clientX;
}

function handleTouchEnd(event: TouchEvent) {
	const touchEnd = event.changedTouches[0].clientX;
	const diff = touchStart - touchEnd;

	if (Math.abs(diff) > 50) {
		// Minimum swipe distance
		if (diff > 0 && $currentPageNumber < issue.num_pages) {
			changePage($currentPageNumber + 1);
		} else if (diff < 0 && $currentPageNumber > 1) {
			changePage($currentPageNumber - 1);
		}
	}
}

let cleanup: () => void;

onMount(() => {
	allPages.set({ [item.page_number]: item });
	window.addEventListener('keydown', handleKeydown);
	cleanup = () => window.removeEventListener('keydown', handleKeydown);
	loadAllPages();
	return cleanup;
});
</script>
<!-- Desktop Layout -->
<div class="hidden md:flex bg-black text-white">
  <!-- Image column - flexible width to accommodate full-width image -->
  <div class="flex-1 overflow-y-auto">
    <div 
      class="relative inline-block"
      on:touchstart={handleTouchStart}
      on:touchend={handleTouchEnd}
    >
      {#if $allPages[$currentPageNumber]?.image_url}
        <img 
          src={$allPages[$currentPageNumber].image_url} 
          alt="Page {$currentPageNumber}" 
          class="w-full h-auto" 
        />
        
        <div class="absolute inset-y-0 left-0 right-0 flex justify-between items-center">
          <button 
            class="bg-black/70 text-white p-6 text-3xl rounded-full hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={$currentPageNumber <= 1 || $loading || !$allPages[$currentPageNumber - 1]}
            on:click={() => changePage($currentPageNumber - 1)}
          >
            ←
          </button>
          <button 
            class="bg-black/70 text-white p-6 text-3xl rounded-full hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={$currentPageNumber >= issue.num_pages || $loading || !$allPages[$currentPageNumber + 1]}
            on:click={() => changePage($currentPageNumber + 1)}
          >
            →
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Content column - fixed width for readability -->
  <div class="w-[500px] flex-none flex flex-col p-6 border-l border-white/20">
    <div class="flex-none">
      <IssueInformation 
        {issue}
        {collectionMap}
        currentPageNumber={$currentPageNumber}
      />
    </div>
    
    <div class="flex-1 overflow-y-auto mt-6 h-full">
      <div class="text-lg leading-relaxed">
        {$allPages[$currentPageNumber]?.ocr_result}
      </div>
    </div>
  </div>
</div>
<!-- Mobile Layout -->
<div class="md:hidden flex flex-col h-full bg-black text-white">
  <div 
    class="flex-none relative max-h-[35vh]"
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
  >
    {#if $allPages[$currentPageNumber]?.image_url}
      <img 
        src={$allPages[$currentPageNumber].image_url} 
        alt="Page {$currentPageNumber}" 
        class="w-full h-full object-contain" 
      />
      
      <div class="absolute inset-y-0 left-0 flex items-center">
        <button
          class="bg-black/70 text-white p-2 rounded-r-lg hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={$currentPageNumber <= 1 || $loading || !$allPages[$currentPageNumber - 1]}
          on:click={() => changePage($currentPageNumber - 1)}
        >
          <div class="w-6 h-12 flex items-center">←</div>
        </button>
      </div>

      <div class="absolute inset-y-0 right-0 flex items-center">
        <button
          class="bg-black/70 text-white p-2 rounded-l-lg hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={$currentPageNumber >= issue.num_pages || $loading || !$allPages[$currentPageNumber + 1]}
          on:click={() => changePage($currentPageNumber + 1)}
        >
          <div class="w-6 h-12 flex items-center">→</div>
        </button>
      </div>
    {/if}
  </div>

  <div class="p-4 flex-none border-b">
    <div class="text-lg font-bold">{collectionMap[issue.collection]}</div>
    <div class="text-white/90">{issue.pub_date}</div>
    <div class="mt-2 flex justify-between items-center">
      <div class="flex gap-4">
        <a href={issue.internet_archive} class="text-white hover:underline" target="_blank">Archive</a>
        <a href={issue.issue_url} class="text-white hover:underline" target="_blank">Info</a>
        <a href={issue.pdf_download} class="text-white hover:underline" target="_blank">PDF</a>
      </div>
      <div>Page {$currentPageNumber} of {issue.num_pages}</div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 min-h-0">
    <div class="text-base h-full">
      {$allPages[$currentPageNumber]?.ocr_result}
    </div>
  </div>
</div>