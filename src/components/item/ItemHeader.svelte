<script lang="ts">
  import { getRarityColor, getItemImageUrl } from '../../lib/filterUtils';
  import type { Item, ReferenceDetails } from '../../types';
  import ItemStats from './ItemStats.svelte';

  let { item, referenceDetails }: {
    item: Item;
    referenceDetails: ReferenceDetails;
  } = $props();
</script>

<div class="flex flex-col md:flex-row gap-3 md:gap-4">
  <!-- Item Image -->
  {#if item.imageFilename}
    <img
      src={getItemImageUrl(item.imageFilename)}
      alt={item.name.en}
      class="w-20 h-20 md:w-24 md:h-24 object-contain flex-shrink-0 bg-zinc-950 border border-zinc-800 rounded-lg p-2"
      loading="lazy"
    />
  {/if}

  <!-- Item Content -->
  <div class="flex-1 min-w-0">
    <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-4">
      <!-- Item Info -->
      <div class="flex-1 min-w-0">
        <!-- Name Row -->
        <div class="flex flex-wrap items-center gap-2 mb-1.5">
          <span class="text-lg md:text-xl font-semibold text-zinc-100">{item.name.en}</span>
          <span
            class="px-2.5 py-1 md:px-3 md:py-1.5 rounded-md text-xs md:text-sm font-semibold uppercase tracking-wide border"
            style:background-color="{getRarityColor(item.rarity || item.type)}22"
            style:color={getRarityColor(item.rarity || item.type)}
            style:border-color="{getRarityColor(item.rarity || item.type)}44"
          >
            {item.rarity || item.type}
          </span>
          <a
            href="https://arctracker.io/items/{item.id}"
            target="_blank"
            rel="noopener noreferrer"
            class="text-zinc-500 hover:text-violet-400 active:text-violet-300 transition-colors flex-shrink-0 p-2 -m-2"
            title="View on ArcTracker"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>

        <!-- Type -->
        <span class="text-sm md:text-base text-zinc-500 block mb-2.5">{item.type}</span>

        <!-- Stats -->
        <ItemStats value={item.value} weightKg={item.weightKg} stackSize={item.stackSize} />

        <!-- Found In -->
        {#if item.foundIn}
          <div class="mt-2.5 text-sm md:text-base text-zinc-400 flex flex-wrap items-start gap-1">
            <span class="font-semibold">📍 Found in:</span>
            <span class="text-violet-400">{item.foundIn}</span>
          </div>
        {/if}
      </div>

      <!-- Reference Stats -->
      <div class="flex gap-2.5 md:flex-col md:items-end flex-shrink-0">
        <span
          class="px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-semibold whitespace-nowrap"
          class:bg-zinc-800={referenceDetails.count === 0}
          class:text-zinc-500={referenceDetails.count === 0}
          class:text-violet-400={referenceDetails.count > 0}
          class:border={referenceDetails.count > 0}
          style:background-color={referenceDetails.count > 0 ? 'rgba(139, 92, 246, 0.2)' : ''}
          style:border-color={referenceDetails.count > 0 ? 'rgba(139, 92, 246, 0.4)' : ''}
        >
          {referenceDetails.count}×
        </span>
        {#if referenceDetails.totalQuantity > 0}
          <span
            class="px-4 py-2 md:px-5 md:py-2.5 border rounded-lg text-emerald-400 text-sm md:text-base font-medium whitespace-nowrap"
            style:background-color="rgba(16, 185, 129, 0.2)"
            style:border-color="rgba(16, 185, 129, 0.4)"
          >
            {referenceDetails.totalQuantity} needed
          </span>
        {/if}
      </div>
    </div>
  </div>
</div>
