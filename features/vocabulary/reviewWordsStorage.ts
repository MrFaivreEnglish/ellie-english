import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CloudProgressItem } from '../account/accountStorage';
import type { Word } from '../../types/VocabularyTypes';

// Words a student got wrong while typing, brought back for review on a widening schedule
// so a mistake turns into a word they actually keep.
export const REVIEW_WORDS_KEY = '@review_words_v1';

// Days to wait before each review after a mistake. Typing the word correctly once it's due
// moves it on to the next gap; after the last gap it's mastered and leaves the list. A new
// mistake at any point starts it over from the first gap.
export const REVIEW_GAPS_IN_DAYS = [1, 3, 7];

// One cloud row per word (stored as an "achievement" row, so the table needs no new type).
// A single row holding the whole list would let one upload of an empty list wipe it.
const REVIEW_WORD_CLOUD_PREFIX = 'review_word:';

export type ReviewWord = {
  english: string;
  french: string;
  alternatives?: string[];
  lessonTitle?: string;
  // Index into REVIEW_GAPS_IN_DAYS of the gap currently running.
  step: number;
  // Local calendar date (YYYY-MM-DD) the word is next due.
  dueOn: string;
  mistakes: number;
  lastMistakeOn: string;
  // Mastered words are kept as a marker rather than deleted, so the copy on another phone
  // or in the cloud can't bring them back. They never show in the list.
  masteredOn?: string;
  // When this entry last changed; on a merge the newer copy wins.
  updatedAt: string;
};

type ReviewWordMap = Record<string, ReviewWord>;

export const getReviewWordKey = (word: Pick<Word, 'english' | 'french'>) =>
  `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayKey = () => toDateKey(new Date());

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

const isReviewWord = (value: unknown): value is ReviewWord => {
  const entry = value as ReviewWord | null;
  return !!entry
    && typeof entry.english === 'string'
    && typeof entry.french === 'string'
    && typeof entry.dueOn === 'string'
    && typeof entry.step === 'number'
    && typeof entry.updatedAt === 'string';
};

const readReviewWords = async (): Promise<ReviewWordMap> => {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_WORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const words: ReviewWordMap = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (isReviewWord(value)) words[key] = value;
    });
    return words;
  } catch {
    return {};
  }
};

// Typing answers arrive faster than storage writes finish; run updates one at a time so a
// quick mistake-then-correct can't overwrite each other.
let writeQueue: Promise<unknown> = Promise.resolve();

const updateReviewWords = (change: (words: ReviewWordMap) => void) => {
  const next = writeQueue.catch(() => {}).then(async () => {
    const words = await readReviewWords();
    change(words);
    await AsyncStorage.setItem(REVIEW_WORDS_KEY, JSON.stringify(words));
  });
  writeQueue = next;
  return next.catch(() => {});
};

export const recordReviewMistake = (word: Word, lessonTitle?: string) => {
  const english = word.english.trim();
  const french = word.french.trim();
  if (!english || !french) return Promise.resolve();

  return updateReviewWords((words) => {
    const key = getReviewWordKey(word);
    const existing = words[key];
    const keptLessonTitle = existing?.lessonTitle ?? lessonTitle;
    words[key] = {
      english,
      french,
      ...(word.alternatives?.length ? { alternatives: word.alternatives } : {}),
      ...(keptLessonTitle ? { lessonTitle: keptLessonTitle } : {}),
      step: 0,
      dueOn: addDays(REVIEW_GAPS_IN_DAYS[0]),
      mistakes: (existing?.mistakes ?? 0) + 1,
      lastMistakeOn: getTodayKey(),
      updatedAt: new Date().toISOString(),
    };
  });
};

// Only a correct answer once the word is due counts. Retyping it right after the mistake,
// in the same session or later that day, is still short-term memory.
export const recordReviewSuccess = (word: Pick<Word, 'english' | 'french'>) =>
  updateReviewWords((words) => {
    const key = getReviewWordKey(word);
    const existing = words[key];
    const today = getTodayKey();
    if (!existing || existing.masteredOn || existing.dueOn > today) return;

    const nextStep = existing.step + 1;
    words[key] = nextStep >= REVIEW_GAPS_IN_DAYS.length
      ? { ...existing, step: nextStep, masteredOn: today, updatedAt: new Date().toISOString() }
      : { ...existing, step: nextStep, dueOn: addDays(REVIEW_GAPS_IN_DAYS[nextStep]), updatedAt: new Date().toISOString() };
  });

const byDueDateThenMistakes = (a: ReviewWord, b: ReviewWord) =>
  a.dueOn.localeCompare(b.dueOn) || b.mistakes - a.mistakes;

// Words still being reviewed, soonest due first.
export const getReviewWords = async (): Promise<ReviewWord[]> =>
  Object.values(await readReviewWords())
    .filter((word) => !word.masteredOn)
    .sort(byDueDateThenMistakes);

export const getDueReviewWords = async (): Promise<ReviewWord[]> => {
  const today = getTodayKey();
  return (await getReviewWords()).filter((word) => word.dueOn <= today);
};

export const getMasteredReviewWordCount = async () =>
  Object.values(await readReviewWords()).filter((word) => !!word.masteredOn).length;

export const getReviewWordCloudItems = async (): Promise<CloudProgressItem[]> =>
  Object.entries(await readReviewWords()).map(([key, word]) => ({
    type: 'achievement' as const,
    itemKey: `${REVIEW_WORD_CLOUD_PREFIX}${key}`,
    value: word,
  }));

export const mergeReviewWordCloudItems = async (items: CloudProgressItem[]) => {
  const cloudWords = items
    .filter((item) => item.type === 'achievement' && item.itemKey.startsWith(REVIEW_WORD_CLOUD_PREFIX))
    .map((item) => [item.itemKey.slice(REVIEW_WORD_CLOUD_PREFIX.length), item.value] as const)
    .filter((entry): entry is readonly [string, ReviewWord] => entry[0].length > 0 && isReviewWord(entry[1]));

  if (cloudWords.length === 0) return;

  await updateReviewWords((words) => {
    cloudWords.forEach(([key, cloudWord]) => {
      const local = words[key];
      if (!local || cloudWord.updatedAt > local.updatedAt) words[key] = cloudWord;
    });
  });
};

export const clearReviewWords = async () => {
  await writeQueue.catch(() => {});
  try {
    await AsyncStorage.removeItem(REVIEW_WORDS_KEY);
  } catch {}
};
