<script lang="ts">
  import { onMount, setContext } from "svelte";
  import Fuse from "fuse.js";
  import type {
    Item,
    ReferenceDetails,
    HideoutModule,
    Project,
    Quest,
  } from "./types";
  import { loadAllData } from "./lib/dataLoader";
  import { buildReferenceCount, filterItemsByName } from "./lib/searchUtils";
  import {
    getUniqueRarities,
    getUniqueTypes,
    applyFilters,
  } from "./lib/filterUtils";

  import LoadingState from "./components/LoadingState.svelte";
  import ErrorState from "./components/ErrorState.svelte";
  import EmptyState from "./components/EmptyState.svelte";
  import SearchBar from "./components/SearchBar.svelte";
  import FilterPanel from "./components/FilterPanel.svelte";
  import ResultsInfo from "./components/ResultsInfo.svelte";
  import ItemCard from "./components/item/ItemCard.svelte";
  import ScrollToTop from "./components/ScrollToTop.svelte";

  let searchQuery = $state("");
  let items = $state<Item[]>([]);
  let hideoutModules = $state<HideoutModule[]>([]);
  let projects = $state<Project[]>([]);
  let quests = $state<Quest[]>([]);
  let referenceCounts = $state(new Map<string, ReferenceDetails>());
  let loading = $state(true);
  let error = $state<string | null>(null);
  let searchFocused = $state(false);

  // Provide searchQuery via context to avoid prop drilling
  setContext("searchQuery", () => searchQuery);

  // Filter state
  let selectedRarities = $state<string[]>([]);
  let selectedTypes = $state<string[]>([]);
  let availableRarities = $state<string[]>([]);
  let availableTypes = $state<string[]>([]);

  // Reactive filtered items based on search query and filters (no debounce for now)
  let searchResults = $derived(
    filterItemsByName(items, searchQuery, hideoutModules, projects, quests)
  );
  let filteredItems = $derived(
    applyFilters(searchResults, {
      rarities: selectedRarities,
      types: selectedTypes,
    })
  );
  let hasActiveFilters = $derived(
    searchQuery.length > 0 ||
      selectedRarities.length > 0 ||
      selectedTypes.length > 0
  );

  let searchBarRef = $state<SearchBar>();

  onMount(async () => {
    try {
      const data = await loadAllData();
      items = data.items;
      hideoutModules = data.hideoutModules;
      projects = data.projects;
      quests = data.quests;
      referenceCounts = buildReferenceCount(
        data.hideoutModules,
        data.projects,
        data.quests
      );

      // Extract available filter options
      availableRarities = getUniqueRarities(items);
      availableTypes = getUniqueTypes(items);

      loading = false;

      // Only autofocus on desktop (screen width > 640px)
      if (window.innerWidth > 640 && searchBarRef) {
        searchBarRef.focus();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load data";
      loading = false;
    }
  });

  function getReferenceDetails(itemId: string): ReferenceDetails {
    return (
      referenceCounts.get(itemId) || {
        count: 0,
        sources: [],
        totalQuantity: 0,
        quantityBySource: {},
      }
    );
  }
</script>

<main class="w-full min-h-screen bg-zinc-950 text-zinc-100">
  <!-- Header -->
  <header
    class="text-center mb-8 pt-8 px-4 transition-[margin,padding] duration-200 ease-out"
    class:mb-4={searchFocused}
    class:pt-4={searchFocused}
  >
    <h1
      class="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent transition-[font-size,margin] duration-200 ease-out"
      class:text-xl={searchFocused}
      class:md:text-2xl={searchFocused}
      class:lg:text-3xl={searchFocused}
      class:mb-0={searchFocused}
    >
      Arc Raiders Item Search v2
    </h1>
    <p
      class="text-zinc-500 text-base md:text-lg transition-[opacity,height] duration-200 ease-out"
      class:opacity-0={searchFocused}
      class:h-0={searchFocused}
      class:overflow-hidden={searchFocused}
    >
      Search items and see their usage in hideout modules and projects
    </p>
  </header>

  <!-- Main Container -->
  <div class="max-w-4xl mx-auto px-4 md:px-6 pb-12">
    {#if loading}
      <LoadingState />
    {:else if error}
      <ErrorState {error} />
    {:else}
      <SearchBar
        bind:value={searchQuery}
        bind:focused={searchFocused}
        bind:this={searchBarRef}
      />

      <FilterPanel
        {availableRarities}
        {availableTypes}
        bind:selectedRarities
        bind:selectedTypes
      />

      <ResultsInfo
        filteredCount={filteredItems.length}
        totalCount={items.length}
        {hasActiveFilters}
      />

      <div class="min-h-[200px]">
        {#if filteredItems.length === 0}
          <EmptyState {searchQuery} />
        {:else}
          <ul class="list-none p-0 m-0">
            {#each filteredItems as item (item.id)}
              <ItemCard
                {item}
                referenceDetails={getReferenceDetails(item.id)}
              />
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Footer -->
      <footer class="mt-12 pt-8 border-t border-zinc-800 text-center space-y-4">
        <div>
          <a
            href="https://github.com/Soph/arcr-item-search"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block text-zinc-500 hover:text-violet-400 active:text-violet-300
                   transition-colors text-base md:text-lg py-2 px-4"
          >
            View on GitHub
          </a>
        </div>
        <div class="text-zinc-600 text-sm md:text-base">
          <a
            target="_blank"
            href="https://icons8.com/icon/82787/external-link"
            class="hover:text-zinc-400 active:text-zinc-300 transition-colors"
            >External Link</a
          >
          icon by
          <a
            target="_blank"
            href="https://icons8.com"
            class="hover:text-zinc-400 active:text-zinc-300 transition-colors"
            >Icons8</a
          >
        </div>
      </footer>
    {/if}
  </div>

  <!-- Scroll to Top Button -->
  <ScrollToTop />
</main>
