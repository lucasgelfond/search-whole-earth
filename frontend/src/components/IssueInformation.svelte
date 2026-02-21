<script lang="ts">
export let issue: any;
export let collectionMap: Record<string, string>;
export let currentPageNumber: number;
</script>

<div class="flex flex-col gap-3">
  <div>
    <div class="text-sm text-black/70 dark:text-white/70">{issue.pub_date}</div>
    <div class="text-3xl font-bold text-black dark:text-white pt-1">{collectionMap[issue.collection]}</div>
  </div>
  <div class="text-black/90 dark:text-white/90 text-sm italic">{@html issue.description}</div>
  <div class="text-sm text-black/80 dark:text-white/80">pg <strong>{currentPageNumber}</strong>/{issue.num_pages}</div>
  <div class="flex gap-4 text-sm">
    <a
      href={issue.internet_archive}
      class="text-blue-600 dark:text-blue-400 hover:underline"
      target="_blank"
      on:click|stopPropagation
    >
      Archive
    </a>
    <a
      href={issue.issue_url}
      class="text-blue-600 dark:text-blue-400 hover:underline"
      target="_blank"
      on:click|stopPropagation
    >
      Info
    </a>
    <a
      href={issue.pdf_download}
      class="text-blue-600 dark:text-blue-400 hover:underline"
      target="_blank"
      on:click|stopPropagation
    >
      PDF
    </a>
  </div>
</div>