import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  syncProgressItemToCloudIfSignedIn,
  type CloudProgressItem,
} from '../account/accountStorage';
import { recordPracticeToday } from '../progress/streakStorage';

const GRAMMAR_PROGRESS_PREFIX = '@grammar_progress';
const GRAMMAR_PROGRESS_TODAY_PREFIX = '@grammar_progress_today';

export type GrammarProgressSummary = {
  totalCorrectAnswers: number;
  lessonCount: number;
  correctToday: number;
};

let grammarSummaryCache: Promise<GrammarProgressSummary> | null = null;
let grammarSummaryCacheDate = '';

const invalidateGrammarProgressCache = () => {
  grammarSummaryCache = null;
  grammarSummaryCacheDate = '';
};

const normalizeLessonKey = (lessonKey: string) =>
  lessonKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'grammar-lesson';

const getStorageKey = (lessonKey: string) => `${GRAMMAR_PROGRESS_PREFIX}:${normalizeLessonKey(lessonKey)}`;

const buildCloudItemKey = (lessonKey: string, answerKey: string) =>
  `${normalizeLessonKey(lessonKey)}:${answerKey.trim()}`;

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const buildCloudItem = (
  lessonKey: string,
  answerKey: string,
  options: { savedOn?: string } = {}
): CloudProgressItem => ({
  type: 'grammar_correct',
  itemKey: buildCloudItemKey(lessonKey, answerKey),
  value: {
    lessonKey: normalizeLessonKey(lessonKey),
    answerKey: answerKey.trim(),
    ...(options.savedOn ? { savedOn: options.savedOn } : {}),
  },
});

const todayKey = (prefix: string) => `${prefix}:${getLocalDateKey()}`;

const parseStringSet = (raw: string | null) => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? new Set(parsed.filter((item) => typeof item === 'string'))
      : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

const saveStringSet = async (key: string, values: Set<string>) => {
  await AsyncStorage.setItem(key, JSON.stringify([...values]));
};

export const getGrammarLessonProgressKey = (lesson: { id?: string | number; title?: string } | string) => {
  if (typeof lesson === 'string') return lesson;

  return String(lesson.id ?? lesson.title ?? 'grammar-lesson');
};

export const getGrammarCorrectAnswerKeys = async (lessonKey: string): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(lessonKey));
    return parseStringSet(raw);
  } catch {
    return new Set<string>();
  }
};

export const getGrammarLessonProgressCounts = async (lessonKeys: string[]): Promise<Record<string, number>> => {
  try {
    const uniqueLessonKeys = [...new Set(lessonKeys.filter((key) => key.trim()))];
    const storageKeys = uniqueLessonKeys.map(getStorageKey);
    const entries = await AsyncStorage.multiGet(storageKeys);

    return uniqueLessonKeys.reduce<Record<string, number>>((counts, lessonKey, index) => {
      counts[lessonKey] = parseStringSet(entries[index]?.[1] ?? null).size;
      return counts;
    }, {});
  } catch {
    return {};
  }
};

export type GrammarAnswerSaveResult = 'saved' | 'reviewed' | 'unsaved';

export const recordGrammarCorrectAnswer = async (
  lessonKey: string,
  answerKey: string,
): Promise<GrammarAnswerSaveResult> => {
  const normalizedLessonKey = lessonKey.trim();
  const normalizedAnswerKey = answerKey.trim();
  if (!normalizedLessonKey || !normalizedAnswerKey) return 'unsaved';

  try {
    const storageKey = getStorageKey(normalizedLessonKey);
    const todayStorageKey = todayKey(GRAMMAR_PROGRESS_TODAY_PREFIX);
    const allCorrectAnswers = parseStringSet(await AsyncStorage.getItem(storageKey));
    const todayCorrectAnswers = parseStringSet(await AsyncStorage.getItem(todayStorageKey));
    const todayAnswerKey = `${normalizeLessonKey(normalizedLessonKey)}:${normalizedAnswerKey}`;
    const isNewCorrectAnswer = !allCorrectAnswers.has(normalizedAnswerKey);

    allCorrectAnswers.add(normalizedAnswerKey);
    todayCorrectAnswers.add(todayAnswerKey);

    await Promise.all([
      saveStringSet(storageKey, allCorrectAnswers),
      saveStringSet(todayStorageKey, todayCorrectAnswers),
    ]);
    invalidateGrammarProgressCache();

    void recordPracticeToday();
    void syncProgressItemToCloudIfSignedIn(
      buildCloudItem(normalizedLessonKey, normalizedAnswerKey, { savedOn: getLocalDateKey() })
    );
    return isNewCorrectAnswer ? 'saved' : 'reviewed';
  } catch (error) {
    console.warn('Failed to save grammar answer progress', error);
    return 'unsaved';
  }
};

