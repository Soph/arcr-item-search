import { describe, it, expect, vi } from 'vitest';
import {
  buildReferenceCount,
  findItemsRequiredBySource,
  filterItemsByName
} from './searchUtils';
import type { Item, HideoutModule, Project, Quest } from '../types';

// Mock Fuse.js to make tests deterministic
vi.mock('fuse.js', () => {
  return {
    default: class MockFuse {
      private items: any[];

      constructor(items: any[]) {
        this.items = items;
      }

      search(query: string) {
        const lowerQuery = query.toLowerCase();
        return this.items
          .filter(item => {
            const nameEn = item.name?.en?.toLowerCase() || '';
            const descEn = item.description?.en?.toLowerCase() || '';
            return nameEn.includes(lowerQuery) || descEn.includes(lowerQuery);
          })
          .map(item => ({ item, score: 0 }));
      }
    }
  };
});

// Helper to create mock items
const createMockItem = (overrides: Partial<Item> = {}): Item => ({
  id: overrides.id || 'item-1',
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

// Helper to create mock hideout modules
const createMockHideoutModule = (overrides: Partial<HideoutModule> = {}): HideoutModule => ({
  id: 'module-1',
  name: { en: 'Test Module' },
  maxLevel: 3,
  levels: [
    {
      level: 1,
      requirementItemIds: [{ itemId: 'item-1', quantity: 5 }]
    }
  ],
  ...overrides
});

// Helper to create mock projects
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: { en: 'Test Project' },
  description: { en: 'Test Project Description' },
  phases: [
    {
      phase: 1,
      name: 'Phase 1',
      requirementItemIds: [{ itemId: 'item-1', quantity: 10 }]
    }
  ],
  ...overrides
});

// Helper to create mock quests
const createMockQuest = (overrides: Partial<Quest> = {}): Quest => ({
  id: 'quest-1',
  name: { en: 'Test Quest' },
  description: { en: 'Test Quest Description' },
  trader: 'Test Trader',
  objectives: [{ en: 'Complete objective' }],
  xp: 100,
  previousQuestIds: [],
  nextQuestIds: [],
  ...overrides
});

