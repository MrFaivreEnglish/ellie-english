import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../features/account/accountStorage', () => ({
  syncXPToCloudIfSignedIn: jest.fn(() => Promise.resolve()),
  syncProgressItemToCloudIfSignedIn: jest.fn(() => Promise.resolve()),
  deleteProgressItemFromCloudIfSignedIn: jest.fn(() => Promise.resolve()),
}));

import type { CloudProgressItem } from '../features/account/accountStorage';
import {
  getGrammarCorrectAnswerKeys,
  getGrammarProgressCloudItems,
  getGrammarProgressSummary,
  mergeGrammarProgressCloudItems,
  recordGrammarCorrectAnswer,
} from '../features/grammar/grammarProgressStorage';
import {
  getLearnedFlashcardCloudItems,
  getLearnedFlashcardKeys,
  getLearnedFlashcardSummary,
  mergeLearnedFlashcardCloudItems,
  recordLearnedFlashcardToday,
  saveLearnedFlashcardKeys,
} from '../features/vocabulary/flashcardProgressStorage';
import {
  clearLocalStudentProgress,
  getLocalStudentProgressCloudItems,
  getLocalStudentProgressSnapshot,
  mergeCloudStudentProgressItems,
  replaceLocalStudentProgressFromCloud,
  restoreLocalStudentProgressSnapshot,
} from '../features/progress/studentProgressStorage';
import { getXP } from '../features/progress/xpStorage';

// These merges are the only code that writes a student's progress from somewhere other
// than their own practice, so a mistake here silently wipes or duplicates their work.

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
  jest.mocked(AsyncStorage.multiSet).mockImplementation((pairs: ReadonlyArray<readonly [string, string]>) => {
    pairs.forEach(([key, value]) => {
      store[key] = value;
    });
    return Promise.resolve();
  });
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

const grammarItem = (lessonKey: string, answerKey: string, savedOn?: string): CloudProgressItem => ({
  type: 'grammar_correct',
  itemKey: `${lessonKey}:${answerKey}`,
  value: { lessonKey, answerKey, ...(savedOn ? { savedOn } : {}) },
});

const vocabItem = (lessonKey: string, wordKey: string, learnedOn?: string): CloudProgressItem => ({
  type: 'vocab_learnt',
  itemKey: `${lessonKey}:${wordKey}`,
  value: { lessonKey, wordKey, learned: true, ...(learnedOn ? { learnedOn } : {}) },
});

describe('grammar progress merge', () => {
  it('survives a round trip through the cloud format', async () => {
    await recordGrammarCorrectAnswer('present-simple', 'q1');
    await recordGrammarCorrectAnswer('present-simple', 'q2');
    await recordGrammarCorrectAnswer('be-verb', 'q1');
    const items = await getGrammarProgressCloudItems();

    await clearLocalStudentProgress();
    await mergeGrammarProgressCloudItems(items);

    expect(await getGrammarCorrectAnswerKeys('present-simple')).toEqual(new Set(['q1', 'q2']));
    expect(await getGrammarCorrectAnswerKeys('be-verb')).toEqual(new Set(['q1']));
    expect((await getGrammarProgressSummary()).correctToday).toBe(3);
  });

  it('adds cloud answers without dropping ones only saved on this phone', async () => {
    await recordGrammarCorrectAnswer('present-simple', 'q1');

    await mergeGrammarProgressCloudItems([grammarItem('present-simple', 'q2')]);

    expect(await getGrammarCorrectAnswerKeys('present-simple')).toEqual(new Set(['q1', 'q2']));
  });

  it('only counts cloud answers toward today when they were saved today', async () => {
    await mergeGrammarProgressCloudItems([
      grammarItem('present-simple', 'q1', '2026-03-10'),
      grammarItem('present-simple', 'q2', '2026-03-09'),
      grammarItem('present-simple', 'q3'),
    ]);

    const summary = await getGrammarProgressSummary();
    expect(summary.totalCorrectAnswers).toBe(3);
    expect(summary.correctToday).toBe(1);
  });

  it('reads older items that only carry an item key, keeping colons in the answer', async () => {
    await mergeGrammarProgressCloudItems([
      { type: 'grammar_correct', itemKey: 'present-simple:fill:3', value: {} },
    ]);

    expect(await getGrammarCorrectAnswerKeys('present-simple')).toEqual(new Set(['fill:3']));
  });

  it('ignores items of other types', async () => {
    await mergeGrammarProgressCloudItems([vocabItem('animals', 'cat|chat')]);

    expect((await getGrammarProgressSummary()).totalCorrectAnswers).toBe(0);
  });
});

