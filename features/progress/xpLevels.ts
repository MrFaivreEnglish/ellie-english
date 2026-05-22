const normalizeXP = (xp: number) => {
  if (!Number.isFinite(xp)) return 0;
  return Math.max(0, Math.floor(xp));
};

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
  const progressPercent = Math.min(100, Math.round((progressXP / neededXP) * 100));

  return {
    level,
    progressXP,
    neededXP,
    progressPercent,
  };
};