describe('searchUtils', () => {
  describe('buildReferenceCount', () => {
    it('should count hideout module references correctly', () => {
      const modules = [
        createMockHideoutModule({
          name: { en: 'Storage' },
          levels: [
            { level: 1, requirementItemIds: [{ itemId: 'item-1', quantity: 5 }] },
            { level: 2, requirementItemIds: [{ itemId: 'item-1', quantity: 10 }] }
          ]
        })
      ];

      const referenceMap = buildReferenceCount(modules, [], []);

      expect(referenceMap.has('item-1')).toBe(true);
      const ref = referenceMap.get('item-1')!;
      expect(ref.count).toBe(2);
      expect(ref.totalQuantity).toBe(15);
      expect(ref.sources).toContain('Storage (Level 1)');
      expect(ref.sources).toContain('Storage (Level 2)');
      expect(ref.quantityBySource['Storage (Level 1)']).toBe(5);
      expect(ref.quantityBySource['Storage (Level 2)']).toBe(10);
    });

    it('should count project phase references correctly', () => {
      const projects = [
        createMockProject({
          name: { en: 'Build Base' },
          phases: [
            {
              phase: 1,
              name: 'Foundation',
              requirementItemIds: [{ itemId: 'item-2', quantity: 20 }]
            },
            {
              phase: 2,
              name: { en: 'Walls' },
              requirementItemIds: [{ itemId: 'item-2', quantity: 30 }]
            }
          ]
        })
      ];

      const referenceMap = buildReferenceCount([], projects, []);

      expect(referenceMap.has('item-2')).toBe(true);
      const ref = referenceMap.get('item-2')!;
      expect(ref.count).toBe(2);
      expect(ref.totalQuantity).toBe(50);
      expect(ref.sources).toContain('Build Base (Foundation)');
      expect(ref.sources).toContain('Build Base (Walls)');
    });

    it('should count quest references correctly', () => {
      const quests = [
        createMockQuest({
          name: { en: 'Find Materials' },
          requiredItemIds: [
            { itemId: 'item-3', quantity: 15 }
          ]
        })
      ];

      const referenceMap = buildReferenceCount([], [], quests);

      expect(referenceMap.has('item-3')).toBe(true);
      const ref = referenceMap.get('item-3')!;
      expect(ref.count).toBe(1);
      expect(ref.totalQuantity).toBe(15);
      expect(ref.sources).toContain('Find Materials (Quest)');
    });

    it('should handle quests without requiredItemIds gracefully', () => {
      const quests = [createMockQuest({ requiredItemIds: undefined })];
      const referenceMap = buildReferenceCount([], [], quests);
      expect(referenceMap.size).toBe(0);
    });

    it('should aggregate references from multiple sources', () => {
      const modules = [
        createMockHideoutModule({
          levels: [{ level: 1, requirementItemIds: [{ itemId: 'item-1', quantity: 5 }] }]
        })
      ];

      const projects = [
        createMockProject({
          phases: [
            { phase: 1, name: 'Phase 1', requirementItemIds: [{ itemId: 'item-1', quantity: 10 }] }
          ]
        })
      ];

      const quests = [
        createMockQuest({
          requiredItemIds: [{ itemId: 'item-1', quantity: 3 }]
        })
      ];

      const referenceMap = buildReferenceCount(modules, projects, quests);

      expect(referenceMap.has('item-1')).toBe(true);
      const ref = referenceMap.get('item-1')!;
      expect(ref.count).toBe(3);
      expect(ref.totalQuantity).toBe(18);
      expect(ref.sources).toHaveLength(3);
    });

    it('should return empty map for empty input', () => {
      const referenceMap = buildReferenceCount([], [], []);
      expect(referenceMap.size).toBe(0);
    });
  });

  describe('findItemsRequiredBySource', () => {
    it('should find items required by matching hideout modules', () => {
      const modules = [
        createMockHideoutModule({
          name: { en: 'Storage Unit' },
          levels: [{ level: 1, requirementItemIds: [{ itemId: 'item-1', quantity: 5 }] }]
        })
      ];

      const itemIds = findItemsRequiredBySource(modules, [], [], 'storage');

      expect(itemIds.has('item-1')).toBe(true);
      expect(itemIds.size).toBe(1);
    });

    it('should find items required by matching projects', () => {
      const projects = [
        createMockProject({
          name: { en: 'Defense System' },
          phases: [
            { phase: 1, name: 'Setup', requirementItemIds: [{ itemId: 'item-2', quantity: 10 }] }
          ]
        })
      ];

      const itemIds = findItemsRequiredBySource([], projects, [], 'defense');

      expect(itemIds.has('item-2')).toBe(true);
    });

    it('should find items required by matching phase names', () => {
      const projects = [
        createMockProject({
          name: { en: 'Base Project' },
          phases: [
            { phase: 1, name: 'Foundation Work', requirementItemIds: [{ itemId: 'item-3', quantity: 10 }] },
            { phase: 2, name: 'Roofing', requirementItemIds: [{ itemId: 'item-4', quantity: 5 }] }
          ]
        })
      ];

      const itemIds = findItemsRequiredBySource([], projects, [], 'foundation');

      expect(itemIds.has('item-3')).toBe(true);
      expect(itemIds.has('item-4')).toBe(false);
    });

    it('should find items required by matching quests', () => {
      const quests = [
        createMockQuest({
          name: { en: 'Scavenger Hunt' },
          requiredItemIds: [{ itemId: 'item-5', quantity: 20 }]
        })
      ];

      const itemIds = findItemsRequiredBySource([], [], quests, 'scavenger');

      expect(itemIds.has('item-5')).toBe(true);
    });

    it('should handle quests without requiredItemIds', () => {
      const quests = [
        createMockQuest({
          name: { en: 'No Items Quest' },
          requiredItemIds: undefined
        })
      ];

      const itemIds = findItemsRequiredBySource([], [], quests, 'no items');

      expect(itemIds.size).toBe(0);
    });

    it('should return empty set for non-matching query', () => {
      const modules = [createMockHideoutModule({ name: { en: 'Storage' } })];
      const itemIds = findItemsRequiredBySource(modules, [], [], 'nonexistent');

      expect(itemIds.size).toBe(0);
    });

    it('should deduplicate item IDs across multiple sources', () => {
      const modules = [
        createMockHideoutModule({
          name: { en: 'Workshop Alpha' },
          levels: [{ level: 1, requirementItemIds: [{ itemId: 'item-1', quantity: 5 }] }]
        })
      ];

      const projects = [
        createMockProject({
          name: { en: 'Workshop Beta' },
          phases: [
            { phase: 1, name: 'Setup', requirementItemIds: [{ itemId: 'item-1', quantity: 10 }] }
          ]
        })
      ];

      const itemIds = findItemsRequiredBySource(modules, projects, [], 'workshop');

      expect(itemIds.has('item-1')).toBe(true);
      expect(itemIds.size).toBe(1);
    });
  });

  describe('filterItemsByName', () => {
    it('should return all items when search query is empty', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Iron' } }),
        createMockItem({ id: 'item-2', name: { en: 'Steel' } })
      ];

      const result = filterItemsByName(items, '');

      expect(result).toHaveLength(2);
      expect(result).toEqual(items);
    });

    it('should return all items when search query is whitespace', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Iron' } }),
        createMockItem({ id: 'item-2', name: { en: 'Steel' } })
      ];

      const result = filterItemsByName(items, '   ');

      expect(result).toHaveLength(2);
    });

    it('should filter items by name match', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Iron Ore' } }),
        createMockItem({ id: 'item-2', name: { en: 'Steel Bar' } }),
        createMockItem({ id: 'item-3', name: { en: 'Iron Bar' } })
      ];

      const result = filterItemsByName(items, 'iron');

      expect(result).toHaveLength(2);
      expect(result.map(i => i.id)).toContain('item-1');
      expect(result.map(i => i.id)).toContain('item-3');
    });

    it('should filter items by description match', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Tool' }, description: { en: 'Made of iron' } }),
        createMockItem({ id: 'item-2', name: { en: 'Weapon' }, description: { en: 'Made of steel' } })
      ];

      const result = filterItemsByName(items, 'iron');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-1');
    });

    it('should deduplicate items with same ID', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Iron' } }),
        createMockItem({ id: 'item-1', name: { en: 'Iron' } }), // Duplicate
        createMockItem({ id: 'item-2', name: { en: 'Iron Ore' } })
      ];

      const result = filterItemsByName(items, 'iron');

      expect(result).toHaveLength(2);
      const ids = result.map(i => i.id);
      expect(ids.filter(id => id === 'item-1')).toHaveLength(1);
    });

    it('should include items required by matching sources', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Screw' } }),
        createMockItem({ id: 'item-2', name: { en: 'Bolt' } })
      ];

      const modules = [
        createMockHideoutModule({
          name: { en: 'Workshop' },
          levels: [{ level: 1, requirementItemIds: [{ itemId: 'item-2', quantity: 5 }] }]
        })
      ];

      const result = filterItemsByName(items, 'workshop', modules, [], []);

      expect(result.map(i => i.id)).toContain('item-2');
    });

    it('should prioritize name matches over source matches', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Storage Box' } }),
        createMockItem({ id: 'item-2', name: { en: 'Random Item' } })
      ];

      const modules = [
        createMockHideoutModule({
          name: { en: 'Storage Unit' },
          levels: [{ level: 1, requirementItemIds: [{ itemId: 'item-2', quantity: 5 }] }]
        })
      ];

      const result = filterItemsByName(items, 'storage', modules, [], []);

      // item-1 should come first because it matches by name
      expect(result[0].id).toBe('item-1');
      expect(result[1].id).toBe('item-2');
    });

    it('should not duplicate items that match both name and source', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Storage Box' } })
      ];

      const modules = [
        createMockHideoutModule({
          name: { en: 'Storage Unit' },
          levels: [{ level: 1, requirementItemIds: [{ itemId: 'item-1', quantity: 5 }] }]
        })
      ];

      const result = filterItemsByName(items, 'storage', modules, [], []);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-1');
    });

    it('should work without optional parameters', () => {
      const items = [
        createMockItem({ id: 'item-1', name: { en: 'Iron' } }),
        createMockItem({ id: 'item-2', name: { en: 'Steel' } })
      ];

      const result = filterItemsByName(items, 'iron');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-1');
    });
  });
});
