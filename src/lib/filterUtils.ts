import type { Item, FilterOptions } from '../types';

/**
 * Extracts unique rarity values from items
 */
export function getUniqueRarities(items: Item[]): string[] {
  const rarities = new Set<string>();
  for (const item of items) {
    if (item.rarity) {
      rarities.add(item.rarity);
    }
  }
  return Array.from(rarities).sort();
}

/**
 * Extracts unique type values from items
 */
export function getUniqueTypes(items: Item[]): string[] {
  const types = new Set<string>();
  for (const item of items) {
    if (item.type) {
      types.add(item.type);
    }
  }
  return Array.from(types).sort();
}

/**
 * Filters items based on selected rarities and types
 * Empty filter arrays mean "no filter" (show all)
 */
export function applyFilters(items: Item[], filters: FilterOptions): Item[] {
  return items.filter(item => {
    // If rarity filters exist and item doesn't match, exclude it
    // Note: items without rarity are excluded when rarity filter is active
    if (filters.rarities.length > 0 && (!item.rarity || !filters.rarities.includes(item.rarity))) {
      return false;
    }

    // If type filters exist and item doesn't match, exclude it
    if (filters.types.length > 0 && !filters.types.includes(item.type)) {
      return false;
    }

    return true;
  });
}

/**
 * Gets the item image URL
 * If imageFilename is already a full URL, return it as-is
 * Otherwise, prepend the ArcTracker CDN base URL
 */
export function getItemImageUrl(imageFilename: string): string {
  // If it's already a full URL, return it
  if (imageFilename.startsWith('http://') || imageFilename.startsWith('https://')) {
    return imageFilename;
  }
  // Otherwise, prepend the CDN base URL
  const baseUrl = 'https://cdn.arctracker.io/items/';
  return `${baseUrl}${imageFilename}`;
}

/**
 * Gets the rarity color for styling
 */
export function getRarityColor(rarity: string): string {
  const rarityColors: Record<string, string> = {
    'Common': '#9ca3af',      // gray
    'Uncommon': '#22c55e',    // green
    'Rare': '#3b82f6',        // blue
    'Epic': '#a855f7',        // purple
    'Legendary': '#f59e0b',   // orange
    'Material': '#78716c',    // stone gray
  };

  return rarityColors[rarity] || '#9ca3af';
}

/**
 * Formats weight for display
 */
export function formatWeight(weightKg: number | undefined): string {
  if (weightKg === undefined || weightKg === null) return 'N/A';
  return weightKg < 1 ? `${(weightKg * 1000).toFixed(0)}g` : `${weightKg.toFixed(1)}kg`;
}

/**
 * Formats currency value for display
 */
export function formatValue(value: number | undefined): string {
  if (value === undefined || value === null) return 'N/A';
  return value.toLocaleString();
}
