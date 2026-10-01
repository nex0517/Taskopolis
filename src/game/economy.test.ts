import { describe, expect, it } from 'vitest';

import {
  HOME_CATEGORY_COUNT,
  HOME_COST_PER_CATEGORY,
  LARGE_TASK_REWARD,
  MEDIUM_TASK_REWARD,
  SMALL_TASK_REWARD,
} from './config';
import { buildingCost, getBuilding } from './buildings';
import { newGame } from './save';
import {
  addCoins,
  canAfford,
  canAffordBuilding,
  canAffordHome,
  payTaskReward,
  payForBuilding,
  refundCoins,
  refundTaskReward,
  rewardForTask,
  rewardForSize,
  spendForHome,
  spendCoins,
} from './economy';
import type { Task, Wallet } from './types';
import { CATEGORIES } from './types';

const task: Pick<Task, 'category' | 'size'> = {
  category: 'Study',
  size: 'M',
};

function wallet(): Wallet {
  return newGame().wallet;
}

describe('reward calculation', () => {
  it('uses the configured S/M/L rewards', () => {
    expect(rewardForSize('S')).toBe(SMALL_TASK_REWARD);
    expect(rewardForSize('M')).toBe(MEDIUM_TASK_REWARD);
    expect(rewardForSize('L')).toBe(LARGE_TASK_REWARD);
  });

  it('gets the reward from a task size', () => {
    expect(rewardForTask(task)).toBe(MEDIUM_TASK_REWARD);
    expect(payTaskReward(wallet(), task).Study).toBe(MEDIUM_TASK_REWARD);
  });
});

describe('wallet updates', () => {
  it('adds coins without mutating the original wallet', () => {
    const original = wallet();
    const updated = addCoins(original, 'Health', 3);
    expect(updated.Health).toBe(3);
    expect(original.Health).toBe(0);
  });

  it('pays a task reward to its category', () => {
    expect(payTaskReward(wallet(), task).Study).toBe(MEDIUM_TASK_REWARD);
  });

  it('refunds a task reward from its category', () => {
    const earned = payTaskReward(wallet(), task);
    expect(refundTaskReward(earned, task).Study).toBe(0);
  });
});

describe('affordability and spending', () => {
  it('checks whether the category can afford a cost', () => {
    const coins = addCoins(wallet(), 'Chores', 3);
    expect(canAfford(coins, 'Chores', 3)).toBe(true);
    expect(canAfford(coins, 'Chores', 4)).toBe(false);
  });

  it('spends affordable coins and leaves other categories alone', () => {
    const coins = addCoins(wallet(), 'Social', 5);
    const updated = spendCoins(coins, 'Social', 3);
    expect(updated.Social).toBe(2);
    expect(updated.Study).toBe(0);
  });

  it('does not spend when the wallet cannot afford the cost', () => {
    const coins = addCoins(wallet(), 'Projects', 2);
    expect(spendCoins(coins, 'Projects', 3)).toEqual(coins);
  });

  it('never makes a wallet negative when refunding already-spent coins', () => {
    const coins = addCoins(wallet(), 'Money/Admin', 1);
    expect(refundCoins(coins, 'Money/Admin', 3)['Money/Admin']).toBe(0);
  });
});

describe('home affordability and spending', () => {
  it('requires enough coins in the configured number of categories', () => {
    const coins = wallet();
    for (const category of CATEGORIES.slice(0, HOME_CATEGORY_COUNT)) {
      coins[category] = HOME_COST_PER_CATEGORY;
    }
    expect(canAffordHome(coins)).toBe(true);
    coins[CATEGORIES[HOME_CATEGORY_COUNT - 1]] = 0;
    expect(canAffordHome(coins)).toBe(false);
  });

  it('spends from the richest categories first', () => {
    const coins = wallet();
    coins.Study = HOME_COST_PER_CATEGORY + 2;
    coins.Health = HOME_COST_PER_CATEGORY + 1;
    coins.Chores = HOME_COST_PER_CATEGORY;
    const updated = spendForHome(coins);
    expect(updated.Study).toBe(2);
    expect(updated.Health).toBe(1);
    expect(updated.Chores).toBe(0);
  });

  it('breaks equal-balance ties in CATEGORIES order', () => {
    const coins = wallet();
    for (const category of CATEGORIES) {
      coins[category] = HOME_COST_PER_CATEGORY;
    }
    const updated = spendForHome(coins);
    for (const [index, category] of CATEGORIES.entries()) {
      expect(updated[category]).toBe(
        index < HOME_CATEGORY_COUNT ? 0 : HOME_COST_PER_CATEGORY,
      );
    }
  });

  it('returns an unchanged copy when a home is unaffordable', () => {
    const coins = wallet();
    coins.Study = HOME_COST_PER_CATEGORY;
    const updated = spendForHome(coins);
    expect(updated).toEqual(coins);
    expect(updated).not.toBe(coins);
  });
});

describe('building payments', () => {
  it('checks and pays for a district building', () => {
    const school = getBuilding('school');
    const coins = wallet();
    coins.Study = buildingCost(school);
    expect(canAffordBuilding(coins, school)).toBe(true);
    const updated = payForBuilding(coins, school);
    expect(updated.Study).toBe(0);
    expect(coins.Study).toBe(buildingCost(school));
  });

  it('checks and pays for a home', () => {
    const home = getBuilding('home');
    const coins = wallet();
    for (const category of CATEGORIES.slice(0, HOME_CATEGORY_COUNT)) {
      coins[category] = HOME_COST_PER_CATEGORY;
    }
    expect(canAffordBuilding(coins, home)).toBe(true);
    expect(payForBuilding(coins, home)).toEqual(wallet());
  });
});
