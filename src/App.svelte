<script lang="ts">
  import { onMount } from 'svelte';
  import type { Item, ReferenceDetails } from './types';
  import { loadAllData } from './lib/dataLoader';
  import { buildReferenceCount, filterItemsByName } from './lib/searchUtils';

  let searchQuery = '';
  let items: Item[] = [];
  let referenceCounts = new Map<string, ReferenceDetails>();
  let loading = true;
  let error: string | null = null;
  let searchFocused = false;
  let searchInput: HTMLInputElement;

  // Reactive filtered items based on search query
  $: filteredItems = filterItemsByName(items, searchQuery);

  onMount(async () => {
    try {
      const data = await loadAllData();
      items = data.items;
      referenceCounts = buildReferenceCount(data.hideoutModules, data.projects);
      loading = false;

      // Only autofocus on desktop (screen width > 600px)
      if (window.innerWidth > 600 && searchInput) {
        searchInput.focus();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data';
      loading = false;
    }
  });

  function getReferenceDetails(itemId: string): ReferenceDetails {
    return referenceCounts.get(itemId) || { count: 0, sources: [] };
  }
</script>

<main>
  <header class:compact={searchFocused}>
    <h1>Arc Raiders Item Search</h1>
    <p class="subtitle">Search items and see their usage in hideout modules and projects</p>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading data from Arc Raiders database...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>Error: {error}</p>
      <p>Please try refreshing the page.</p>
    </div>
  {:else}
    <div class="search-container">
      <input
        type="text"
        bind:value={searchQuery}
        bind:this={searchInput}
        placeholder="Search items by name..."
        class="search-input"
        on:focus={() => searchFocused = true}
        on:blur={() => searchFocused = false}
      />
    </div>

    <div class="results-info">
      {#if searchQuery}
        Showing {filteredItems.length} of {items.length} items
      {:else}
        {items.length} items loaded
      {/if}
    </div>

    <div class="results-container">
      {#if filteredItems.length === 0}
        <div class="empty-state">
          {#if searchQuery}
            <p>No items found matching "{searchQuery}"</p>
          {:else}
            <p>Start typing to search for items</p>
          {/if}
        </div>
      {:else}
        <ul class="results-list">
          {#each filteredItems as item, index (index)}
            <li class="result-item">
              <div class="item-header">
                <div class="item-info">
                  <span class="item-name">{item.name}</span>
                  <span class="item-type">{item.type}</span>
                </div>
                <span class="reference-count" class:has-references={getReferenceDetails(item.id).count > 0}>
                  {getReferenceDetails(item.id).count}×
                </span>
              </div>
              {#if getReferenceDetails(item.id).count > 0}
                <div class="references">
                  {#each getReferenceDetails(item.id).sources as source}
                    <div class="reference-item">{source}</div>
                  {/each}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    background-color: #0a0a0a;
    color: #e0e0e0;
  }

  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100vh;
  }

  header {
    text-align: center;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: #888;
    margin: 0;
    font-size: 1rem;
  }

  .loading,
  .error {
    text-align: center;
    padding: 3rem 1rem;
  }

  .spinner {
    border: 3px solid #333;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    color: #ff6b6b;
  }

  .search-container {
    margin-bottom: 1rem;
    position: sticky;
    top: 0;
    background-color: #0a0a0a;
    padding: 1rem 0;
    z-index: 10;
  }

  .search-input {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    border: 2px solid #333;
    border-radius: 8px;
    background-color: #1a1a1a;
    color: #e0e0e0;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #667eea;
  }

  .search-input::placeholder {
    color: #666;
  }

  .results-info {
    color: #888;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .results-container {
    min-height: 200px;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #666;
  }

  .results-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .result-item {
    padding: 1rem;
    margin-bottom: 0.5rem;
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .result-item:hover {
    background-color: #222;
    border-color: #444;
    transform: translateX(4px);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: left;
    align-items: flex-start;
  }

  .item-name {
    font-size: 1.1rem;
    font-weight: 500;
    color: #e0e0e0;
    text-align: left;
  }

  .item-type {
    font-size: 0.85rem;
    color: #888;
    text-align: left;
  }

  .reference-count {
    padding: 0.4rem 0.8rem;
    background-color: #333;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #888;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .reference-count.has-references {
    background-color: #667eea22;
    color: #667eea;
    border: 1px solid #667eea44;
  }

  .references {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #333;
  }

  .reference-item {
    color: #aaa;
    font-size: 0.85rem;
    line-height: 1.8;
    padding: 0.15rem 0;
  }

  .reference-item::before {
    content: "→ ";
    color: #667eea;
    margin-right: 0.25rem;
  }

  @media (max-width: 600px) {
    main {
      padding: 1rem 0.75rem;
    }

    header {
      margin-bottom: 1rem;
      transition: all 0.3s ease;
    }

    header.compact {
      margin-bottom: 0.5rem;
    }

    h1 {
      font-size: 1.5rem;
      margin: 0 0 0.25rem 0;
      transition: all 0.3s ease;
    }

    header.compact h1 {
      font-size: 1.2rem;
      margin: 0;
    }

    .subtitle {
      font-size: 0.85rem;
      transition: all 0.3s ease;
    }

    header.compact .subtitle {
      display: none;
    }

    .search-container {
      padding: 0.5rem 0;
    }

    .item-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .reference-count {
      align-self: flex-start;
    }
  }
</style>
