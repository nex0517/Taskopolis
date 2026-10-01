// Pure wallet operations. These functions never mutate the input wallet.

import {
  HOME_CATEGORY_COUNT,
  HOME_COST_PER_CATEGORY,
  LARGE_TASK_REWARD,
  MEDIUM_TASK_REWARD,
  SMALL_TASK_REWARD,
} from './config';
import { buildingCost } from './buildings';
import type { BuildingDef } from './buildings';
import type { Task, TaskCategory, TaskSize, Wallet } from './types';
import { CATEGORIES } from './types';

/** Return the configured reward for a task size. */
export function rewardForSize(size: TaskSize): number {
  if (size === 'S') return SMALL_TASK_REWARD;
  if (size === 'M') return MEDIUM_TASK_REWARD;
  return LARGE_TASK_REWARD;
}

/** Return the reward a completed task pays to its category. */
export function rewardForTask(task: Pick<Task, 'size'>): number {
  return rewardForSize(task.size);
}

/** Add coins to one category without changing the original wallet. */
export function addCoins(
  wallet: Wallet,
  category: TaskCategory,
  amount: number,
): Wallet {
  return { ...wallet, [category]: wallet[category] + amount };
}

/** Check whether a category has enough coins for a cost. */
export function canAfford(
  wallet: Wallet,
  category: TaskCategory,
  cost: number,
): boolean {
  return wallet[category] >= cost;
}

/**
 * Spend coins when affordable. An unaffordable purchase leaves the wallet
 * unchanged, so callers can safely use the result after a canAfford check.
 */
export function spendCoins(
  wallet: Wallet,
  category: TaskCategory,
  cost: number,
): Wallet {
  if (!canAfford(wallet, category, cost)) return { ...wallet };
  return { ...wallet, [category]: wallet[category] - cost };
}

/** Take back a reward, stopping at zero if those coins were already spent. */
export function refundCoins(
  wallet: Wallet,
  category: TaskCategory,
  amount: number,
): Wallet {
  return { ...wallet, [category]: Math.max(0, wallet[category] - amount) };
}

/** Pay a task's reward into its category. */
export function payTaskReward(wallet: Wallet, task: Pick<Task, 'category' | 'size'>): Wallet {
  return addCoins(wallet, task.category, rewardForTask(task));
}

/** Take a task's reward back when it is un-completed. */
export function refundTaskReward(
  wallet: Wallet,
  task: Pick<Task, 'category' | 'size'>,
): Wallet {
  return refundCoins(wallet, task.category, rewardForTask(task));
}

/** Check whether enough different categories can each pay for a home. */
export function canAffordHome(wallet: Wallet): boolean {
  return (
    CATEGORIES.filter((category) => wallet[category] >= HOME_COST_PER_CATEGORY)
      .length >= HOME_CATEGORY_COUNT
  );
}

/** Pay for a home from the richest categories first. */
export function spendForHome(wallet: Wallet): Wallet {
  if (!canAffordHome(wallet)) return { ...wallet };
  // Auto-picking the richest categories keeps the UI simple and spends the coins you have most of.
  const chosen = [...CATEGORIES]
    .sort(
      (left, right) =>
        wallet[right] - wallet[left] ||
        CATEGORIES.indexOf(left) - CATEGORIES.indexOf(right),
    )
    .slice(0, HOME_CATEGORY_COUNT);
  const updated = { ...wallet };
  for (const category of chosen) {
    updated[category] -= HOME_COST_PER_CATEGORY;
  }
  return updated;
}

/** Check whether a wallet can pay for the selected building. */
export function canAffordBuilding(wallet: Wallet, def: BuildingDef): boolean {
  if (def.category === null) return canAffordHome(wallet);
  return canAfford(wallet, def.category, buildingCost(def));
}

/** Pay for a home or a district building without mutating the wallet. */
export function payForBuilding(wallet: Wallet, def: BuildingDef): Wallet {
  if (def.category === null) return spendForHome(wallet);
  return spendCoins(wallet, def.category, buildingCost(def));
}
