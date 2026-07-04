import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../features/account/accountStorage', () => ({
  syncXPToCloudIfSignedIn: jest.fn(() => Promise.resolve()),
}));

import {
  getXP,
  addXP,
  awardActivityXPOnceToday,
  hasWordXpAwardedToday,
  markWordXpAwardedToday,
  clearLocalXPProgress,
} from '../features/progress/xpStorage';

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

  it('returns 0 and does not add XP on a duplicate call same day', async () => {
    await awardActivityXPOnceToday('grammar:lesson-1', 20);
    const second = await awardActivityXPOnceToday('grammar:lesson-1', 20);
    expect(second).toBe(0);
    expect(await getXP()).toBe(20);
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
