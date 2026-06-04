const normalizeXP = (xp: number) => {
  if (!Number.isFinite(xp)) return 0;
  return Math.max(0, Math.floor(xp));
};

export const MASTER_LEVEL_START = 100;
export const MASTER_TIER_SIZE = 10;

export const xpNeededForLevel = (level: number) => Math.min(50 + (level - 1) * 10, 200);

export const xpForLevel = (level: number) => {
  let total = 0;

  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    total += xpNeededForLevel(currentLevel);
  }

  return total;
};

export const getXPLevel = (xp: number) => {
  const safeXP = normalizeXP(xp);
  let level = 1;

  while (safeXP >= xpForLevel(level + 1)) {
    level += 1;
  }

  return level;
};

export const getXPLevelStats = (xp: number) => {
  const safeXP = normalizeXP(xp);
  const level = getXPLevel(safeXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const progressXP = Math.max(0, safeXP - currentLevelXP);
  const neededXP = Math.max(1, nextLevelXP - currentLevelXP);
  const remainingXP = Math.max(1, neededXP - progressXP);
  const progressPercent = Math.min(100, Math.round((progressXP / neededXP) * 100));

  return {
    level,
    progressXP,
    neededXP,
    remainingXP,
    progressPercent,
  };
};

const romanNumerals: Array<[number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

const toRomanNumeral = (value: number) => {
  let remaining = Math.max(1, Math.floor(value));
  let result = '';

  romanNumerals.forEach(([amount, symbol]) => {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  });

  return result;
};

export const isMasterLevel = (level: number) => normalizeXP(level) >= MASTER_LEVEL_START;

export const getMasterTier = (level: number) => {
  const safeLevel = normalizeXP(level);
  if (safeLevel < MASTER_LEVEL_START) return 0;

  return Math.floor((safeLevel - MASTER_LEVEL_START) / MASTER_TIER_SIZE) + 1;
};

export const getMasterTierLabel = (level: number) => {
  const tier = getMasterTier(level);
  if (tier <= 0) return '';

  return `Master ${toRomanNumeral(tier)}`;
};

export const getMasterStarCount = (level: number) => Math.min(5, getMasterTier(level));

export const getLevelBadgeLabel = (level: number) =>
  isMasterLevel(level) ? 'Level 100+' : `Level ${normalizeXP(level) || 1}`;

export const getLevelDisplayLabel = (level: number) => {
  const safeLevel = Math.max(1, normalizeXP(level));

  if (safeLevel === MASTER_LEVEL_START) {
    return `Level ${safeLevel} - Ellie Master`;
  }

  if (safeLevel > MASTER_LEVEL_START) {
    return `Level ${safeLevel} - ${getMasterTierLabel(safeLevel)}`;
  }

  return `Level ${safeLevel}`;
};
