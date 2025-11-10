<script lang="ts">
  import { getContext } from 'svelte';
  import type { ReferenceDetails } from '../../types';

  let { referenceDetails }: {
    referenceDetails: ReferenceDetails;
  } = $props();

  // Get searchQuery from context (avoids prop drilling and prevents unnecessary re-renders)
  const getSearchQuery = getContext<() => string>('searchQuery');
  const searchQuery = $derived(getSearchQuery());

  // Simple case-insensitive string matching (much faster than Fuse for simple highlighting)
  function sourceMatchesQuery(source: string): boolean {
    if (!searchQuery.trim()) return false;
    return source.toLowerCase().includes(searchQuery.toLowerCase());
  }
</script>

{#if referenceDetails.count > 0}
  <div class="mt-3 pt-3 border-t border-zinc-800">
    {#each referenceDetails.sources as source}
      <div class="flex justify-between items-center text-xs md:text-sm py-1">
        <span
          class="text-zinc-400"
          class:font-bold={sourceMatchesQuery(source)}
          class:text-zinc-100={sourceMatchesQuery(source)}
        >
          <span class="text-violet-500 mr-1">→</span>
          {source}
        </span>
        <span class="text-emerald-500 font-semibold text-xs">
          ×{referenceDetails.quantityBySource[source]}
        </span>
      </div>
    {/each}
  </div>
{/if}
