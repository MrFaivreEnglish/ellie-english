import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getDueReviewWords,
  getMasteredReviewWordCount,
  getReviewWordCloudItems,
  getReviewWords,
  mergeReviewWordCloudItems,
  recordReviewMistake,
  recordReviewSuccess,
} from '../features/vocabulary/reviewWordsStorage';
import { buildWordReviewLesson, MAX_WORDS_PER_REVIEW } from '../features/vocabulary/wordReviewLesson';

const store: Record<string, string> = {};
const cat = { english: 'cat', french: 'chat' };
const dog = { english: 'dog', french: 'chien' };

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  jest.mocked(AsyncStorage.getItem).mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
  jest.mocked(AsyncStorage.setItem).mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
  jest.mocked(AsyncStorage.removeItem).mockImplementation((key: string) => {
    delete store[key];
    return Promise.resolve();
  });
  jest.useFakeTimers();
  setDay('2026-03-10');
});

afterEach(() => {
  jest.useRealTimers();
});

const setDay = (day: string) => jest.setSystemTime(new Date(`${day}T12:00:00`));

describe('words to review', () => {
  it('brings a mistake back the next day, not the same day', async () => {
    await recordReviewMistake(cat, 'Animals');

    expect(await getDueReviewWords()).toEqual([]);
    setDay('2026-03-11');
    const due = await getDueReviewWords();
    expect(due.map((word) => word.english)).toEqual(['cat']);
    expect(due[0].lessonTitle).toBe('Animals');
  });

  it('ignores a correct answer before the word is due', async () => {
    await recordReviewMistake(cat);
    await recordReviewSuccess(cat);

    setDay('2026-03-11');
    expect((await getDueReviewWords())[0].step).toBe(0);
  });

  it('spaces correct reviews 1, 3 then 7 days apart and then lets the word go', async () => {
    await recordReviewMistake(cat);

    setDay('2026-03-11');
    await recordReviewSuccess(cat);
    expect((await getReviewWords())[0].dueOn).toBe('2026-03-14');

    setDay('2026-03-14');
    await recordReviewSuccess(cat);
    expect((await getReviewWords())[0].dueOn).toBe('2026-03-21');

    setDay('2026-03-21');
    await recordReviewSuccess(cat);
    expect(await getReviewWords()).toEqual([]);
    expect(await getMasteredReviewWordCount()).toBe(1);
  });

  it('starts over after a new mistake and counts every mistake', async () => {
    await recordReviewMistake(cat);
    setDay('2026-03-11');
    await recordReviewSuccess(cat);

    setDay('2026-03-12');
    await recordReviewMistake(cat);

    const [word] = await getReviewWords();
    expect(word.step).toBe(0);
    expect(word.dueOn).toBe('2026-03-13');
    expect(word.mistakes).toBe(2);
  });

  it('keeps a quick mistake and correct answer in order', async () => {
    setDay('2026-03-11');
    await Promise.all([recordReviewMistake(dog), recordReviewSuccess(dog), recordReviewMistake(cat)]);

    expect((await getReviewWords()).map((word) => word.english).sort()).toEqual(['cat', 'dog']);
  });

  it('merges with the cloud copy word by word, newest change winning', async () => {
    await recordReviewMistake(cat);
    const [localCat] = await getReviewWordCloudItems();

    setDay('2026-03-11');
    await recordReviewSuccess(cat);
    // An older cloud copy of cat, and a dog only the cloud knows about.
    await mergeReviewWordCloudItems([
      localCat,
      { type: 'achievement', itemKey: 'review_word:dog|chien', value: { ...(localCat.value as object), english: 'dog', french: 'chien' } },
      { type: 'achievement', itemKey: 'mode_unlock:vocab-timer:x', value: {} },
    ]);

    const words = await getReviewWords();
    expect(words.find((word) => word.english === 'cat')?.step).toBe(1);
    expect(words.map((word) => word.english).sort()).toEqual(['cat', 'dog']);
  });

  it('builds a typing review lesson from at most one sitting of words', async () => {
    const many = Array.from({ length: MAX_WORDS_PER_REVIEW + 5 }, (_, index) => ({
      english: `word${index}`,
      french: `mot${index}`,
      lessonTitle: 'Animals',
      step: 0,
      dueOn: '2026-03-10',
      mistakes: 1,
      lastMistakeOn: '2026-03-09',
      updatedAt: '2026-03-09T12:00:00.000Z',
    }));

    const lesson = buildWordReviewLesson(many);
    expect(lesson.flashcards).toHaveLength(MAX_WORDS_PER_REVIEW);
    expect(lesson.isWordReview).toBe(true);
    expect((lesson.flashcards[0] as any).sourceLesson).toEqual({ title: 'Animals' });
  });
});
