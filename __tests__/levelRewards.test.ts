import {
  ACCOUNT_AVATAR_COLOR_PRESETS,
  IMAGE_ACCOUNT_AVATAR_PRESETS,
} from '../features/account/accountAvatarStorage';

const rewardLevels = () => [
  ...ACCOUNT_AVATAR_COLOR_PRESETS.map((p) => p.unlockLevel),
  ...IMAGE_ACCOUNT_AVATAR_PRESETS.map((p) => p.unlockLevel),
].filter((level): level is number => !!level);

describe('level rewards', () => {
  it('gives exactly one reward per level, with no level handing out two', () => {
    const levels = rewardLevels();
    expect(new Set(levels).size).toBe(levels.length);
  });

  // There are currently fewer rewards than levels, so some levels are bare. What matters is
  // that the shortfall is shared out — never two bare levels in a row, and no dead stretch
  // before the finale. Add enough art and the schedule packs densely again on its own.
  it('never leaves two levels in a row without a reward', () => {
    const levels = new Set(rewardLevels());
    const runs: number[] = [];
    let run = 0;

    for (let level = 2; level <= 100; level += 1) {
      run = levels.has(level) ? 0 : run + 1;
      runs.push(run);
    }

    expect(Math.max(...runs)).toBeLessThanOrEqual(1);
  });

  it('starts at level 2 and runs at least to 100', () => {
    const levels = rewardLevels();
    expect(Math.min(...levels)).toBe(2);
    // Surplus rewards spill into the master range rather than displacing the finale.
    expect(Math.max(...levels)).toBeGreaterThanOrEqual(100);
  });

  it('closes the run with the final trio on 98, 99 and 100', () => {
    const byLevel = (level: number) =>
      IMAGE_ACCOUNT_AVATAR_PRESETS.find((p) => p.unlockLevel === level)?.id;

    expect(byLevel(98)).toBe('avatar-teacher');
    expect(byLevel(99)).toBe('avatar-medal');
    expect(byLevel(100)).toBe('asset-ellie');
  });

  it('keeps the starting avatar and colour free', () => {
    expect(ACCOUNT_AVATAR_COLOR_PRESETS[0].unlockLevel).toBeUndefined();
    expect(
      IMAGE_ACCOUNT_AVATAR_PRESETS.filter((p) => !p.unlockLevel).length
    ).toBeGreaterThan(0);
  });

  it('keeps borders few and clearly distinct rather than near-duplicates', () => {
    const borders = ACCOUNT_AVATAR_COLOR_PRESETS;
    expect(borders.length).toBe(12);

    // Every accent is a different hue family; two borders that read the same are the bug
    // this set replaced.
    const accents = borders.map((p) => p.accentColor.toLowerCase());
    expect(new Set(accents).size).toBe(accents.length);
  });

  it('spreads the ten earned borders through the run and saves gold for the top', () => {
    const gold = ACCOUNT_AVATAR_COLOR_PRESETS.find((p) => p.id === 'legend-gold');
    expect(gold?.unlockLevel).toBe(97);

    const spread = ACCOUNT_AVATAR_COLOR_PRESETS
      .filter((p) => !!p.unlockLevel && p.id !== 'legend-gold')
      .map((p) => p.unlockLevel as number);

    expect(spread.length).toBe(10);
    // Evenly dealt out, so borders arrive at a steady rate instead of bunching up.
    const gaps = spread.slice(1).map((level, i) => level - spread[i]);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(12);
  });
});
