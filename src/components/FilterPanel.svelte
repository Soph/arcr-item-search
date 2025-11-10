<script lang="ts">
  import { getRarityColor } from '../lib/filterUtils';

  let {
    availableRarities,
    availableTypes,
    selectedRarities = $bindable([]),
    selectedTypes = $bindable([])
  }: {
    availableRarities: string[];
    availableTypes: string[];
    selectedRarities: string[];
    selectedTypes: string[];
  } = $props();

  let showFilters = $state(false);

  function toggleRarity(rarity: string) {
    if (selectedRarities.includes(rarity)) {
      selectedRarities = selectedRarities.filter(r => r !== rarity);
    } else {
      selectedRarities = [...selectedRarities, rarity];
    }
  }

  function toggleType(type: string) {
    if (selectedTypes.includes(type)) {
      selectedTypes = selectedTypes.filter(t => t !== type);
    } else {
      selectedTypes = [...selectedTypes, type];
    }
  }

  function clearAllFilters() {
    selectedRarities = [];
    selectedTypes = [];
  }

  let activeFilterCount = $derived(selectedRarities.length + selectedTypes.length);
</script>

<div class="mb-4">
  <button
    class="w-full flex items-center justify-center gap-2 px-5 py-4 bg-zinc-900 border border-zinc-700
           rounded-lg text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600 active:scale-[0.98]
           transition-[background-color,border-color,transform] duration-200 text-base md:text-lg font-medium"
    onclick={() => showFilters = !showFilters}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
    <span>Filters</span>
    {#if activeFilterCount > 0}
      <span class="bg-violet-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{activeFilterCount}</span>
    {/if}
  </button>

  {#if showFilters}
    <div class="mt-3 p-5 md:p-6 bg-zinc-900 border border-zinc-700 rounded-lg">
      <!-- Rarity Filters -->
      <div class="mb-5">
        <div class="flex justify-between items-center mb-3">
          <span class="text-zinc-100 font-semibold text-base md:text-lg">Rarity</span>
          {#if selectedRarities.length > 0}
            <button
              class="text-zinc-500 hover:text-violet-400 active:text-violet-300 text-sm md:text-base
                     transition-colors min-h-[44px] px-3"
              onclick={() => selectedRarities = []}
            >
              Clear
            </button>
          {/if}
        </div>
        <div class="flex flex-wrap gap-2.5">
          {#each availableRarities as rarity}
            <button
              class="px-4 py-2.5 md:px-5 md:py-3 bg-zinc-950 border rounded-lg text-sm md:text-base
                     transition-[background-color,transform] duration-200 hover:bg-zinc-800 active:scale-95"
              class:font-semibold={selectedRarities.includes(rarity)}
              style:border-color={getRarityColor(rarity)}
              style:background-color={selectedRarities.includes(rarity) ? `${getRarityColor(rarity)}22` : ''}
              style:color={selectedRarities.includes(rarity) ? getRarityColor(rarity) : '#aaa'}
              onclick={() => toggleRarity(rarity)}
            >
              {rarity}
            </button>
          {/each}
        </div>
      </div>

      <!-- Type Filters -->
      <div class="mb-5">
        <div class="flex justify-between items-center mb-3">
          <span class="text-zinc-100 font-semibold text-base md:text-lg">Type</span>
          {#if selectedTypes.length > 0}
            <button
              class="text-zinc-500 hover:text-violet-400 active:text-violet-300 text-sm md:text-base
                     transition-colors min-h-[44px] px-3"
              onclick={() => selectedTypes = []}
            >
              Clear
            </button>
          {/if}
        </div>
        <div class="flex flex-wrap gap-2.5">
          {#each availableTypes as type}
            <button
              class="px-4 py-2.5 md:px-5 md:py-3 bg-zinc-950 border border-zinc-700 rounded-lg
                     text-zinc-400 text-sm md:text-base transition-[background-color,border-color,transform] duration-200 hover:bg-zinc-800 hover:border-violet-500
                     active:scale-95"
              class:border-violet-500={selectedTypes.includes(type)}
              class:text-zinc-100={selectedTypes.includes(type)}
              class:font-semibold={selectedTypes.includes(type)}
              style:background-color={selectedTypes.includes(type) ? 'rgba(139, 92, 246, 0.2)' : ''}
              onclick={() => toggleType(type)}
            >
              {type}
            </button>
          {/each}
        </div>
      </div>

      <!-- Clear All Button -->
      {#if activeFilterCount > 0}
        <button
          class="w-full px-5 py-3.5 bg-zinc-800 border border-zinc-700 rounded-lg
                 text-zinc-100 hover:bg-zinc-700 hover:border-violet-500 active:scale-[0.98]
                 transition-[background-color,border-color,transform] duration-200 text-base md:text-lg font-medium"
          onclick={clearAllFilters}
        >
          Clear All Filters
        </button>
      {/if}
    </div>
  {/if}
</div>
