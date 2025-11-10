<script lang="ts">
  import type { Item } from '../../types';

  let { item, expanded = $bindable(false) }: {
    item: Item;
    expanded: boolean;
  } = $props();

  function hasExpandableDetails(): boolean {
    if (item.effects && Object.keys(item.effects).length > 0) return true;
    if (item.recipe && Object.keys(item.recipe).length > 0) return true;
    if (item.recyclesInto && Object.keys(item.recyclesInto).length > 0) return true;
    if (item.salvagesInto && Object.keys(item.salvagesInto).length > 0) return true;
    return false;
  }
</script>

{#if hasExpandableDetails()}
  <button
    class="w-full mt-4 px-4 py-3 md:px-5 md:py-3.5 bg-zinc-950 border border-zinc-800 rounded-lg
           text-zinc-400 text-sm md:text-base hover:bg-zinc-900 hover:border-zinc-700
           active:scale-[0.98] transition-[background-color,border-color,transform] duration-200 flex items-center justify-center gap-2 font-medium"
    onclick={() => expanded = !expanded}
  >
    <span class="text-violet-500">{expanded ? '▼' : '▶'}</span>
    <span>{expanded ? 'Hide' : 'Show'} Details</span>
  </button>

  {#if expanded}
    <div class="mt-4 p-5 md:p-6 bg-zinc-950 border border-zinc-800 rounded-lg space-y-5">
      <!-- Effects -->
      {#if item.effects && Object.keys(item.effects).length > 0}
        <div>
          <h4 class="text-violet-400 font-semibold text-base md:text-lg mb-3">Effects</h4>
          <ul class="space-y-2">
            {#each Object.entries(item.effects) as [key, value]}
              <li class="text-sm md:text-base text-zinc-400 py-2 border-b border-zinc-900 last:border-0">
                <strong class="text-zinc-100">
                  {typeof value === 'object' && value?.en ? value.en : key}:
                </strong>
                <span class="ml-2">
                  {typeof value === 'object' && value?.value ? value.value : JSON.stringify(value)}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Crafting Recipe -->
      {#if item.recipe && Object.keys(item.recipe).length > 0}
        <div>
          <h4 class="text-violet-400 font-semibold text-base md:text-lg mb-3">Crafting Recipe</h4>
          {#if item.craftBench}
            <p class="text-sm md:text-base text-zinc-500 mb-3">🔨 Requires: {item.craftBench}</p>
          {/if}
          <ul class="space-y-2">
            {#each Object.entries(item.recipe) as [itemId, quantity]}
              <li class="text-sm md:text-base text-zinc-400 py-2 border-b border-zinc-900 last:border-0">
                {quantity}× {itemId}
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Recycles Into -->
      {#if item.recyclesInto && Object.keys(item.recyclesInto).length > 0}
        <div>
          <h4 class="text-violet-400 font-semibold text-base md:text-lg mb-3">Recycles Into</h4>
          <ul class="space-y-2">
            {#each Object.entries(item.recyclesInto) as [itemId, quantity]}
              <li class="text-sm md:text-base text-zinc-400 py-2 border-b border-zinc-900 last:border-0">
                {quantity}× {itemId}
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Salvages Into -->
      {#if item.salvagesInto && Object.keys(item.salvagesInto).length > 0}
        <div>
          <h4 class="text-violet-400 font-semibold text-base md:text-lg mb-3">Salvages Into</h4>
          <ul class="space-y-2">
            {#each Object.entries(item.salvagesInto) as [itemId, quantity]}
              <li class="text-sm md:text-base text-zinc-400 py-2 border-b border-zinc-900 last:border-0">
                {quantity}× {itemId}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {/if}
{/if}
