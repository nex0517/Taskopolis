import { describe, expect, it } from 'vitest';

import {
  HOME_COST_PER_CATEGORY,
  TIER_1_BUILDING_COST,
  TIER_2_BUILDING_COST,
  TIER_3_BUILDING_COST,
  TIER_4_BUILDING_COST,
} from './config';
import { BUILDINGS, buildingCost, getBuilding } from './buildings';
import { BUILDING_TYPES, CATEGORIES } from './types';

describe('building catalogue', () => {
  it('has at least three buildings in every category', () => {
    for (const category of CATEGORIES) {
      expect(
        BUILDINGS.filter((building) => building.category === category).length,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('has exactly one definition for every building type in order', () => {
    expect(BUILDINGS.map((building) => building.type)).toEqual(BUILDING_TYPES);
    for (const type of BUILDING_TYPES) {
      expect(BUILDINGS.filter((building) => building.type === type)).toHaveLength(1);
    }
  });

  it('maps every tier and home to its configured cost', () => {
    const tierCosts = [
      TIER_1_BUILDING_COST,
      TIER_2_BUILDING_COST,
      TIER_3_BUILDING_COST,
      TIER_4_BUILDING_COST,
    ];
    for (const building of BUILDINGS) {
      const expected =
        building.tier === null
          ? HOME_COST_PER_CATEGORY
          : tierCosts[building.tier - 1];
      expect(buildingCost(building)).toBe(expected);
    }
  });

  it('returns the matching definition for a building type', () => {
    expect(getBuilding('school')).toEqual(
      BUILDINGS.find((building) => building.type === 'school'),
    );
  });
});
