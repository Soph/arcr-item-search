import type { Item, HideoutModule, Project, Quest } from '../types';

const BASE_URL = 'https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

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
    isLocalizedString(obj.description) &&
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

// Cache management
interface CachedData<T> {
  data: T;
  timestamp: number;
}

function getCachedData<T>(key: string): T | null {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp }: CachedData<T> = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    const cacheEntry: CachedData<T> = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    // Silently fail if sessionStorage is full or unavailable
    console.warn('Failed to cache data:', error);
  }
}

// Retry logic with exponential backoff
async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      // For 5xx errors, retry with backoff
      lastError = new Error(`Server error ${response.status}: ${response.statusText}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // If it's a 4xx error (from our throw above), don't retry
      if (err.message.includes('Failed to fetch') && err.message.includes(url)) {
        throw err;
      }

      lastError = err;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < retries - 1) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

export async function fetchItems(): Promise<Item[]> {
  const cacheKey = 'arcr-items';
  const cached = getCachedData<Item[]>(cacheKey);
  if (cached) return cached;

  const response = await fetchWithRetry(`${BASE_URL}/items.json`);
  const data: unknown = await response.json();

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

  setCachedData(cacheKey, deduplicatedItems);
  return deduplicatedItems;
}

export async function fetchHideoutModules(): Promise<HideoutModule[]> {
  const cacheKey = 'arcr-hideout-modules';
  const cached = getCachedData<HideoutModule[]>(cacheKey);
  if (cached) return cached;

  const response = await fetchWithRetry(`${BASE_URL}/hideoutModules.json`);
  const data: unknown = await response.json();

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

  setCachedData(cacheKey, validModules);
  return validModules;
}

export async function fetchProjects(): Promise<Project[]> {
  const cacheKey = 'arcr-projects';
  const cached = getCachedData<Project[]>(cacheKey);
  if (cached) return cached;

  const response = await fetchWithRetry(`${BASE_URL}/projects.json`);
  const data: unknown = await response.json();

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

  setCachedData(cacheKey, validProjects);
  return validProjects;
}

export async function fetchQuests(): Promise<Quest[]> {
  const cacheKey = 'arcr-quests';
  const cached = getCachedData<Quest[]>(cacheKey);
  if (cached) return cached;

  const response = await fetchWithRetry(`${BASE_URL}/quests.json`);
  const data: unknown = await response.json();

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

  setCachedData(cacheKey, validQuests);
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
