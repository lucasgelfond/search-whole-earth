<script lang="ts">
import { collectionMap } from '../utils/collections';
import { highlightQuery } from '$lib';

// Props
export let item: any;
export let issueMap: Record<string, any> = {};
export let query: string = '';

// Dispatch click event to parent
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

function handleClick() {
	dispatch('select', item);
}
</script>

<button 
  type="button"
  class="text-left border border-black dark:border-white rounded p-4 grid grid-cols-[1fr] min-[350px]:grid-cols-[100px_1fr] md:grid-cols-[140px_200px_1fr] gap-3 md:gap-6 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 w-full text-black dark:text-white bg-white dark:bg-black"
  on:click={handleClick}
>
  <!-- Image column - only show above 350px width -->
  <div class="hidden min-[350px]:flex w-[100px] md:w-[140px] h-[140px] md:h-[200px] self-start items-center justify-center overflow-hidden">
    {#if item.image_url}
      <img
        src={item.image_url}
        alt="Page preview"
        class="h-full w-auto"
      />
    {/if}
  </div>
  
  <!-- Mobile: Combined metadata and content, Desktop: Just metadata -->
  <div class="flex flex-col md:hidden">
    {#if issueMap[item.parent_issue_id]}
      <div class="text-xs text-black dark:text-white">
        <div class="text-[10px] text-black/70 dark:text-white/70">{issueMap[item.parent_issue_id].pub_date}</div>
        <div class="font-bold text-sm">
          {collectionMap[issueMap[item.parent_issue_id].collection]}
        </div>
        <div>pg <strong>{item.page_number}</strong>/{issueMap[item.parent_issue_id].num_pages}</div>
      </div>
      <div class="flex gap-2 pt-1 text-xs">
        <a
          href={issueMap[item.parent_issue_id].internet_archive}
          class="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          on:click|stopPropagation
        >
          Archive
        </a>
        <a
          href={issueMap[item.parent_issue_id].issue_url}
          class="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          on:click|stopPropagation
        >
          Info
        </a>
      </div>
    {/if}
    <!-- OCR content for mobile - always show even without issue metadata -->
    <div class="pt-1 text-xs h-[60px] overflow-y-auto text-black dark:text-white tracking-[0.01em] leading-[1.6]">
      {@html highlightQuery(item.ocr_result || 'No text available', query)}
    </div>
  </div>
  
  <!-- Desktop only: Metadata column -->
  <div class="hidden md:flex flex-col justify-between h-full">
    {#if issueMap[item.parent_issue_id]}
      <div>
        <div class="text-xs text-black/70 dark:text-white/70">{issueMap[item.parent_issue_id].pub_date}</div>
        <div class="text-xl font-bold text-black dark:text-white pt-1">{collectionMap[issueMap[item.parent_issue_id].collection]}</div>
      </div>
      <div class="text-sm">pg <strong>{item.page_number}</strong>/{issueMap[item.parent_issue_id].num_pages}</div>
      <div class="flex gap-2 text-sm">
        <a
          href={issueMap[item.parent_issue_id].internet_archive}
          class="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          on:click|stopPropagation
        >
          Archive
        </a>
        <a
          href={issueMap[item.parent_issue_id].issue_url}
          class="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          on:click|stopPropagation
        >
          Info
        </a>
        <a
          href={issueMap[item.parent_issue_id].pdf_download}
          class="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          on:click|stopPropagation
        >
          PDF
        </a>
      </div>
    {/if}
  </div>
  
  <!-- Desktop only: OCR content column -->
  <div class="hidden md:block h-[200px] overflow-y-auto text-sm text-black dark:text-white tracking-[0.01em] leading-[1.6]">
    {@html highlightQuery(item.ocr_result || 'No text available', query)}
  </div>
</button>