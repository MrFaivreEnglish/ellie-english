const normalizeXP = (xp: number) => {
  if (!Number.isFinite(xp)) return 0;
  return Math.max(0, Math.floor(xp));
};

export const MASTER_LEVEL_START = 100;

// Master tiers deliberately widen. At a flat 10 levels each, all five stars were collected
// by level 140 — about seven months for a keen student — and every level after that showed
// an identical badge on a bar already pinned full. These milestones stretch the ladder
// across the several school years a student may actually use Ellie, and past the table
// tiers keep arriving every MASTER_TIER_TAIL_SIZE levels so it never simply stops.
const MASTER_TIER_START_LEVELS = [100, 125, 155, 190, 230];
const MASTER_TIER_TAIL_SIZE = 50;
const LAST_TABLED_TIER_LEVEL = MASTER_TIER_START_LEVELS[MASTER_TIER_START_LEVELS.length - 1];

// Which master tier a level sits in (0 below MASTER_LEVEL_START). Kept separate from the
// exported getMasterTier below so the level cost can use it without depending on a function
// declared further down the file.
const masterTierForLevel = (level: number) => {
  if (level < MASTER_LEVEL_START) return 0;

  if (level >= LAST_TABLED_TIER_LEVEL) {
    return (
      MASTER_TIER_START_LEVELS.length +
      Math.floor((level - LAST_TABLED_TIER_LEVEL) / MASTER_TIER_TAIL_SIZE)
    );
  }

  let tier = 0;
  for (let index = 0; index < MASTER_TIER_START_LEVELS.length; index += 1) {
    if (level >= MASTER_TIER_START_LEVELS[index]) tier = index + 1;
  }

  return tier;
};

const BASE_LEVEL_XP = 80;
const LEVEL_XP_STEP = 12;
const LEVEL_XP_CAP = 280;
// Below Master the cost flattens at 280 (level 18 onward), which meant a level 250 student
// paid what a level 18 one did. Each master tier adds this on top, so the ladder keeps
// steepening exactly where the tier milestones already widen: Master I levels cost 320,
// Master II 360, and so on. Tier-aligned on purpose — it reinforces the star ladder rather
// than running a second, unrelated curve alongside it.
const MASTER_TIER_XP_STEP = 40;

export const xpNeededForLevel = (level: number) =>
  Math.min(BASE_LEVEL_XP + (level - 1) * LEVEL_XP_STEP, LEVEL_XP_CAP)
  + masterTierForLevel(level) * MASTER_TIER_XP_STEP;

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

export const getMasterTier = (level: number) => masterTierForLevel(normalizeXP(level));

/**
 * The level at which the next master tier arrives, so the UI can name the milestone a
 * master is actually working toward rather than showing a bar that never moves.
 */
export const getNextMasterTierLevel = (level: number) => {
  const safeLevel = normalizeXP(level);
  if (safeLevel < MASTER_LEVEL_START) return MASTER_LEVEL_START;

  const nextTabled = MASTER_TIER_START_LEVELS.find((startLevel) => startLevel > safeLevel);
  if (nextTabled != null) return nextTabled;

  const tiersIntoTail = Math.floor((safeLevel - LAST_TABLED_TIER_LEVEL) / MASTER_TIER_TAIL_SIZE) + 1;
  return LAST_TABLED_TIER_LEVEL + tiersIntoTail * MASTER_TIER_TAIL_SIZE;
};

export const getMasterTierLabel = (level: number) => {
  const tier = getMasterTier(level);
  if (tier <= 0) return '';

  return `Master ${toRomanNumeral(tier)}`;
};

export const getMasterStarCount = (level: number) => Math.min(5, getMasterTier(level));

// Masters used to all read "Level 100+", so a level 187 student wore the same badge as one
// who had just crossed 100 — the exact point at which the number stops meaning anything.
export const getLevelBadgeLabel = (level: number) => `Level ${normalizeXP(level) || 1}`;

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
