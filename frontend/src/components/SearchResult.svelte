<script lang="ts">
import { collectionMap } from '../utils/collections';

// Props
export let item: any;
export let issueMap: Record<string, any> = {};

// Dispatch click event to parent
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

function handleClick() {
	dispatch('select', item);
}
</script>

<button 
  type="button"
  class="text-left border border-white rounded p-4 grid grid-cols-[1fr] min-[350px]:grid-cols-[80px_1fr] md:grid-cols-[100px_220px_1fr] gap-3 md:gap-4 cursor-pointer hover:bg-gray-800 w-full text-white bg-black"
  on:click={handleClick}
>
  <!-- Image column - only show above 350px width -->
  <div class="hidden min-[350px]:block w-[80px] md:w-[100px] self-start">
    {#if item.image_url}
      <img 
        src={item.image_url} 
        alt="Page preview" 
        class="w-full h-auto max-h-[100px] md:max-h-[150px] object-contain" 
      />
    {/if}
  </div>
  
  <!-- Mobile: Combined metadata and content, Desktop: Just metadata -->
  <div class="flex flex-col md:hidden">
    {#if issueMap[item.parent_issue_id]}
      <div class="text-xs text-white">
        <div class="font-bold">
          {collectionMap[issueMap[item.parent_issue_id].collection]} ({issueMap[item.parent_issue_id].pub_date})
        </div>
        <div>Page {item.page_number}/{issueMap[item.parent_issue_id].num_pages}</div>
      </div>
      <div class="flex gap-2 pt-1 text-xs">
        <a
          href={issueMap[item.parent_issue_id].internet_archive}
          class="text-blue-400 hover:underline"
          target="_blank"
          on:click|stopPropagation
        >
          Archive
        </a>
        <a
          href={issueMap[item.parent_issue_id].issue_url}
          class="text-blue-400 hover:underline"
          target="_blank"
          on:click|stopPropagation
        >
          Info
        </a>
      </div>
    {/if}
    <!-- OCR content for mobile - always show even without issue metadata -->
    <div class="pt-1 text-xs h-[60px] overflow-y-auto text-white">
      {item.ocr_result || 'No text available'}
    </div>
  </div>
  
  <!-- Desktop only: Metadata column -->
  <div class="hidden md:flex flex-col">
    {#if issueMap[item.parent_issue_id]}
      <div class="text-sm text-white">
        <div class="font-bold">{collectionMap[issueMap[item.parent_issue_id].collection]}</div>
        <div>Published: {issueMap[item.parent_issue_id].pub_date}</div>
        <div>Page {item.page_number}/{issueMap[item.parent_issue_id].num_pages}</div>
      </div>
      <div class="flex gap-2 pt-2 text-sm">
        <a 
          href={issueMap[item.parent_issue_id].internet_archive} 
          class="text-blue-400 hover:underline" 
          target="_blank"
          on:click|stopPropagation
        >
          Archive
        </a>
        <a 
          href={issueMap[item.parent_issue_id].issue_url} 
          class="text-blue-400 hover:underline" 
          target="_blank"
          on:click|stopPropagation
        >
          Info
        </a>
        <a 
          href={issueMap[item.parent_issue_id].pdf_download} 
          class="text-blue-400 hover:underline" 
          target="_blank"
          on:click|stopPropagation
        >
          PDF
        </a>
      </div>
    {/if}
  </div>
  
  <!-- Desktop only: OCR content column -->
  <div class="hidden md:block h-[150px] overflow-y-auto text-sm text-white">
    {item.ocr_result || 'No text available'}
  </div>
</button>