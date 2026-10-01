import {
  HOME_COST_PER_CATEGORY,
  TIER_1_BUILDING_COST,
  TIER_2_BUILDING_COST,
  TIER_3_BUILDING_COST,
  TIER_4_BUILDING_COST,
} from './config';
import type { BuildingType, TaskCategory } from './types';
import { BUILDING_TYPES } from './types';

export type BuildingTier = 1 | 2 | 3 | 4;

export interface BuildingDef {
  type: BuildingType;
  name: string;
  emoji: string;
  category: TaskCategory | null;
  tier: BuildingTier | null;
}

export const DISTRICTS: Record<TaskCategory, string> = {
  Study: 'Education',
  Health: 'Parks',
  Chores: 'Utilities',
  'Money/Admin': 'Commerce',
  Social: 'Culture',
  Projects: 'Industry',
};

export const BUILDINGS: readonly BuildingDef[] = [
  { type: 'home', name: 'Home', emoji: '🏠', category: null, tier: null },
  { type: 'school', name: 'School', emoji: '🏫', category: 'Study', tier: 1 },
  { type: 'library', name: 'Library', emoji: '📚', category: 'Study', tier: 2 },
  {
    type: 'lecture-hall',
    name: 'Lecture Hall',
    emoji: '🎓',
    category: 'Study',
    tier: 3,
  },
  {
    type: 'observatory',
    name: 'Observatory',
    emoji: '🔭',
    category: 'Study',
    tier: 4,
  },
  { type: 'park', name: 'Park', emoji: '🌳', category: 'Health', tier: 1 },
  { type: 'gym', name: 'Gym', emoji: '🏋️', category: 'Health', tier: 2 },
  { type: 'clinic', name: 'Clinic', emoji: '🏥', category: 'Health', tier: 3 },
  {
    type: 'stadium',
    name: 'Stadium',
    emoji: '🏟️',
    category: 'Health',
    tier: 4,
  },
  {
    type: 'water-tower',
    name: 'Water Tower',
    emoji: '💧',
    category: 'Chores',
    tier: 1,
  },
  {
    type: 'power-plant',
    name: 'Power Plant',
    emoji: '⚡',
    category: 'Chores',
    tier: 2,
  },
  {
    type: 'recycling-centre',
    name: 'Recycling Centre',
    emoji: '♻️',
    category: 'Chores',
    tier: 3,
  },
  {
    type: 'market',
    name: 'Market',
    emoji: '🛒',
    category: 'Money/Admin',
    tier: 1,
  },
  {
    type: 'bank',
    name: 'Bank',
    emoji: '🏦',
    category: 'Money/Admin',
    tier: 2,
  },
  {
    type: 'city-hall',
    name: 'City Hall',
    emoji: '🏛️',
    category: 'Money/Admin',
    tier: 3,
  },
  { type: 'cafe', name: 'Cafe', emoji: '☕', category: 'Social', tier: 1 },
  { type: 'plaza', name: 'Plaza', emoji: '⛲', category: 'Social', tier: 2 },
  { type: 'theatre', name: 'Theatre', emoji: '🎭', category: 'Social', tier: 3 },
  {
    type: 'workshop',
    name: 'Workshop',
    emoji: '🔧',
    category: 'Projects',
    tier: 1,
  },
  {
    type: 'factory',
    name: 'Factory',
    emoji: '🏭',
    category: 'Projects',
    tier: 2,
  },
  {
    type: 'tech-campus',
    name: 'Tech Campus',
    emoji: '💻',
    category: 'Projects',
    tier: 3,
  },
];

export function getBuilding(type: BuildingType): BuildingDef {
  const building = BUILDINGS.find((item) => item.type === type);
  if (!building) throw new Error(`Unknown building type: ${type}`);
  return building;
}

export function buildingCost(def: BuildingDef): number {
  if (def.tier === null) return HOME_COST_PER_CATEGORY;
  if (def.tier === 1) return TIER_1_BUILDING_COST;
  if (def.tier === 2) return TIER_2_BUILDING_COST;
  if (def.tier === 3) return TIER_3_BUILDING_COST;
  return TIER_4_BUILDING_COST;
}

if (BUILDINGS.length !== BUILDING_TYPES.length) {
  throw new Error('Each building type must have one catalogue entry.');
}
