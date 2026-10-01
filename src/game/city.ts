import {
  GRID_SIZE,
  PEOPLE_PER_HOME,
  PEOPLE_PER_SERVICE_BUILDING,
} from './config';
import { canAffordBuilding, payForBuilding } from './economy';
import { getBuilding } from './buildings';
import type { BuildingType, CityData, PlacedBuilding, Wallet } from './types';

export function buildingAt(
  city: CityData,
  row: number,
  col: number,
): PlacedBuilding | undefined {
  return city.buildings.find(
    (building) => building.row === row && building.col === col,
  );
}

export type PlaceFailure = 'out-of-bounds' | 'occupied' | 'unaffordable';

export type PlaceResult =
  | { ok: true; city: CityData; wallet: Wallet }
  | { ok: false; reason: PlaceFailure };

export function placeBuilding(
  city: CityData,
  wallet: Wallet,
  type: BuildingType,
  row: number,
  col: number,
): PlaceResult {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    col < 0 ||
    row >= GRID_SIZE ||
    col >= GRID_SIZE
  ) {
    return { ok: false, reason: 'out-of-bounds' };
  }
  if (buildingAt(city, row, col)) return { ok: false, reason: 'occupied' };
  const def = getBuilding(type);
  if (!canAffordBuilding(wallet, def)) {
    return { ok: false, reason: 'unaffordable' };
  }
  const building: PlacedBuilding = { type, row, col };
  return {
    ok: true,
    city: { buildings: [...city.buildings, building] },
    wallet: payForBuilding(wallet, def),
  };
}

export interface CityStats {
  homes: number;
  serviceBuildings: number;
  housing: number;
  supported: number;
  population: number;
}

export function cityStats(city: CityData): CityStats {
  const homes = city.buildings.filter((building) => building.type === 'home')
    .length;
  const serviceBuildings = city.buildings.length - homes;
  const housing = homes * PEOPLE_PER_HOME;
  const supported = serviceBuildings * PEOPLE_PER_SERVICE_BUILDING;
  // A city with only homes stops growing until it has service buildings.
  const population = Math.min(housing, supported);
  return { homes, serviceBuildings, housing, supported, population };
}
