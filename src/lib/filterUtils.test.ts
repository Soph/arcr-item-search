import { describe, it, expect } from 'vitest';
import {
  getUniqueRarities,
  getUniqueTypes,
  applyFilters,
  getItemImageUrl,
  getRarityColor,
  formatWeight,
  formatValue
} from './filterUtils';
import type { Item, FilterOptions } from '../types';

// Helper to create mock items
const createMockItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'test-id',
  name: { en: 'Test Item' },
  description: { en: 'Test Description' },
  type: 'Basic Material',
  rarity: 'Common',
  value: 100,
  weightKg: 1.5,
  stackSize: 100,
  imageFilename: 'test.png',
  ...overrides
});

describe('filterUtils', () => {
  describe('getUniqueRarities', () => {
    it('should extract unique rarity values', () => {
      const items = [
        createMockItem({ rarity: 'Common' }),
        createMockItem({ rarity: 'Rare' }),
        createMockItem({ rarity: 'Common' }),
        createMockItem({ rarity: 'Epic' }),
      ];

      const result = getUniqueRarities(items);
      expect(result).toEqual(['Common', 'Epic', 'Rare']);
    });

    it('should return empty array for empty items', () => {
      expect(getUniqueRarities([])).toEqual([]);
    });

    it('should sort rarities alphabetically', () => {
      const items = [
        createMockItem({ rarity: 'Rare' }),
        createMockItem({ rarity: 'Common' }),
        createMockItem({ rarity: 'Epic' }),
      ];

      const result = getUniqueRarities(items);
      expect(result).toEqual(['Common', 'Epic', 'Rare']);
    });
  });

  describe('getUniqueTypes', () => {
    it('should extract unique type values', () => {
      const items = [
        createMockItem({ type: 'Basic Material' }),
        createMockItem({ type: 'Medical' }),
        createMockItem({ type: 'Basic Material' }),
        createMockItem({ type: 'Tool' }),
      ];

      const result = getUniqueTypes(items);
      expect(result).toEqual(['Basic Material', 'Medical', 'Tool']);
    });

    it('should return empty array for empty items', () => {
      expect(getUniqueTypes([])).toEqual([]);
    });
  });

  describe('applyFilters', () => {
    const items = [
      createMockItem({ id: '1', rarity: 'Common', type: 'Basic Material' }),
      createMockItem({ id: '2', rarity: 'Rare', type: 'Medical' }),
      createMockItem({ id: '3', rarity: 'Common', type: 'Tool' }),
      createMockItem({ id: '4', rarity: 'Epic', type: 'Medical' }),
    ];

    it('should return all items when no filters applied', () => {
      const filters: FilterOptions = { rarities: [], types: [] };
      const result = applyFilters(items, filters);
      expect(result).toHaveLength(4);
    });

    it('should filter by rarity', () => {
      const filters: FilterOptions = { rarities: ['Common'], types: [] };
      const result = applyFilters(items, filters);
      expect(result).toHaveLength(2);
      expect(result.every(item => item.rarity === 'Common')).toBe(true);
    });

    it('should filter by type', () => {
      const filters: FilterOptions = { rarities: [], types: ['Medical'] };
      const result = applyFilters(items, filters);
      expect(result).toHaveLength(2);
      expect(result.every(item => item.type === 'Medical')).toBe(true);
    });

    it('should filter by both rarity and type', () => {
      const filters: FilterOptions = { rarities: ['Rare', 'Epic'], types: ['Medical'] };
      const result = applyFilters(items, filters);
      expect(result).toHaveLength(2);
      expect(result.every(item => item.type === 'Medical')).toBe(true);
      expect(result.every(item => item.rarity && ['Rare', 'Epic'].includes(item.rarity))).toBe(true);
    });

    it('should return empty array when no items match', () => {
      const filters: FilterOptions = { rarities: ['Legendary'], types: [] };
      const result = applyFilters(items, filters);
      expect(result).toHaveLength(0);
    });
  });

  describe('getItemImageUrl', () => {
    it('should construct correct image URL from filename', () => {
      const result = getItemImageUrl('fabric.png');
      expect(result).toBe('https://cdn.arctracker.io/items/fabric.png');
    });

    it('should return full URL as-is if already provided', () => {
      const fullUrl = 'https://cdn.arctracker.io/items/fabric.png';
      const result = getItemImageUrl(fullUrl);
      expect(result).toBe(fullUrl);
    });

    it('should handle http URLs', () => {
      const httpUrl = 'http://example.com/item.png';
      const result = getItemImageUrl(httpUrl);
      expect(result).toBe(httpUrl);
    });
  });

  describe('getRarityColor', () => {
    it('should return correct colors for known rarities', () => {
      expect(getRarityColor('Common')).toBe('#9ca3af');
      expect(getRarityColor('Uncommon')).toBe('#22c55e');
      expect(getRarityColor('Rare')).toBe('#3b82f6');
      expect(getRarityColor('Epic')).toBe('#a855f7');
      expect(getRarityColor('Legendary')).toBe('#f59e0b');
      expect(getRarityColor('Material')).toBe('#78716c');
    });

    it('should return default color for unknown rarity', () => {
      expect(getRarityColor('Unknown')).toBe('#9ca3af');
    });
  });

  describe('formatWeight', () => {
    it('should format weights less than 1kg as grams', () => {
      expect(formatWeight(0.5)).toBe('500g');
      expect(formatWeight(0.025)).toBe('25g');
    });

    it('should format weights >= 1kg as kilograms', () => {
      expect(formatWeight(1.5)).toBe('1.5kg');
      expect(formatWeight(10.24)).toBe('10.2kg');
    });

    it('should handle undefined or null values', () => {
      expect(formatWeight(undefined)).toBe('N/A');
      expect(formatWeight(null as any)).toBe('N/A');
    });
  });

  describe('formatValue', () => {
    it('should format values with locale separators', () => {
      expect(formatValue(1000)).toBe('1,000');
      expect(formatValue(1000000)).toBe('1,000,000');
    });

    it('should format small values correctly', () => {
      expect(formatValue(50)).toBe('50');
    });

    it('should handle undefined or null values', () => {
      expect(formatValue(undefined)).toBe('N/A');
      expect(formatValue(null as any)).toBe('N/A');
    });
  });
});
