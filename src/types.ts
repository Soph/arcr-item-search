export interface Item {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  value: number;
  weightKg: number;
  stackSize: number;
  imageFilename: string;
  updatedAt: string;
  recyclesInto?: Record<string, number>;
  salvagesInto?: Record<string, number>;
  effects?: Record<string, any>;
  foundIn?: string;
  recipe?: Record<string, number>;
  craftBench?: string;
}

export interface RequirementItem {
  itemId: string;
  quantity: number;
}

export interface HideoutModuleLevel {
  level: number;
  requirementItemIds: RequirementItem[];
  otherRequirements?: string[];
}

export interface HideoutModule {
  id: string;
  name: string;
  maxLevel: number;
  levels: HideoutModuleLevel[];
}

export interface ProjectPhase {
  phase: number;
  name: string;
  description?: string;
  requirementItemIds: RequirementItem[];
  requirementCategories?: any[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  phases: ProjectPhase[];
}

export interface ItemWithCount {
  item: Item;
  referenceCount: number;
}

export interface ReferenceDetails {
  count: number;
  sources: string[];
}
