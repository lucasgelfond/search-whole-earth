<script lang="ts">
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { page } from '$app/stores';
import SearchResults from '../components/SearchResults.svelte';
import ResultModal from '../components/ResultModal.svelte';
import { searchQuery, isFullScreen, updateUrlParams } from '$lib';
import ThemeToggle from '../components/ThemeToggle.svelte';
import { writable } from 'svelte/store';
import { getIssues, search, warmNamespace } from '../utils/api';

const urlIssueId = $page.url.searchParams.get('issue');
const urlPageNum = $page.url.searchParams.get('page');
const urlFullScreen = $page.url.searchParams.get('fullscreen') === '1';

let input = $page.url.searchParams.get('search') || '';
let result: any[] = [];
let loading = false;
const issueMap = writable<Record<string, any>>({});

let modalProps: Record<string, any> | null = null;

searchQuery.set(input);

if (urlIssueId && urlPageNum) {
	modalProps = {
		issueId: urlIssueId,
		initialPageNumber: Number(urlPageNum),
		initialFullScreen: urlFullScreen
	};
}

async function fetchIssues() {
	try {
		const issues = await getIssues();
		issueMap.set(issues);
	} catch (error) {
		console.error('Failed to fetch issues:', error);
	}
}

function openModal(item: any, issue: any) {
	updateUrlParams({ issue: issue.id, page: String(item.page_number) });
	modalProps = { item, issue };
}

function handleModalClose() {
	if ($isFullScreen) return;
	updateUrlParams({ issue: null, page: null, fullscreen: null });
	modalProps = null;
}

onMount(() => {
	fetchIssues();
	warmNamespace();
	if (input) handleSearch(input);
});

async function handleSearch(query: string) {
	if (loading) return;
	loading = true;
	searchQuery.set(query);
	updateUrlParams({ search: query || null });
	try {
		const results = await search(query);
		result = results;
	} catch (error) {
		console.error('Search error:', error);
	} finally {
		loading = false;
	}
}

function handleKeyPress(event: KeyboardEvent) {
	if (event.key === 'Enter') {
		handleSearch(input);
	}
}
</script>

<svelte:head>
  <meta property="og:title" content="The (Searchable) Whole Earth" />
  <meta property="og:description" content="Search across every page of the Whole Earth Catalog, digitized and OCR'd." />
  <meta property="og:image" content="https://searchwhole.earth/werdemo.gif" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="The (Searchable) Whole Earth" />
  <meta name="twitter:description" content="Search across every page of the Whole Earth Catalog, digitized and OCR'd." />
  <meta name="twitter:image" content="https://searchwhole.earth/werdemo.gif" />
</svelte:head>

<svelte:window on:keydown={(e) => { if (e.key === 'Escape' && modalProps) handleModalClose(); }} />

<div class="flex flex-col h-screen overflow-hidden text-black dark:text-white bg-white dark:bg-black">
  <div class="flex-none px-4 md:px-20 pt-8 md:pt-12 pb-4">
    <div class="flex justify-between items-start">
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-black dark:text-white">
        The (Searchable) Whole Earth
      </h1>
      <ThemeToggle />
    </div>
  </div>

  <div class="flex flex-col flex-1 min-h-0 px-4 md:px-20">
    <h2 class="flex-none text-sm mb-3 text-gray-600 dark:text-gray-300 max-w-[60vh] leading-relaxed">
      Based on the (incredible) archiving effort of the <a href="https://wholeearth.info" class="underline hover:text-black dark:hover:text-white">Whole Earth Index</a> to scan and digitize all of these old issues, by <a href="https://grayarea.org/" class="underline hover:text-black dark:hover:text-white">Gray Area</a> and <a href="https://archive.org/" class="underline hover:text-black dark:hover:text-white">Internet Archive</a>. That effort was led by <a href="https://barrythrew.com/" class="underline hover:text-black dark:hover:text-white">Barry Threw</a>, designed by <a href="https://jongacnik.com/" class="underline hover:text-black dark:hover:text-white">Jon Gacnik</a> and <a href="https://mindyseu.com/" class="underline hover:text-black dark:hover:text-white">Mindy Seu</a>. More info <a href="https://wholeearth.info/information" class="underline hover:text-black dark:hover:text-white">here</a>. This site (+ OCR-ing these pages, embeddings, search functionality, and this webapp) was built by <a href="https://lucasgelfond.online" class="underline hover:text-black dark:hover:text-white">Lucas Gelfond</a>, you can read the source <a href="https://github.com/lucasgelfond/search-whole-earth" class="underline hover:text-black dark:hover:text-white">here</a>.
    </h2>

    <div class="flex-none py-2">
      <input
        type="text"
        class="border border-black dark:border-white rounded px-2 py-1 bg-white dark:bg-black text-black dark:text-white"
        placeholder="Enter text to search..."
        bind:value={input}
        on:keypress={handleKeyPress}
        disabled={loading}
      />
      <button
        class="border border-black dark:border-white text-black dark:text-white px-4 py-1 rounded hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={() => handleSearch(input)}
        disabled={loading}
      >
        {#if loading}
          <span class="inline-block w-4 h-4 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mr-2"></span>
          Searching...
        {:else}
          Search
        {/if}
      </button>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto pb-8">
      <SearchResults
        results={result}
        issueMap={$issueMap}
        {openModal}
        query={input}
      />
    </div>
  </div>
</div>

{#if modalProps}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-black/50"
    on:click|self={handleModalClose}
  >
    <div
      class="relative bg-white dark:bg-black border border-black dark:border-white rounded-lg overflow-hidden w-[90vw] h-[90vh] max-w-none"
    >
      <button
        aria-label="Close modal"
        class="absolute top-3 right-3 z-10 text-black dark:text-white bg-white/70 dark:bg-black/70 rounded-sm text-xl w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white/90 dark:hover:bg-black/90"
        on:click={handleModalClose}
      >×</button>
      <ResultModal {...modalProps} />
    </div>
  </div>
{/if}