// Pure wallet operations. These functions never mutate the input wallet.

import {
  LARGE_TASK_REWARD,
  MEDIUM_TASK_REWARD,
  SMALL_TASK_REWARD,
} from './config';
import type { Task, TaskCategory, TaskSize, Wallet } from './types';

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
