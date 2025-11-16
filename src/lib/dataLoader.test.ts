import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  fetchItems,
  fetchHideoutModules,
  fetchProjects,
  fetchQuests,
  loadAllData
} from './dataLoader';
import type { Item, HideoutModule, Project, Quest } from '../types';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock data
const mockItem: Item = {
  id: 'item-1',
  name: { en: 'Test Item' },
  description: { en: 'Test Description' },
  type: 'Basic Material',
  rarity: 'Common',
  value: 100,
  weightKg: 1.5,
  stackSize: 100
};

const mockHideoutModule: HideoutModule = {
  id: 'module-1',
  name: { en: 'Test Module' },
  maxLevel: 3,
  levels: [
    {
      level: 1,
      requirementItemIds: [{ itemId: 'item-1', quantity: 5 }]
    }
  ]
};

const mockProject: Project = {
  id: 'project-1',
  name: { en: 'Test Project' },
  description: { en: 'Test Description' },
  phases: [
    {
      phase: 1,
      name: 'Phase 1',
      requirementItemIds: [{ itemId: 'item-1', quantity: 10 }]
    }
  ]
};

const mockQuest: Quest = {
  id: 'quest-1',
  name: { en: 'Test Quest' },
  description: { en: 'Test Description' },
  trader: 'Test Trader',
  objectives: [{ en: 'Complete objective' }],
  xp: 100,
  previousQuestIds: [],
  nextQuestIds: [],
  requiredItemIds: [{ itemId: 'item-1', quantity: 5 }]
};

