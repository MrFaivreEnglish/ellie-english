import {
  xpNeededForLevel,
  xpForLevel,
  getXPLevel,
  getXPLevelStats,
  isMasterLevel,
  getMasterTier,
  getMasterTierLabel,
  getMasterStarCount,
  getNextMasterTierLevel,
  getLevelBadgeLabel,
  getLevelDisplayLabel,
} from '../features/progress/xpLevels';

describe('xpNeededForLevel', () => {
  it('starts at 80 for level 1', () => {
    expect(xpNeededForLevel(1)).toBe(80);
  });

  it('increases by 12 per level', () => {
    expect(xpNeededForLevel(2)).toBe(92);
    expect(xpNeededForLevel(3)).toBe(104);
  });

  it('caps at 280', () => {
    expect(xpNeededForLevel(18)).toBe(280);
    expect(xpNeededForLevel(99)).toBe(280);
  });
});

describe('getXPLevel', () => {
  it('returns 1 at 0 XP', () => {
    expect(getXPLevel(0)).toBe(1);
  });

  it('stays at 1 just below the threshold', () => {
    expect(getXPLevel(79)).toBe(1);
  });

  it('reaches level 2 at exactly 80 XP', () => {
    expect(getXPLevel(80)).toBe(2);
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

  it('shows 50% at halfway through level 1 (40 XP)', () => {
    const stats = getXPLevelStats(40);
    expect(stats.level).toBe(1);
    expect(stats.progressPercent).toBe(50);
  });

  it('rolls over cleanly at a level boundary', () => {
    const stats = getXPLevelStats(80);
    expect(stats.level).toBe(2);
    expect(stats.progressXP).toBe(0);
    expect(stats.progressPercent).toBe(0);
  });

  it('never returns progressPercent above 100', () => {
    const stats = getXPLevelStats(1_000_000);
    expect(stats.progressPercent).toBeLessThanOrEqual(100);
  });

  it('neededXP is always at least 1', () => {
    for (const xp of [0, 80, 280, 10000]) {
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

  it('holds a tier until the next milestone is actually reached', () => {
    expect(getMasterTier(124)).toBe(1);
    expect(getMasterTier(125)).toBe(2);
    expect(getMasterTier(154)).toBe(2);
  });

  it('widens as it climbs, so the ladder spans several school years', () => {
    expect(getMasterTier(155)).toBe(3);
    expect(getMasterTier(190)).toBe(4);
    expect(getMasterTier(230)).toBe(5);
  });

  it('keeps issuing tiers past the table instead of stopping', () => {
    expect(getMasterTier(280)).toBe(6);
    expect(getMasterTier(330)).toBe(7);
  });

  it('never goes backwards as the level rises', () => {
    let previous = 0;
    for (let level = 100; level <= 500; level += 1) {
      const tier = getMasterTier(level);
      expect(tier).toBeGreaterThanOrEqual(previous);
      previous = tier;
    }
  });
});

describe('getNextMasterTierLevel', () => {
  it('points at master itself from below', () => {
    expect(getNextMasterTierLevel(42)).toBe(100);
  });

  it('names the next milestone, not the current one', () => {
    expect(getNextMasterTierLevel(100)).toBe(125);
    expect(getNextMasterTierLevel(124)).toBe(125);
    expect(getNextMasterTierLevel(125)).toBe(155);
  });

  it('keeps naming one past the table', () => {
    expect(getNextMasterTierLevel(230)).toBe(280);
    expect(getNextMasterTierLevel(281)).toBe(330);
  });

  it('always names a level above the current one', () => {
    for (let level = 100; level <= 400; level += 7) {
      expect(getNextMasterTierLevel(level)).toBeGreaterThan(level);
    }
  });
});

describe('getMasterStarCount', () => {
  it('awards a star per tier', () => {
    expect(getMasterStarCount(100)).toBe(1);
    expect(getMasterStarCount(155)).toBe(3);
  });

  it('fills all five only deep into master, not within months', () => {
    expect(getMasterStarCount(140)).toBeLessThan(5);
    expect(getMasterStarCount(230)).toBe(5);
  });

  it('caps at five', () => {
    expect(getMasterStarCount(1000)).toBe(5);
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
    expect(getMasterTierLabel(125)).toBe('Master II');
  });

  it('returns Master IV at tier 4', () => {
    expect(getMasterTierLabel(190)).toBe('Master IV');
  });
});

describe('getLevelBadgeLabel', () => {
  it('shows the real level number', () => {
    expect(getLevelBadgeLabel(42)).toBe('Level 42');
  });

  it('keeps distinguishing masters instead of collapsing them into one badge', () => {
    expect(getLevelBadgeLabel(100)).toBe('Level 100');
    expect(getLevelBadgeLabel(187)).toBe('Level 187');
    expect(getLevelBadgeLabel(100)).not.toBe(getLevelBadgeLabel(187));
  });

  it('treats 0 as level 1', () => {
    expect(getLevelBadgeLabel(0)).toBe('Level 1');
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
    expect(getLevelDisplayLabel(125)).toContain('Master II');
  });

  it('treats 0 as level 1', () => {
    expect(getLevelDisplayLabel(0)).toBe('Level 1');
  });
});

describe('master level cost', () => {
  it('leaves every level below master on the flat cap', () => {
    expect(xpNeededForLevel(18)).toBe(280);
    expect(xpNeededForLevel(50)).toBe(280);
    expect(xpNeededForLevel(99)).toBe(280);
  });

  it('adds a step per master tier, so the ladder keeps steepening past 100', () => {
    // Below master the cost had flattened at level 18, which left a level 250 student
    // paying exactly what a level 18 one did.
    expect(xpNeededForLevel(100)).toBe(320); // Master I
    expect(xpNeededForLevel(125)).toBe(360); // Master II
    expect(xpNeededForLevel(155)).toBe(400); // Master III
    expect(xpNeededForLevel(190)).toBe(440); // Master IV
    expect(xpNeededForLevel(230)).toBe(480); // Master V
  });

  it('keeps rising past the tabled tiers', () => {
    expect(xpNeededForLevel(280)).toBeGreaterThan(xpNeededForLevel(230));
  });

  it('steps up exactly at each tier boundary, not before', () => {
    expect(xpNeededForLevel(124)).toBe(320);
    expect(xpNeededForLevel(125)).toBe(360);
  });

  it('still lets getXPLevel round-trip through the steeper master range', () => {
    [100, 125, 155, 190, 230, 260].forEach((level) => {
      expect(getXPLevel(xpForLevel(level))).toBe(level);
      expect(getXPLevel(xpForLevel(level) - 1)).toBe(level - 1);
    });
  });
});
