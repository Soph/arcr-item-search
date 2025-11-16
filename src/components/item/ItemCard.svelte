<script lang="ts">
  import type { Item, ReferenceDetails } from '../../types';
  import ItemHeader from './ItemHeader.svelte';
  import ItemReferences from './ItemReferences.svelte';
  import ItemDetails from './ItemDetails.svelte';

  let { item, referenceDetails }: {
    item: Item;
    referenceDetails: ReferenceDetails;
  } = $props();

  let expanded = $state(false);
</script>

<li class="p-5 md:p-6 mb-3 md:mb-4 bg-zinc-900 border border-zinc-800 rounded-lg
           hover:bg-zinc-800/80 hover:border-zinc-700 transition-[background-color,border-color] duration-200">
  <ItemHeader {item} {referenceDetails} />
  <ItemReferences {referenceDetails} />
  <ItemDetails {item} bind:expanded />
</li>
