import { describe, expect, it } from 'vitest';

import { DORMANT_AFTER_DAYS, GRID_SIZE } from './config';

describe('config', () => {
  it('uses a 12x12 starting grid (from the game design)', () => {
    expect(GRID_SIZE).toBe(12);
  });

  it('lets a district go quiet after a week (from the sprint 2 design)', () => {
    expect(DORMANT_AFTER_DAYS).toBe(7);
  });
});
