<script lang="ts">
import { onMount } from 'svelte';
import Modal from 'svelte-simple-modal';
import { writable } from 'svelte/store';
import SearchResults from '../components/SearchResults.svelte';
import { getIssuesSupabase, supabaseEmbed, supabaseResultsFromEmbedding } from '../utils/supabase';

let input = '';
let result: any[] = [];
let loading = false;
const issueMap = writable<Record<string, any>>({});
const modalStore = writable(null);

async function fetchIssues() {
	const issues = await getIssuesSupabase();
	issueMap.set(issues);
}

onMount(() => {
	fetchIssues();
});

async function handleSearch(query: string) {
	if (loading) return;
	loading = true;
	const embedding = await supabaseEmbed(query);
	console.log('generated embedding from supabase: ', { embedding });
	const results = await supabaseResultsFromEmbedding(query, embedding);
	result = results;
	loading = false;
}

function handleKeyPress(event: KeyboardEvent) {
	if (event.key === 'Enter') {
		handleSearch(input);
	}
}
</script>
<Modal 
  show={$modalStore}
  styleWindow={{ width: '90vw', height: '80vh', maxWidth: 'none', marginBottom: '15vh', backgroundColor: 'black', color: 'white', border: '1px solid white', borderRadius: '0.5rem', overflow: 'hidden' }}
  styleContent={{ height: '100%' }}
  styleBg={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
  styleCloseButton={{ 
    color: 'white',
    backgroundColor: 'transparent',
    border: 'none',
    opacity: '1', 
    fontSize: '24px',
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    'aria-label': 'Close modal',
    type: 'button',
    content: '"×"'
  }}
>
  <div class="flex flex-col w-full h-full min-h-full flex-grow text-white bg-black">
    <div class="sticky top-0 bg-black px-4 md:px-20 pt-8 md:pt-12 pb-4 z-10">
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-white">
        The (Searchable) Whole Earth
      </h1>
    </div>

    <div class="flex flex-row flex-1 bg-black text-white">
      <!-- Left side -->
      <div class="flex-1 px-4 md:px-20">
        <h2 class="text-sm mb-3 text-gray-300 max-w-[60vh] leading-relaxed">
          Based on the (incredible) archiving effort of the <a href="https://wholeearth.info" class="underline hover:text-white">Whole Earth Index</a> to scan and digitize all of these old issues, by <a href="https://grayarea.org/" class="underline hover:text-white">Gray Area</a> and <a href="https://archive.org/" class="underline hover:text-white">Internet Archive</a>. That effort was led by <a href="https://barrythrew.com/" class="underline hover:text-white">Barry Threw</a>, designed by <a href="https://jongacnik.com/" class="underline hover:text-white">Jon Gacnik</a> and <a href="https://mindyseu.com/" class="underline hover:text-white">Mindy Seu</a>. More info <a href="https://wholeearth.info/information" class="underline hover:text-white">here</a>. This site (+ OCR-ing these pages, embeddings, search functionality, and this webapp) was built by <a href="https://lucasgelfond.online" class="underline hover:text-white">Lucas Gelfond</a> in San Francisco.
        </h2>



        <div class="flex gap-2">
          <div class="py-2">
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
                <span class="inline-block animate-spin mr-1">⟳</span>
                Searching...
              {:else}
                Search
              {/if}
            </button>
          </div>
        </div>

        <div class="overflow-y-auto pb-8 max-h-[400px] md:pb-40">
          <SearchResults
            results={result}
            issueMap={$issueMap}
            {modalStore}
          />
        </div>
      </div>
    </div>
  </div>
</Modal>
