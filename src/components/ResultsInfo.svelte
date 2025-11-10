<script lang="ts">
  let { filteredCount, totalCount, hasActiveFilters }: {
    filteredCount: number;
    totalCount: number;
    hasActiveFilters: boolean;
  } = $props();
</script>

<div class="text-zinc-500 mb-4 text-sm md:text-base px-1">
  {#if hasActiveFilters}
    Showing {filteredCount} of {totalCount} items
  {:else}
    {totalCount} items loaded
  {/if}
</div>
