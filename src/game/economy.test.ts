import { describe, expect, it } from 'vitest';

import {
  LARGE_TASK_REWARD,
  MEDIUM_TASK_REWARD,
  SMALL_TASK_REWARD,
} from './config';
import { newGame } from './save';
import {
  addCoins,
  canAfford,
  payTaskReward,
  refundCoins,
  refundTaskReward,
  rewardForSize,
  spendCoins,
} from './economy';
import type { Task, Wallet } from './types';

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
