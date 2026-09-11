import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../features/account/accountStorage', () => ({
  syncXPToCloudIfSignedIn: jest.fn(() => Promise.resolve()),
}));

import {
  getXP,
  addXP,
  grantXP,
  previewGrantXP,
  getGrantedXPToday,
  awardActivityXPOnceToday,
  previewActivityXPOnceToday,
  hasWordXpAwardedToday,
  markWordXpAwardedToday,
  clearLocalXPProgress,
} from '../features/progress/xpStorage';
import { applyDailyXpTaper, DAILY_XP_BANDS } from '../features/progress/xpRewards';

const FULL_RATE_LIMIT = DAILY_XP_BANDS[0].upTo;

// Wire AsyncStorage mocks to an actual in-memory store so reads reflect prior writes.
const store: Record<string, string> = {};

beforeEach(async () => {
  for (const k of Object.keys(store)) delete store[k];

  jest.mocked(AsyncStorage.getItem).mockImplementation((key: string) =>
    Promise.resolve(store[key] ?? null)
  );
  jest.mocked(AsyncStorage.setItem).mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
  jest.mocked(AsyncStorage.getAllKeys).mockImplementation(() =>
    Promise.resolve(Object.keys(store))
  );
  jest.mocked(AsyncStorage.multiRemove).mockImplementation((keys: readonly string[]) => {
    (keys as string[]).forEach((k) => delete store[k]);
    return Promise.resolve();
  });

  // Reset module-level queues between tests
  await clearLocalXPProgress();
});

describe('getXP', () => {
  it('returns 0 when nothing is stored', async () => {
    expect(await getXP()).toBe(0);
  });

  it('returns the stored value', async () => {
    store['TOTAL_XP'] = '250';
    expect(await getXP()).toBe(250);
  });

  it('returns 0 for invalid stored values', async () => {
    store['TOTAL_XP'] = 'not-a-number';
    expect(await getXP()).toBe(0);
  });
});

describe('addXP', () => {
  it('starts from 0 and accumulates', async () => {
    expect(await addXP(10)).toBe(10);
    expect(await addXP(25)).toBe(35);
    expect(await getXP()).toBe(35);
  });

  it('floors at 0 when the deduction exceeds current XP', async () => {
    await addXP(50);
    expect(await addXP(-100)).toBe(0);
  });

  it('ignores fractional XP (floors)', async () => {
    expect(await addXP(4.9)).toBe(4);
  });

  it('ignores NaN and Infinity', async () => {
    await addXP(10);
    await addXP(NaN);
    await addXP(Infinity);
    expect(await getXP()).toBe(10);
  });
});

describe('awardActivityXPOnceToday', () => {
  it('awards XP on first call', async () => {
    const awarded = await awardActivityXPOnceToday('grammar:lesson-1', 20);
    expect(awarded).toBe(20);
    expect(await getXP()).toBe(20);
  });

  it('gives a reduced replay reward on a duplicate call same day', async () => {
    await awardActivityXPOnceToday('grammar:lesson-1', 20);
    const second = await awardActivityXPOnceToday('grammar:lesson-1', 20);
    // Repeating an activity the same day is deliberately still worth something, at
    // REPLAY_XP_FRACTION (0.25) of the full amount, rather than nothing.
    expect(second).toBe(5);
    expect(await getXP()).toBe(25);
  });

  it('awards XP for different activity keys independently', async () => {
    await awardActivityXPOnceToday('grammar:lesson-1', 20);
    const second = await awardActivityXPOnceToday('grammar:lesson-2', 15);
    expect(second).toBe(15);
    expect(await getXP()).toBe(35);
  });

  it('returns 0 and does not add XP when amount is zero, but a later positive call can still award', async () => {
    const zero = await awardActivityXPOnceToday('grammar:lesson-1', 0);
    expect(zero).toBe(0);
    expect(await getXP()).toBe(0);
    // amount=0 marks practice but NOT the XP-award slot, so a positive call still awards
    const later = await awardActivityXPOnceToday('grammar:lesson-1', 20);
    expect(later).toBe(20);
    expect(await getXP()).toBe(20);
  });

  it('ignores blank activity keys', async () => {
    const awarded = await awardActivityXPOnceToday('   ', 20);
    expect(awarded).toBe(0);
    expect(await getXP()).toBe(0);
  });
});