export const getGrammarProgressCloudItems = async (): Promise<CloudProgressItem[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const progressStorageKeys = allKeys.filter((key) => key.startsWith(`${GRAMMAR_PROGRESS_PREFIX}:`));
    const progressEntries = await AsyncStorage.multiGet(progressStorageKeys);
    const todayCorrectAnswers = parseStringSet(await AsyncStorage.getItem(todayKey(GRAMMAR_PROGRESS_TODAY_PREFIX)));
    const localDateKey = getLocalDateKey();
    const items: CloudProgressItem[] = [];

    progressEntries.forEach(([storageKey, raw]) => {
      const lessonKey = storageKey.replace(`${GRAMMAR_PROGRESS_PREFIX}:`, '');
      const correctAnswers = parseStringSet(raw);

      correctAnswers.forEach((answerKey) => {
        const itemKey = buildCloudItemKey(lessonKey, answerKey);
        items.push(buildCloudItem(lessonKey, answerKey, {
          savedOn: todayCorrectAnswers.has(itemKey) ? localDateKey : undefined,
        }));
      });
    });

    return items;
  } catch {
    return [];
  }
};

export const mergeGrammarProgressCloudItems = async (items: CloudProgressItem[]) => {
  const grouped = new Map<string, Set<string>>();
  const todayCorrectAnswers = parseStringSet(await AsyncStorage.getItem(todayKey(GRAMMAR_PROGRESS_TODAY_PREFIX)));
  const localDateKey = getLocalDateKey();

  items.forEach((item) => {
    if (item.type !== 'grammar_correct') return;

    const lessonKey =
      typeof item.value?.lessonKey === 'string'
        ? item.value.lessonKey
        : item.itemKey.split(':')[0] || 'grammar-lesson';
    const answerKey =
      typeof item.value?.answerKey === 'string'
        ? item.value.answerKey
        : item.itemKey.split(':').slice(1).join(':');

    if (!answerKey) return;

    const group = grouped.get(lessonKey) ?? new Set<string>();
    group.add(answerKey);
    grouped.set(lessonKey, group);

    if (item.value?.savedOn === localDateKey) {
      todayCorrectAnswers.add(buildCloudItemKey(lessonKey, answerKey));
    }
  });

  await Promise.all([
    ...[...grouped.entries()].map(async ([lessonKey, answerKeys]) => {
      const existing = await getGrammarCorrectAnswerKeys(lessonKey);
      answerKeys.forEach((answerKey) => existing.add(answerKey));
      await saveStringSet(getStorageKey(lessonKey), existing);
    }),
    saveStringSet(todayKey(GRAMMAR_PROGRESS_TODAY_PREFIX), todayCorrectAnswers),
  ]);
  invalidateGrammarProgressCache();
};

const readGrammarProgressSummary = async (): Promise<GrammarProgressSummary> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const progressStorageKeys = allKeys.filter((key) => key.startsWith(`${GRAMMAR_PROGRESS_PREFIX}:`));
    const progressEntries = await AsyncStorage.multiGet(progressStorageKeys);
    const todayCorrectAnswers = parseStringSet(await AsyncStorage.getItem(todayKey(GRAMMAR_PROGRESS_TODAY_PREFIX)));

    let totalCorrectAnswers = 0;
    let lessonCount = 0;

    progressEntries.forEach(([, raw]) => {
      const keys = parseStringSet(raw);
      const correctCount = keys.size;

      if (correctCount > 0) {
        lessonCount += 1;
        totalCorrectAnswers += correctCount;
      }
    });

    return {
      totalCorrectAnswers,
      lessonCount,
      correctToday: todayCorrectAnswers.size,
    };
  } catch {
    return {
      totalCorrectAnswers: 0,
      lessonCount: 0,
      correctToday: 0,
    };
  }
};

export const getGrammarProgressSummary = async (): Promise<GrammarProgressSummary> => {
  const localDateKey = getLocalDateKey();

  if (!grammarSummaryCache || grammarSummaryCacheDate !== localDateKey) {
    grammarSummaryCacheDate = localDateKey;
    grammarSummaryCache = readGrammarProgressSummary();
  }

  return grammarSummaryCache;
};

export const getGrammarLessonKeysPracticedToday = async (): Promise<Set<string>> => {
  try {
    const todayAnswers = parseStringSet(await AsyncStorage.getItem(todayKey(GRAMMAR_PROGRESS_TODAY_PREFIX)));
    const lessonKeys = new Set<string>();
    todayAnswers.forEach((itemKey) => {
      const sep = itemKey.indexOf(':');
      if (sep > 0) lessonKeys.add(itemKey.slice(0, sep));
    });
    return lessonKeys;
  } catch {
    return new Set<string>();
  }
};

// Only today's set is ever read (today's count and lessons practised today); past days
// were never deleted, so each practice day left one behind for good.
export const pruneOldGrammarDays = async () => {
  try {
    const currentDayKey = todayKey(GRAMMAR_PROGRESS_TODAY_PREFIX);
    const allKeys = await AsyncStorage.getAllKeys();
    const pastDayKeys = allKeys.filter(
      (key) => key.startsWith(`${GRAMMAR_PROGRESS_TODAY_PREFIX}:`) && key !== currentDayKey
    );

    if (pastDayKeys.length > 0) {
      await AsyncStorage.multiRemove(pastDayKeys);
    }
  } catch {}
};

export const clearGrammarProgress = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const progressKeys = allKeys.filter(
      (key) =>
        key.startsWith(`${GRAMMAR_PROGRESS_PREFIX}:`) ||
        key.startsWith(`${GRAMMAR_PROGRESS_TODAY_PREFIX}:`)
    );

    if (progressKeys.length > 0) {
      await AsyncStorage.multiRemove(progressKeys);
    }
    invalidateGrammarProgressCache();
  } catch {}
};
