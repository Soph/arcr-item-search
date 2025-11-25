import type { Item, HideoutModule, Project, Quest } from '../types';

// Use local aggregated data (built by scripts/aggregate-data.js)
const BASE_URL = import.meta.env.BASE_URL + 'data';

// Type guards for runtime validation
function isLocalizedString(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'en' in value &&
    typeof (value as Record<string, unknown>).en === 'string'
  );
}

function isRequirementItem(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'itemId' in value &&
    'quantity' in value &&
    typeof (value as Record<string, unknown>).itemId === 'string' &&
    typeof (value as Record<string, unknown>).quantity === 'number'
  );
}

function validateItem(item: unknown): item is Item {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;

  // Only validate required fields - many fields are optional in real data
  const hasRequiredFields = (
    typeof obj.id === 'string' &&
    isLocalizedString(obj.name) &&
    typeof obj.type === 'string'
  );

  if (!hasRequiredFields) return false;

  // Validate optional fields if they exist
  if ('description' in obj && obj.description != null && !isLocalizedString(obj.description)) return false;
  if ('rarity' in obj && obj.rarity != null && typeof obj.rarity !== 'string') return false;
  if ('value' in obj && obj.value != null && typeof obj.value !== 'number') return false;
  if ('weightKg' in obj && obj.weightKg != null && typeof obj.weightKg !== 'number') return false;
  if ('stackSize' in obj && obj.stackSize != null && typeof obj.stackSize !== 'number') return false;
  if ('imageFilename' in obj && obj.imageFilename != null && typeof obj.imageFilename !== 'string') return false;

  return true;
}

function validateHideoutModule(module: unknown): module is HideoutModule {
  if (typeof module !== 'object' || module === null) return false;
  const obj = module as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    isLocalizedString(obj.name) &&
    typeof obj.maxLevel === 'number' &&
    Array.isArray(obj.levels) &&
    obj.levels.every((level: unknown) => {
      if (typeof level !== 'object' || level === null) return false;
      const lvl = level as Record<string, unknown>;
      return (
        typeof lvl.level === 'number' &&
        Array.isArray(lvl.requirementItemIds) &&
        lvl.requirementItemIds.every(isRequirementItem)
      );
    })
  );
}

function validateProject(project: unknown): project is Project {
  if (typeof project !== 'object' || project === null) return false;
  const obj = project as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    isLocalizedString(obj.name) &&
    isLocalizedString(obj.description) &&
    Array.isArray(obj.phases) &&
    obj.phases.every((phase: unknown) => {
      if (typeof phase !== 'object' || phase === null) return false;
      const p = phase as Record<string, unknown>;
      return (
        typeof p.phase === 'number' &&
        (typeof p.name === 'string' || isLocalizedString(p.name)) &&
        Array.isArray(p.requirementItemIds) &&
        p.requirementItemIds.every(isRequirementItem)
      );
    })
  );
}

function validateQuest(quest: unknown): quest is Quest {
  if (typeof quest !== 'object' || quest === null) return false;
  const obj = quest as Record<string, unknown>;

  const baseValid = (
    typeof obj.id === 'string' &&
    isLocalizedString(obj.name) &&
    typeof obj.trader === 'string' &&
    Array.isArray(obj.objectives) &&
    obj.objectives.every(isLocalizedString) &&
    typeof obj.xp === 'number' &&
    Array.isArray(obj.previousQuestIds) &&
    Array.isArray(obj.nextQuestIds)
  );

  // requiredItemIds is optional, but if present and not null/undefined must be valid
  if ('requiredItemIds' in obj && obj.requiredItemIds != null) {
    return baseValid && Array.isArray(obj.requiredItemIds) && obj.requiredItemIds.every(isRequirementItem);
  }

  return baseValid;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchItems(): Promise<Item[]> {
  const data: unknown = await fetchJson(`${BASE_URL}/items.json`);

  if (!Array.isArray(data)) {
    throw new Error('Invalid items data: expected an array');
  }

  const validItems = data.filter((item, index) => {
    const isValid = validateItem(item);
    if (!isValid) {
      console.warn(`Invalid item at index ${index}:`, item);
    }
    return isValid;
  });

  if (validItems.length === 0 && data.length > 0) {
    throw new Error('No valid items found in response');
  }

  // Deduplicate items by ID (keep first occurrence)
  const seenIds = new Map<string, Item>();
  const deduplicatedItems = validItems.filter((item) => {
    if (seenIds.has(item.id)) {
      console.warn(`Duplicate item ID found: ${item.id}, skipping duplicate`);
      return false;
    }
    seenIds.set(item.id, item);
    return true;
  });

  return deduplicatedItems;
}

export async function fetchHideoutModules(): Promise<HideoutModule[]> {
  const data: unknown = await fetchJson(`${BASE_URL}/hideoutModules.json`);

  if (!Array.isArray(data)) {
    throw new Error('Invalid hideout modules data: expected an array');
  }

  const validModules = data.filter((module, index) => {
    const isValid = validateHideoutModule(module);
    if (!isValid) {
      console.warn(`Invalid hideout module at index ${index}:`, module);
    }
    return isValid;
  });

  if (validModules.length === 0 && data.length > 0) {
    throw new Error('No valid hideout modules found in response');
  }

  return validModules;
}

export async function fetchProjects(): Promise<Project[]> {
  const data: unknown = await fetchJson(`${BASE_URL}/projects.json`);

  if (!Array.isArray(data)) {
    throw new Error('Invalid projects data: expected an array');
  }

  const validProjects = data.filter((project, index) => {
    const isValid = validateProject(project);
    if (!isValid) {
      console.warn(`Invalid project at index ${index}:`, project);
    }
    return isValid;
  });

  if (validProjects.length === 0 && data.length > 0) {
    throw new Error('No valid projects found in response');
  }

  return validProjects;
}

export async function fetchQuests(): Promise<Quest[]> {
  const data: unknown = await fetchJson(`${BASE_URL}/quests.json`);

  if (!Array.isArray(data)) {
    throw new Error('Invalid quests data: expected an array');
  }

  const validQuests = data.filter((quest, index) => {
    const isValid = validateQuest(quest);
    if (!isValid) {
      console.warn(`Invalid quest at index ${index}:`, quest);
    }
    return isValid;
  });

  if (validQuests.length === 0 && data.length > 0) {
    throw new Error('No valid quests found in response');
  }

  return validQuests;
}

export async function loadAllData() {
  try {
    const [items, hideoutModules, projects, quests] = await Promise.all([
      fetchItems(),
      fetchHideoutModules(),
      fetchProjects(),
      fetchQuests(),
    ]);

    return { items, hideoutModules, projects, quests };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}