describe('applyDailyXpTaper', () => {
  it('leaves a normal session untouched', () => {
    expect(applyDailyXpTaper(200, 0)).toBe(200);
    expect(applyDailyXpTaper(200, 400)).toBe(200);
  });

  it('splits an award that crosses a band boundary instead of pushing it wholly into one', () => {
    // 100 XP short of the full-rate limit: 100 at full, the remaining 100 at half.
    expect(applyDailyXpTaper(200, FULL_RATE_LIMIT - 100)).toBe(150);
  });

  it('halves XP earned past the first band', () => {
    expect(applyDailyXpTaper(100, FULL_RATE_LIMIT)).toBe(50);
  });

  it('quarters XP once past the second band', () => {
    expect(applyDailyXpTaper(100, DAILY_XP_BANDS[1].upTo)).toBe(25);
  });

  it('never returns more than it was asked for', () => {
    for (const banked of [0, 300, 700, 1400, 5000]) {
      expect(applyDailyXpTaper(250, banked)).toBeLessThanOrEqual(250);
    }
  });

  it('makes grinding strictly worse than stopping — a long tail keeps paying, but less', () => {
    // 20 identical 150 XP runs in one day: the total has to stay well under 20 x 150,
    // while every individual run still pays something.
    let banked = 0;
    for (let run = 0; run < 20; run += 1) {
      const granted = applyDailyXpTaper(150, banked);
      expect(granted).toBeGreaterThan(0);
      banked += granted;
    }

    expect(banked).toBeLessThan(20 * 150);
  });

  it('handles junk input', () => {
    expect(applyDailyXpTaper(NaN, 0)).toBe(0);
    expect(applyDailyXpTaper(-50, 0)).toBe(0);
    expect(applyDailyXpTaper(100, NaN)).toBe(100);
  });
});

describe('grantXP', () => {
  it('banks the full amount while under the day’s limit', async () => {
    expect(await grantXP(120)).toBe(120);
    expect(await getXP()).toBe(120);
    expect(await getGrantedXPToday()).toBe(120);
  });

  it('tapers once the day’s full-rate limit is passed', async () => {
    await grantXP(FULL_RATE_LIMIT);
    expect(await grantXP(100)).toBe(50);
    expect(await getXP()).toBe(FULL_RATE_LIMIT + 50);
  });

  it('tracks only what was actually banked, not what was requested', async () => {
    await grantXP(FULL_RATE_LIMIT + 200);
    expect(await getGrantedXPToday()).toBe(await getXP());
  });

  it('ignores non-positive and junk amounts', async () => {
    expect(await grantXP(0)).toBe(0);
    expect(await grantXP(-10)).toBe(0);
    expect(await grantXP(NaN)).toBe(0);
    expect(await getXP()).toBe(0);
  });
});

describe('previewGrantXP', () => {
  it('reports what grantXP would give without banking it', async () => {
    await grantXP(FULL_RATE_LIMIT);
    expect(await previewGrantXP(100)).toBe(50);
    expect(await getXP()).toBe(FULL_RATE_LIMIT);
    expect(await grantXP(100)).toBe(50);
  });

  it('carries a pending amount so a batch is tapered as one', async () => {
    await grantXP(FULL_RATE_LIMIT - 100);
    // Previewing 100 + 100 item by item without the offset would report 100 + 100;
    // the second half actually lands in the reduced band.
    expect(await previewGrantXP(100, 0)).toBe(100);
    expect(await previewGrantXP(100, 100)).toBe(50);
  });
});

describe('awardActivityXPOnceToday with the daily cap', () => {
  it('tapers activity awards too, so no mode escapes the day’s limit', async () => {
    await grantXP(FULL_RATE_LIMIT);
    expect(await awardActivityXPOnceToday('vocabulary:vocab-rush:impossible', 100)).toBe(50);
  });

  it('previewing matches what awarding then gives', async () => {
    await grantXP(FULL_RATE_LIMIT - 40);
    const preview = await previewActivityXPOnceToday('grammar:lesson-1', 100);
    expect(await awardActivityXPOnceToday('grammar:lesson-1', 100)).toBe(preview);
  });
});

describe('markWordXpAwardedToday / hasWordXpAwardedToday', () => {
  it('returns false before a word is marked', async () => {
    expect(await hasWordXpAwardedToday('hello|bonjour')).toBe(false);
  });

  it('returns true after a word is marked', async () => {
    await markWordXpAwardedToday('hello|bonjour');
    expect(await hasWordXpAwardedToday('hello|bonjour')).toBe(true);
  });

  it('does not affect other words', async () => {
    await markWordXpAwardedToday('hello|bonjour');
    expect(await hasWordXpAwardedToday('goodbye|au revoir')).toBe(false);
  });
});
