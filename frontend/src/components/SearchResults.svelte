<script lang="ts">
import SearchResult from './SearchResult.svelte';

// Props
export let results: any[] = [];
export let issueMap: Record<string, any> = {};
export let openModal: (item: any, issue: any) => void;
export let query: string = '';

// Function to show the result modal
function showResultModal(item: any) {
	const issue = issueMap[item.parent_issue_id];
	openModal(item, issue);
}
</script>

{#if results.length}
  <div class="pt-4">
    <h3 class="font-bold pb-3">{results.length} result{results.length === 1 ? '' : 's'}</h3>
    <div class="grid gap-4">
      {#each results as item}
        <SearchResult
          {item}
          {issueMap}
          {query}
          on:select={(event) => showResultModal(event.detail)}
        />
      {/each}
    </div>
  </div>
{/if}