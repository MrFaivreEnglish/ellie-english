import {
  xpNeededForLevel,
  xpForLevel,
  getXPLevel,
  getXPLevelStats,
  isMasterLevel,
  getMasterTier,
  getMasterTierLabel,
  getLevelDisplayLabel,
} from '../features/progress/xpLevels';

describe('xpNeededForLevel', () => {
  it('starts at 50 for level 1', () => {
    expect(xpNeededForLevel(1)).toBe(50);
  });

  it('increases by 10 per level', () => {
    expect(xpNeededForLevel(2)).toBe(60);
    expect(xpNeededForLevel(3)).toBe(70);
  });

  it('caps at 200', () => {
    expect(xpNeededForLevel(16)).toBe(200);
    expect(xpNeededForLevel(99)).toBe(200);
  });
});

describe('getXPLevel', () => {
  it('returns 1 at 0 XP', () => {
    expect(getXPLevel(0)).toBe(1);
  });

  it('stays at 1 just below the threshold', () => {
    expect(getXPLevel(49)).toBe(1);
  });

  it('reaches level 2 at exactly 50 XP', () => {
    expect(getXPLevel(50)).toBe(2);
  });

  it('handles negative XP as level 1', () => {
    expect(getXPLevel(-100)).toBe(1);
  });

  it('handles NaN as level 1', () => {
    expect(getXPLevel(NaN)).toBe(1);
  });

  it('is consistent with xpForLevel', () => {
    // At exactly the XP needed for level N, getXPLevel should return N
    for (const level of [2, 5, 10, 15]) {
      expect(getXPLevel(xpForLevel(level))).toBe(level);
    }
  });
});

describe('getXPLevelStats', () => {
  it('shows 0 progress at XP 0', () => {
    const stats = getXPLevelStats(0);
    expect(stats.level).toBe(1);
    expect(stats.progressXP).toBe(0);
    expect(stats.progressPercent).toBe(0);
  });

  it('shows 50% at halfway through level 1 (25 XP)', () => {
    const stats = getXPLevelStats(25);
    expect(stats.level).toBe(1);
    expect(stats.progressPercent).toBe(50);
  });

  it('rolls over cleanly at a level boundary', () => {
    const stats = getXPLevelStats(50);
    expect(stats.level).toBe(2);
    expect(stats.progressXP).toBe(0);
    expect(stats.progressPercent).toBe(0);
  });

  it('never returns progressPercent above 100', () => {
    const stats = getXPLevelStats(1_000_000);
    expect(stats.progressPercent).toBeLessThanOrEqual(100);
  });

  it('neededXP is always at least 1', () => {
    for (const xp of [0, 50, 200, 10000]) {
      expect(getXPLevelStats(xp).neededXP).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('isMasterLevel', () => {
  it('is false below 100', () => {
    expect(isMasterLevel(99)).toBe(false);
  });

  it('is true at exactly 100', () => {
    expect(isMasterLevel(100)).toBe(true);
  });

  it('is true above 100', () => {
    expect(isMasterLevel(150)).toBe(true);
  });
});

describe('getMasterTier', () => {
  it('returns 0 below master level', () => {
    expect(getMasterTier(99)).toBe(0);
  });

  it('returns tier 1 at level 100', () => {
    expect(getMasterTier(100)).toBe(1);
  });

  it('returns tier 2 at level 110', () => {
    expect(getMasterTier(110)).toBe(2);
  });

  it('advances tier every 10 levels', () => {
    expect(getMasterTier(120)).toBe(3);
    expect(getMasterTier(130)).toBe(4);
  });
});

describe('getMasterTierLabel', () => {
  it('returns empty string below master', () => {
    expect(getMasterTierLabel(99)).toBe('');
  });

  it('returns Master I at tier 1', () => {
    expect(getMasterTierLabel(100)).toBe('Master I');
  });

  it('returns Master II at tier 2', () => {
    expect(getMasterTierLabel(110)).toBe('Master II');
  });

  it('returns Master IV at tier 4', () => {
    expect(getMasterTierLabel(130)).toBe('Master IV');
  });
});

describe('getLevelDisplayLabel', () => {
  it('shows plain level number for regular levels', () => {
    expect(getLevelDisplayLabel(1)).toBe('Level 1');
    expect(getLevelDisplayLabel(42)).toBe('Level 42');
  });

  it('shows Ellie Master at level 100', () => {
    expect(getLevelDisplayLabel(100)).toBe('Level 100 - Ellie Master');
  });

  it('shows master tier label above 100', () => {
    expect(getLevelDisplayLabel(110)).toContain('Master II');
  });

  it('treats 0 as level 1', () => {
    expect(getLevelDisplayLabel(0)).toBe('Level 1');
  });
});
