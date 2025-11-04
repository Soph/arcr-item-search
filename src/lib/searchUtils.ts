import type { HideoutModule, Project, ReferenceDetails } from '../types';

/**
 * Builds a map of item IDs to their reference details (count and source names)
 */
export function buildReferenceCount(
  hideoutModules: HideoutModule[],
  projects: Project[]
): Map<string, ReferenceDetails> {
  const referenceMap = new Map<string, ReferenceDetails>();

  // Track references in hideout modules
  for (const module of hideoutModules) {
    for (const level of module.levels) {
      for (const requirement of level.requirementItemIds) {
        const current = referenceMap.get(requirement.itemId) || { count: 0, sources: [] };
        const sourceName = `${module.name} (Level ${level.level})`;

        referenceMap.set(requirement.itemId, {
          count: current.count + 1,
          sources: [...current.sources, sourceName]
        });
      }
    }
  }

  // Track references in projects
  for (const project of projects) {
    for (const phase of project.phases) {
      for (const requirement of phase.requirementItemIds) {
        const current = referenceMap.get(requirement.itemId) || { count: 0, sources: [] };
        const sourceName = `${project.name} (${phase.name})`;

        referenceMap.set(requirement.itemId, {
          count: current.count + 1,
          sources: [...current.sources, sourceName]
        });
      }
    }
  }

  return referenceMap;
}

/**
 * Filters items by name (case-insensitive)
 */
export function filterItemsByName(items: any[], searchQuery: string) {
  if (!searchQuery.trim()) {
    return items;
  }

  const lowerQuery = searchQuery.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(lowerQuery)
  );
}
