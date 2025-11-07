import type { HideoutModule, Project, Quest, ReferenceDetails } from '../types';

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
        const sourceName = `${project.name.en} (${phase.name})`;

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
  const lowerQuery = searchQuery.toLowerCase();
  const itemIds = new Set<string>();

  // Search hideout modules
  for (const module of hideoutModules) {
    if (module.name.en.toLowerCase().includes(lowerQuery)) {
      for (const level of module.levels) {
        for (const requirement of level.requirementItemIds) {
          itemIds.add(requirement.itemId);
        }
      }
    }
  }

  // Search projects
  for (const project of projects) {
    if (project.name.en.toLowerCase().includes(lowerQuery)) {
      for (const phase of project.phases) {
        for (const requirement of phase.requirementItemIds) {
          itemIds.add(requirement.itemId);
        }
      }
    }
  }

  // Search quests (for quest requirements)
  for (const quest of quests) {
    if (quest.name.en.toLowerCase().includes(lowerQuery) && quest.requiredItemIds) {
      for (const requirement of quest.requiredItemIds) {
        itemIds.add(requirement.itemId);
      }
    }
  }

  return itemIds;
}

/**
 * Filters items by name or by module/project/quest requirements (case-insensitive)
 * Items matching by name appear first, then items matching by module/project/quest
 */
export function filterItemsByName(
  items: any[],
  searchQuery: string,
  hideoutModules?: HideoutModule[],
  projects?: Project[],
  quests?: Quest[]
) {
  if (!searchQuery.trim()) {
    return items;
  }

  const lowerQuery = searchQuery.toLowerCase();

  // First, check if search matches any module/project/quest
  let requiredItemIds = new Set<string>();
  if (hideoutModules && projects && quests) {
    requiredItemIds = findItemsRequiredBySource(hideoutModules, projects, quests, searchQuery);
  }

  // Filter and categorize items
  const nameMatches: any[] = [];
  const sourceMatches: any[] = [];

  items.forEach(item => {
    const matchesName = item.name.en.toLowerCase().includes(lowerQuery);
    const isRequiredBySource = requiredItemIds.has(item.id);

    if (matchesName) {
      nameMatches.push(item);
    } else if (isRequiredBySource) {
      sourceMatches.push(item);
    }
  });

  // Return name matches first, then source matches
  return [...nameMatches, ...sourceMatches];
}
