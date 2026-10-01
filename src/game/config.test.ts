import { describe, expect, it } from 'vitest';

import { GRID_SIZE } from './config';

describe('config', () => {
  it('uses a 12x12 starting grid (from the game design)', () => {
    expect(GRID_SIZE).toBe(12);
  });
});
