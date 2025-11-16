<script lang="ts">
  let { searchQuery }: { searchQuery: string } = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
  {#if searchQuery}
    <p class="text-zinc-500 text-sm md:text-base">No items found matching "{searchQuery}"</p>
  {:else}
    <p class="text-zinc-500 text-sm md:text-base">Start typing to search for items</p>
  {/if}
</div>
