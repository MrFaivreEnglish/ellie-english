import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../features/account/accountStorage', () => ({
  syncXPToCloudIfSignedIn: jest.fn(() => Promise.resolve()),
  syncProgressItemToCloudIfSignedIn: jest.fn(() => Promise.resolve()),
  deleteProgressItemFromCloudIfSignedIn: jest.fn(() => Promise.resolve()),
}));

import { pruneOldDailyProgressRecords } from '../features/progress/studentProgressStorage';
import { getLearnedFlashcardRecencyByActivityKey } from '../features/vocabulary/flashcardProgressStorage';

const store: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];

  jest.mocked(AsyncStorage.getItem).mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
  jest.mocked(AsyncStorage.setItem).mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
  jest.mocked(AsyncStorage.getAllKeys).mockImplementation(() => Promise.resolve(Object.keys(store)));
  jest.mocked(AsyncStorage.multiGet).mockImplementation((keys: readonly string[]) =>
    Promise.resolve(keys.map((key) => [key, store[key] ?? null] as [string, string | null]))
  );
  jest.mocked(AsyncStorage.multiRemove).mockImplementation((keys: readonly string[]) => {
    keys.forEach((key) => delete store[key]);
    return Promise.resolve();
  });

  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-10T12:00:00'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('pruneOldDailyProgressRecords', () => {
  it('deletes past days of XP and grammar records and keeps today', async () => {
    store['TYPING_WORD_XP_AWARDED_2026-03-09'] = '["cat|chat"]';
    store['PRACTICE_XP_AWARDED_2026-03-01'] = '["grammar:1"]';
    store['DAILY_PRACTICE_ACTIVITY_2026-02-20'] = '["a"]';
    store['DAILY_GRANTED_XP_2026-03-09'] = '120';
    store['@grammar_progress_today:2026-03-09'] = '["lesson:1"]';
    store['DAILY_GRANTED_XP_2026-03-10'] = '40';
    store['@grammar_progress_today:2026-03-10'] = '["lesson:2"]';
    store['TOTAL_XP'] = '900';
    store['@grammar_progress:lesson'] = '["1"]';

    await pruneOldDailyProgressRecords();

    expect(Object.keys(store).sort()).toEqual([
      '@grammar_progress:lesson',
      '@grammar_progress_today:2026-03-10',
      'DAILY_GRANTED_XP_2026-03-10',
      'TOTAL_XP',
    ]);
  });

  it('folds past flashcard days into one recency record without changing what Vocab Rush sees', async () => {
    store['@learned_flashcards_today:2026-03-01'] = '["animals:cat", "animals:dog"]';
    store['@learned_flashcards_today:2026-03-05'] = '["animals:cat"]';
    store['@learned_flashcards_today:2026-03-10'] = '["food:apple"]';
    const before = await getLearnedFlashcardRecencyByActivityKey();

    await pruneOldDailyProgressRecords();

    expect(store['@learned_flashcards_today:2026-03-01']).toBeUndefined();
    expect(store['@learned_flashcards_today:2026-03-05']).toBeUndefined();
    expect(store['@learned_flashcards_today:2026-03-10']).toBe('["food:apple"]');
    expect(await getLearnedFlashcardRecencyByActivityKey()).toEqual(before);
    expect(before.get('animals:cat')).toBe('2026-03-05');
  });

  it('merges into an existing recency record on later runs', async () => {
    store['@learned_flashcards_today:2026-03-01'] = '["animals:cat"]';
    await pruneOldDailyProgressRecords();

    jest.setSystemTime(new Date('2026-03-12T12:00:00'));
    store['@learned_flashcards_today:2026-03-11'] = '["animals:dog"]';
    await pruneOldDailyProgressRecords();

    const recency = await getLearnedFlashcardRecencyByActivityKey();
    expect(recency.get('animals:cat')).toBe('2026-03-01');
    expect(recency.get('animals:dog')).toBe('2026-03-11');
  });
});