describe('flashcard progress merge', () => {
  it('survives a round trip through the cloud format', async () => {
    await saveLearnedFlashcardKeys('animals', new Set(['cat|chat', 'dog|chien']));
    await recordLearnedFlashcardToday('animals', 'cat|chat', true);
    const items = await getLearnedFlashcardCloudItems();

    await clearLocalStudentProgress();
    await mergeLearnedFlashcardCloudItems(items);

    expect(await getLearnedFlashcardKeys('animals')).toEqual(new Set(['cat|chat', 'dog|chien']));
    expect((await getLearnedFlashcardSummary()).learnedToday).toBe(1);
  });

  it('adds cloud words without dropping ones only learnt on this phone', async () => {
    await saveLearnedFlashcardKeys('animals', new Set(['cat|chat']));

    await mergeLearnedFlashcardCloudItems([vocabItem('animals', 'dog|chien')]);

    expect(await getLearnedFlashcardKeys('animals')).toEqual(new Set(['cat|chat', 'dog|chien']));
  });

  it('only counts cloud words toward today when they were learnt today', async () => {
    await mergeLearnedFlashcardCloudItems([
      vocabItem('animals', 'cat|chat', '2026-03-10'),
      vocabItem('animals', 'dog|chien', '2026-03-02'),
    ]);

    const summary = await getLearnedFlashcardSummary();
    expect(summary.totalLearned).toBe(2);
    expect(summary.learnedToday).toBe(1);
  });
});

describe('whole-progress restore', () => {
  it('restores a guest snapshot and leaves settings alone', async () => {
    store['@theme'] = 'dark';
    store['TOTAL_XP'] = '420';
    await recordGrammarCorrectAnswer('present-simple', 'q1');
    await saveLearnedFlashcardKeys('animals', new Set(['cat|chat']));
    const snapshot = await getLocalStudentProgressSnapshot();
    const progressBefore = await getLocalStudentProgressCloudItems();

    await recordGrammarCorrectAnswer('present-simple', 'q2');
    await saveLearnedFlashcardKeys('food', new Set(['apple|pomme']));
    store['TOTAL_XP'] = '999';
    await restoreLocalStudentProgressSnapshot(snapshot);

    expect(await getLocalStudentProgressCloudItems()).toEqual(progressBefore);
    expect(await getGrammarCorrectAnswerKeys('present-simple')).toEqual(new Set(['q1']));
    expect(await getLearnedFlashcardKeys('food')).toEqual(new Set());
    expect(store['@theme']).toBe('dark');
    expect(await getXP()).toBe(420);
  });

  it('replacing from the cloud drops progress that was only on this phone', async () => {
    await recordGrammarCorrectAnswer('present-simple', 'local-only');
    store['TOTAL_XP'] = '50';

    await replaceLocalStudentProgressFromCloud(300, [grammarItem('present-simple', 'q1')]);

    expect(await getGrammarCorrectAnswerKeys('present-simple')).toEqual(new Set(['q1']));
    expect(await getXP()).toBe(300);
  });

  it('merging everything back from its own cloud items changes nothing', async () => {
    await recordGrammarCorrectAnswer('present-simple', 'q1');
    await saveLearnedFlashcardKeys('animals', new Set(['cat|chat']));
    const before = await getLocalStudentProgressCloudItems();

    await mergeCloudStudentProgressItems(before);

    expect(await getLocalStudentProgressCloudItems()).toEqual(before);
    expect((await getGrammarProgressSummary()).correctToday).toBe(1);
  });
});
