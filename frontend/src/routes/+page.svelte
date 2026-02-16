<script lang="ts">
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import SearchResults from '../components/SearchResults.svelte';
import ResultModal from '../components/ResultModal.svelte';
import { searchQuery, isFullScreen } from '$lib';
import { writable } from 'svelte/store';
import { getIssues, search, warmNamespace } from '../utils/api';

// Read URL params synchronously so initial render reflects them
const urlIssueId = $page.url.searchParams.get('issue');
const urlPageNum = $page.url.searchParams.get('page');
const urlFullScreen = $page.url.searchParams.get('fullscreen') === '1';

let input = $page.url.searchParams.get('search') || '';
let result: any[] = [];
let loading = false;
const issueMap = writable<Record<string, any>>({});

// Modal state: null = closed, object = open with these props
let modalProps: Record<string, any> | null = null;

searchQuery.set(input);

// If URL has modal params, open immediately — no animation, no library, just DOM
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
	const url = new URL(window.location.href);
	url.searchParams.set('issue', issue.id);
	url.searchParams.set('page', String(item.page_number));
	goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
	modalProps = { item, issue };
}

function handleModalClose() {
	if ($isFullScreen) return;
	const url = new URL(window.location.href);
	url.searchParams.delete('issue');
	url.searchParams.delete('page');
	url.searchParams.delete('fullscreen');
	goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
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
	const url = new URL(window.location.href);
	if (query) {
		url.searchParams.set('search', query);
	} else {
		url.searchParams.delete('search');
	}
	goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
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

<svelte:window on:keydown={(e) => { if (e.key === 'Escape' && modalProps) handleModalClose(); }} />

<div class="flex flex-col h-screen overflow-hidden text-white bg-black">
  <div class="flex-none px-4 md:px-20 pt-8 md:pt-12 pb-4">
    <h1 class="text-4xl md:text-5xl font-bold mb-6 text-white">
      The (Searchable) Whole Earth
    </h1>
  </div>

  <div class="flex flex-col flex-1 min-h-0 px-4 md:px-20">
    <h2 class="flex-none text-sm mb-3 text-gray-300 max-w-[60vh] leading-relaxed">
      Based on the (incredible) archiving effort of the <a href="https://wholeearth.info" class="underline hover:text-white">Whole Earth Index</a> to scan and digitize all of these old issues, by <a href="https://grayarea.org/" class="underline hover:text-white">Gray Area</a> and <a href="https://archive.org/" class="underline hover:text-white">Internet Archive</a>. That effort was led by <a href="https://barrythrew.com/" class="underline hover:text-white">Barry Threw</a>, designed by <a href="https://jongacnik.com/" class="underline hover:text-white">Jon Gacnik</a> and <a href="https://mindyseu.com/" class="underline hover:text-white">Mindy Seu</a>. More info <a href="https://wholeearth.info/information" class="underline hover:text-white">here</a>. This site (+ OCR-ing these pages, embeddings, search functionality, and this webapp) was built by <a href="https://lucasgelfond.online" class="underline hover:text-white">Lucas Gelfond</a>, you can read the source <a href="https://github.com/lucasgelfond/searchable-whole-earth" class="underline hover:text-white">here</a>.
    </h2>

    <div class="flex-none py-2">
      <input
        type="text"
        class="border border-white rounded px-2 py-1 bg-black text-white"
        placeholder="Enter text to search..."
        bind:value={input}
        on:keypress={handleKeyPress}
        disabled={loading}
      />
      <button
        class="border border-white text-white px-4 py-1 rounded hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={() => handleSearch(input)}
        disabled={loading}
      >
        {#if loading}
          <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
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
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 flex items-center justify-center"
    style="background-color: rgba(0, 0, 0, 0.5)"
    on:click|self={handleModalClose}
  >
    <div
      class="relative bg-black border border-white rounded-lg overflow-hidden"
      style="width: 90vw; height: 90vh; max-width: none;"
    >
      <button
        class="absolute top-4 right-4 z-10 text-white bg-transparent border-none opacity-100 text-2xl w-6 h-6 flex items-center justify-center cursor-pointer hover:opacity-70"
        on:click={handleModalClose}
      >×</button>
      <ResultModal {...modalProps} />
    </div>
  </div>
{/if}