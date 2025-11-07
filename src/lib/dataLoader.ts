import type { Item, HideoutModule, Project, Quest } from '../types';

const BASE_URL = 'https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main';

export async function fetchItems(): Promise<Item[]> {
  const response = await fetch(`${BASE_URL}/items.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchHideoutModules(): Promise<HideoutModule[]> {
  const response = await fetch(`${BASE_URL}/hideoutModules.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch hideout modules: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${BASE_URL}/projects.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchQuests(): Promise<Quest[]> {
  const response = await fetch(`${BASE_URL}/quests.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch quests: ${response.statusText}`);
  }
  return response.json();
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
