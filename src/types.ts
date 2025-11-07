export interface LocalizedString {
  en: string;
  de?: string;
  fr?: string;
  es?: string;
  pt?: string;
  pl?: string;
  no?: string;
  da?: string;
  it?: string;
  ru?: string;
  ja?: string;
  "zh-TW"?: string;
  uk?: string;
  "zh-CN"?: string;
  kr?: string;
  tr?: string;
  hr?: string;
  sr?: string;
}

export interface Item {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  type: string;
  rarity: string;
  value: number;
  weightKg: number;
  stackSize: number;
  imageFilename: string;
  updatedAt?: string;
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
  name: LocalizedString;
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
  name: LocalizedString;
  description: LocalizedString;
  phases: ProjectPhase[];
}

export interface Quest {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  trader: string;
  objectives: LocalizedString[];
  requiredItemIds?: RequirementItem[];
  rewardItemIds?: RequirementItem[];
  xp: number;
  previousQuestIds: string[];
  nextQuestIds: string[];
  updatedAt?: string;
}

export interface ItemWithCount {
  item: Item;
  referenceCount: number;
}

export interface ReferenceDetails {
  count: number;
  sources: string[];
  totalQuantity: number;
  quantityBySource: Record<string, number>;
}
