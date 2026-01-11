<script lang="ts">
import { bind } from 'svelte-simple-modal';
import ResultModal from './ResultModal.svelte';
import SearchResult from './SearchResult.svelte';

// Props
export let results: any[] = [];
export let issueMap: Record<string, any> = {};
export let modalStore: any;

// Function to show the result modal
function showResultModal(item: any) {
	const issue = issueMap[item.parent_issue_id];
	modalStore.set(bind(ResultModal, { item, issue }));
}
</script>

{#if results.length}
  <div class="pt-4">
    <h3 class="font-bold pb-3">Search Results:</h3>
    <div class="grid gap-4 max-w-3xl">
      {#each results as item}
        <SearchResult 
          {item} 
          {issueMap} 
          on:select={(event) => showResultModal(event.detail)}
        />
      {/each}
    </div>
  </div>
{/if}