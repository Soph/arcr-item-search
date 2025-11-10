import type { HideoutModule, Item, Project, Quest, ReferenceDetails } from '../types';
import Fuse from 'fuse.js';

// Cache Fuse instances to avoid recreating them on every search
let cachedItemsFuse: Fuse<Item> | null = null;
let cachedModulesFuse: Fuse<HideoutModule> | null = null;
let cachedProjectsFuse: Fuse<Project> | null = null;
let cachedQuestsFuse: Fuse<Quest> | null = null;
let cachedItemsArray: Item[] | null = null;
let cachedModulesArray: HideoutModule[] | null = null;
let cachedProjectsArray: Project[] | null = null;
let cachedQuestsArray: Quest[] | null = null;

/**
 * Builds a map of item IDs to their reference details (count and source names)
 */
export function buildReferenceCount(
  hideoutModules: HideoutModule[],
  projects: Project[],
  quests: Quest[]
): Map<string, ReferenceDetails> {
  const referenceMap = new Map<string, ReferenceDetails>();

  // Track references in hideout modules
  for (const module of hideoutModules) {
    for (const level of module.levels) {
      for (const requirement of level.requirementItemIds) {
        const current = referenceMap.get(requirement.itemId) || { 
          count: 0, 
          sources: [], 
          totalQuantity: 0, 
          quantityBySource: {} 
        };
        const sourceName = `${module.name.en} (Level ${level.level})`;

        referenceMap.set(requirement.itemId, {
          count: current.count + 1,
          sources: [...current.sources, sourceName],
          totalQuantity: current.totalQuantity + requirement.quantity,
          quantityBySource: {
            ...current.quantityBySource,
            [sourceName]: requirement.quantity
          }
        });
      }
    }
  }

  // Track references in projects
  for (const project of projects) {
    for (const phase of project.phases) {
      for (const requirement of phase.requirementItemIds) {
        const current = referenceMap.get(requirement.itemId) || {
          count: 0,
          sources: [],
          totalQuantity: 0,
          quantityBySource: {}
        };
        // Handle phase.name as either string or LocalizedString object
        const phaseName = typeof phase.name === 'string' ? phase.name : phase.name.en;
        const sourceName = `${project.name.en} (${phaseName})`;

        referenceMap.set(requirement.itemId, {
          count: current.count + 1,
          sources: [...current.sources, sourceName],
          totalQuantity: current.totalQuantity + requirement.quantity,
          quantityBySource: {
            ...current.quantityBySource,
            [sourceName]: requirement.quantity
          }
        });
      }
    }
  }

  // Track quest requirements
  for (const quest of quests) {
    if (!quest.requiredItemIds) continue;

    for (const requirement of quest.requiredItemIds) {
      const current = referenceMap.get(requirement.itemId) || {
        count: 0,
        sources: [],
        totalQuantity: 0,
        quantityBySource: {}
      };
      const sourceName = `${quest.name.en} (Quest)`;

      referenceMap.set(requirement.itemId, {
        count: current.count + 1,
        sources: [...current.sources, sourceName],
        totalQuantity: current.totalQuantity + requirement.quantity,
        quantityBySource: {
          ...current.quantityBySource,
          [sourceName]: requirement.quantity
        }
      });
    }
  }

  return referenceMap;
}

/**
 * Finds item IDs required by modules/projects/quests matching the search query
 */
export function findItemsRequiredBySource(
  hideoutModules: HideoutModule[],
  projects: Project[],
  quests: Quest[],
  searchQuery: string
): Set<string> {
  const itemIds = new Set<string>();

  // Configure Fuse options for fuzzy searching
  const fuseOptions = {
    keys: ['name.en'],
    threshold: 0.4,
    includeScore: true
  };

  // Search hideout modules (use cached Fuse instance if available)
  if (cachedModulesArray !== hideoutModules) {
    cachedModulesFuse = new Fuse(hideoutModules, fuseOptions);
    cachedModulesArray = hideoutModules;
  }
  const moduleResults = cachedModulesFuse!.search(searchQuery);

  for (const result of moduleResults) {
    for (const level of result.item.levels) {
      for (const requirement of level.requirementItemIds) {
        itemIds.add(requirement.itemId);
      }
    }
  }

  // Search projects (use cached Fuse instance if available)
  if (cachedProjectsArray !== projects) {
    cachedProjectsFuse = new Fuse(projects, fuseOptions);
    cachedProjectsArray = projects;
  }
  const projectResults = cachedProjectsFuse!.search(searchQuery);

  for (const result of projectResults) {
    for (const phase of result.item.phases) {
      for (const requirement of phase.requirementItemIds) {
        itemIds.add(requirement.itemId);
      }
    }
  }

  // Also search phase names within projects (optimized: single Fuse instance)
  const allPhases = projects.flatMap(project =>
    project.phases.map(phase => ({
      name: { en: typeof phase.name === 'string' ? phase.name : phase.name.en },
      requirementItemIds: phase.requirementItemIds
    }))
  );

  if (allPhases.length > 0) {
    const phaseFuse = new Fuse(allPhases, fuseOptions);
    const phaseResults = phaseFuse.search(searchQuery);

    for (const result of phaseResults) {
      for (const requirement of result.item.requirementItemIds) {
        itemIds.add(requirement.itemId);
      }
    }
  }

  // Search quests (use cached Fuse instance if available)
  if (cachedQuestsArray !== quests) {
    cachedQuestsFuse = new Fuse(quests, fuseOptions);
    cachedQuestsArray = quests;
  }
  const questResults = cachedQuestsFuse!.search(searchQuery);

  for (const result of questResults) {
    if (result.item.requiredItemIds) {
      for (const requirement of result.item.requiredItemIds) {
        itemIds.add(requirement.itemId);
      }
    }
  }

  return itemIds;
}

/**
 * Filters items by name or by module/project/quest requirements using fuzzy search
 * Items matching by name appear first, then items matching by module/project/quest
 */
export function filterItemsByName(
  items: Item[],
  searchQuery: string,
  hideoutModules?: HideoutModule[],
  projects?: Project[],
  quests?: Quest[]
): Item[] {
  if (!searchQuery.trim()) {
    return items;
  }

  // Configure Fuse for item name search (use cached instance if available)
  if (cachedItemsArray !== items) {
    cachedItemsFuse = new Fuse(items, {
      keys: ['name.en', 'description.en'],
      threshold: 0.4,
      includeScore: true,
      shouldSort: true
    });
    cachedItemsArray = items;
  }

  // Perform fuzzy search on item names
  const fuzzyResults = cachedItemsFuse!.search(searchQuery);
  const nameMatches = fuzzyResults.map(result => result.item);

  // Get item IDs that match by being required by modules/projects/quests
  let sourceMatchIds = new Set<string>();
  if (hideoutModules && projects && quests) {
    sourceMatchIds = findItemsRequiredBySource(hideoutModules, projects, quests, searchQuery);
  }

  // Get items that match by source but not by name
  const nameMatchIds = new Set(nameMatches.map(item => item.id));
  const sourceOnlyMatches = items.filter(
    item => sourceMatchIds.has(item.id) && !nameMatchIds.has(item.id)
  );

  // Combine and ensure final deduplication (in case source data has duplicates)
  const combinedResults = [...nameMatches, ...sourceOnlyMatches];
  const finalSeenIds = new Set<string>();
  return combinedResults.filter(item => {
    if (finalSeenIds.has(item.id)) return false;
    finalSeenIds.add(item.id);
    return true;
  });
}