describe('dataLoader', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Reset timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('fetchItems', () => {
    it('should fetch and validate items successfully', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockItem]
      });

      const items = await fetchItems();

      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(mockItem);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items.json')
      );
    });

    it('should cache fetched items', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockItem]
      });

      await fetchItems();

      // Second call should use cache
      const items = await fetchItems();

      expect(items).toHaveLength(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should invalidate cache after TTL expires', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockItem]
      });

      await fetchItems();

      // Advance time by more than cache duration (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      await fetchItems();

      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('should filter out invalid items and warn', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          mockItem,
          { id: 'invalid', name: 'Not an object' }, // Invalid
          { ...mockItem, id: 'item-2' }
        ]
      });

      const items = await fetchItems();

      expect(items).toHaveLength(2);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should throw error for non-array response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ not: 'an array' })
      });

      await expect(fetchItems()).rejects.toThrow('Invalid items data: expected an array');
    });

    it('should throw error when all items are invalid', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { invalid: 'item' },
          { another: 'invalid' }
        ]
      });

      await expect(fetchItems()).rejects.toThrow('No valid items found in response');
    });

    it('should retry on server error', async () => {
      vi.useRealTimers(); // Use real timers for retry logic

      let attemptCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          return { ok: false, status: 500, statusText: 'Internal Server Error' };
        }
        return { ok: true, json: async () => [mockItem] };
      });

      const items = await fetchItems();

      expect(items).toHaveLength(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should not retry on client error (4xx)', async () => {
      vi.useRealTimers(); // Use real timers
      sessionStorageMock.clear(); // Clear cache

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(fetchItems()).rejects.toThrow('Failed to fetch');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should use exponential backoff for retries', async () => {
      let attemptCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          return { ok: false, status: 500, statusText: 'Server Error' };
        }
        return { ok: true, json: async () => [mockItem] };
      });

      const promise = fetchItems();

      // First retry after 1 second
      await vi.advanceTimersByTimeAsync(1000);
      // Second retry after 2 seconds
      await vi.advanceTimersByTimeAsync(2000);

      const items = await promise;

      expect(items).toHaveLength(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      });

      const promise = fetchItems();

      // Advance through all retry delays
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(Math.pow(2, i) * 1000);
      }

      await expect(promise).rejects.toThrow();
      expect(globalThis.fetch).toHaveBeenCalledTimes(3); // Max retries
    });
  });

  describe('fetchHideoutModules', () => {
    it('should fetch and validate hideout modules', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockHideoutModule]
      });

      const modules = await fetchHideoutModules();

      expect(modules).toHaveLength(1);
      expect(modules[0]).toEqual(mockHideoutModule);
    });

    it('should cache hideout modules', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockHideoutModule]
      });

      await fetchHideoutModules();
      await fetchHideoutModules();

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('should filter out invalid modules', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          mockHideoutModule,
          { id: 'invalid' }, // Invalid
        ]
      });

      const modules = await fetchHideoutModules();

      expect(modules).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('fetchProjects', () => {
    it('should fetch and validate projects', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockProject]
      });

      const projects = await fetchProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(mockProject);
    });

    it('should handle projects with LocalizedString phase names', async () => {
      const projectWithLocalizedPhase: Project = {
        ...mockProject,
        phases: [
          {
            phase: 1,
            name: { en: 'English Phase', de: 'German Phase' },
            requirementItemIds: []
          }
        ]
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [projectWithLocalizedPhase]
      });

      const projects = await fetchProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0].phases[0].name).toHaveProperty('en');
    });
  });

  describe('fetchQuests', () => {
    it('should fetch and validate quests', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockQuest]
      });

      const quests = await fetchQuests();

      expect(quests).toHaveLength(1);
      expect(quests[0]).toEqual(mockQuest);
    });

    it('should validate quests without requiredItemIds', async () => {
      const questWithoutItems: Quest = {
        ...mockQuest,
        requiredItemIds: undefined
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [questWithoutItems]
      });

      const quests = await fetchQuests();

      expect(quests).toHaveLength(1);
      expect(quests[0].requiredItemIds).toBeUndefined();
    });

    it('should reject quests with invalid requiredItemIds', async () => {
      const invalidQuest = {
        ...mockQuest,
        requiredItemIds: [{ invalid: 'structure' }]
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [invalidQuest]
      });

      // Should throw an error when all quests are invalid
      await expect(fetchQuests()).rejects.toThrow('No valid quests found in response');
    });
  });

  describe('loadAllData', () => {
    it('should load all data in parallel', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        const urlStr = url.toString();
        if (urlStr.includes('items.json')) {
          return { ok: true, json: async () => [mockItem] };
        } else if (urlStr.includes('hideoutModules.json')) {
          return { ok: true, json: async () => [mockHideoutModule] };
        } else if (urlStr.includes('projects.json')) {
          return { ok: true, json: async () => [mockProject] };
        } else if (urlStr.includes('quests.json')) {
          return { ok: true, json: async () => [mockQuest] };
        }
        return { ok: false, status: 404 };
      });

      const data = await loadAllData();

      expect(data.items).toHaveLength(1);
      expect(data.hideoutModules).toHaveLength(1);
      expect(data.projects).toHaveLength(1);
      expect(data.quests).toHaveLength(1);
    });

    it('should throw error if any fetch fails', async () => {
      vi.useRealTimers(); // Use real timers for retry logic

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        const urlStr = url.toString();
        if (urlStr.includes('items.json')) {
          return { ok: false, status: 500, statusText: 'Server Error' };
        }
        return { ok: true, json: async () => [] };
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(loadAllData()).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading data:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    }, 10000);

    it('should use cached data when available', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        const urlStr = url.toString();
        if (urlStr.includes('items.json')) {
          return { ok: true, json: async () => [mockItem] };
        } else if (urlStr.includes('hideoutModules.json')) {
          return { ok: true, json: async () => [mockHideoutModule] };
        } else if (urlStr.includes('projects.json')) {
          return { ok: true, json: async () => [mockProject] };
        } else if (urlStr.includes('quests.json')) {
          return { ok: true, json: async () => [mockQuest] };
        }
        return { ok: false, status: 404 };
      });

      // First load
      await loadAllData();

      // Second load should use cache
      await loadAllData();

      // Should only be called once for each resource
      expect(globalThis.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('sessionStorage failures', () => {
    it('should handle sessionStorage write failures gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock sessionStorage.setItem to throw
      const originalSetItem = sessionStorageMock.setItem;
      sessionStorageMock.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockItem]
      });

      // Should not throw, just warn
      const items = await fetchItems();

      expect(items).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to cache data:', expect.any(Error));

      consoleWarnSpy.mockRestore();
      sessionStorageMock.setItem = originalSetItem;
    });

    it('should handle sessionStorage read failures gracefully', async () => {
      // Mock sessionStorage.getItem to throw
      const originalGetItem = sessionStorageMock.getItem;
      sessionStorageMock.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockItem]
      });

      // Should fall back to fetching
      const items = await fetchItems();

      expect(items).toHaveLength(1);

      sessionStorageMock.getItem = originalGetItem;
    });
  });
});
