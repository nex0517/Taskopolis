import { describe, expect, it } from 'vitest';

import {
  GRID_SIZE,
  HOME_CATEGORY_COUNT,
  HOME_COST_PER_CATEGORY,
  PEOPLE_PER_HOME,
  PEOPLE_PER_SERVICE_BUILDING,
  TIER_1_BUILDING_COST,
} from './config';
import {
  buildingAt,
  cityStats,
  hasDistrictBuilding,
  placeBuilding,
} from './city';
import { newGame } from './save';
import { CATEGORIES, type CityData } from './types';
import type { Wallet } from './types';

function homeWallet(): Wallet {
  const wallet = newGame().wallet;
  for (const category of CATEGORIES.slice(0, HOME_CATEGORY_COUNT)) {
    wallet[category] = HOME_COST_PER_CATEGORY;
  }
  return wallet;
}

function cityWith(buildings: CityData['buildings']): CityData {
  return { buildings };
}

describe('placeBuilding', () => {
  it('places on an empty tile and charges the wallet', () => {
    const city = newGame().city;
    const wallet = newGame().wallet;
    wallet.Study = TIER_1_BUILDING_COST;
    const result = placeBuilding(city, wallet, 'school', 0, 0);
    expect(result).toEqual({
      ok: true,
      city: { buildings: [{ type: 'school', row: 0, col: 0 }] },
      wallet: { ...wallet, Study: 0 },
    });
  });

  it('refuses an occupied tile without changing the wallet', () => {
    const city = cityWith([{ type: 'school', row: 0, col: 0 }]);
    const wallet = homeWallet();
    const result = placeBuilding(city, wallet, 'home', 0, 0);
    expect(result).toEqual({ ok: false, reason: 'occupied' });
    expect(wallet).toEqual(homeWallet());
  });

  it('refuses an unaffordable building', () => {
    expect(placeBuilding(newGame().city, newGame().wallet, 'school', 0, 0)).toEqual(
      { ok: false, reason: 'unaffordable' },
    );
  });

  it.each([
    [-1, 0],
    [0, -1],
    [GRID_SIZE, 0],
    [0, GRID_SIZE],
  ])('refuses out-of-bounds tile %i,%i', (row, col) => {
    expect(
      placeBuilding(newGame().city, homeWallet(), 'home', row, col),
    ).toEqual({ ok: false, reason: 'out-of-bounds' });
  });

  it('places a home by charging the configured category count', () => {
    const wallet = homeWallet();
    const result = placeBuilding(newGame().city, wallet, 'home', 1, 1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.city.buildings).toEqual([{ type: 'home', row: 1, col: 1 }]);
      for (const category of CATEGORIES.slice(0, HOME_CATEGORY_COUNT)) {
        expect(result.wallet[category]).toBe(0);
      }
    }
  });

  it('does not mutate the city or wallet inputs', () => {
    const city = newGame().city;
    const wallet = homeWallet();
    const originalWallet = { ...wallet };
    const result = placeBuilding(city, wallet, 'home', 1, 1);
    expect(result.ok).toBe(true);
    expect(city.buildings).toEqual([]);
    expect(wallet).toEqual(originalWallet);
  });
});

describe('cityStats', () => {
  it('limits population to zero when there are homes but no services', () => {
    const city = cityWith([
      { type: 'home', row: 0, col: 0 },
      { type: 'home', row: 0, col: 1 },
      { type: 'home', row: 0, col: 2 },
    ]);
    expect(cityStats(city).population).toBe(0);
  });

  it('caps population at service support', () => {
    const city = cityWith([
      { type: 'home', row: 0, col: 0 },
      { type: 'home', row: 0, col: 1 },
      { type: 'home', row: 0, col: 2 },
      { type: 'school', row: 1, col: 0 },
    ]);
    expect(cityStats(city).population).toBe(PEOPLE_PER_SERVICE_BUILDING);
  });

  it('caps population at housing when there are more services', () => {
    const city = cityWith([
      { type: 'home', row: 0, col: 0 },
      { type: 'school', row: 1, col: 0 },
      { type: 'park', row: 1, col: 1 },
    ]);
    expect(cityStats(city).population).toBe(PEOPLE_PER_HOME);
  });
});

describe('buildingAt', () => {
  it('finds a building at its coordinates', () => {
    const building = { type: 'school' as const, row: 2, col: 3 };
    expect(buildingAt(cityWith([building]), 2, 3)).toEqual(building);
  });

  it('returns undefined when the tile is empty', () => {
    expect(buildingAt(newGame().city, 2, 3)).toBeUndefined();
  });
});

describe('hasDistrictBuilding', () => {
  it('is false for an empty city and for homes, true once a district building exists', () => {
    const empty = newGame().city;
    expect(hasDistrictBuilding(empty, 'Study')).toBe(false);
    const homesOnly: CityData = { buildings: [{ type: 'home', row: 0, col: 0 }] };
    expect(hasDistrictBuilding(homesOnly, 'Study')).toBe(false);
    const withSchool: CityData = {
      buildings: [...homesOnly.buildings, { type: 'school', row: 0, col: 1 }],
    };
    expect(hasDistrictBuilding(withSchool, 'Study')).toBe(true);
    expect(hasDistrictBuilding(withSchool, 'Health')).toBe(false);
  });
});
