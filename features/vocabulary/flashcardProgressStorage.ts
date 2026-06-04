import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteProgressItemFromCloudIfSignedIn,
  syncProgressItemToCloudIfSignedIn,
  type CloudProgressItem,
} from '../account/accountStorage';

const LEARNED_FLASHCARDS_PREFIX = '@learned_flashcards';
const LEARNED_FLASHCARDS_TODAY_PREFIX = '@learned_flashcards_today';

export type LearnedFlashcardSummary = {
  totalLearned: number;
  lessonCount: number;
  learnedToday: number;
};

const normalizeLessonKey = (lessonKey: string) =>
  lessonKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'lesson';

export const normalizeFlashcardLessonKey = normalizeLessonKey;

const getStorageKey = (lessonKey: string) => `${LEARNED_FLASHCARDS_PREFIX}:${normalizeLessonKey(lessonKey)}`;

const buildCloudItemKey = (lessonKey: string, wordKey: string) =>
  `${normalizeLessonKey(lessonKey)}:${wordKey.trim()}`;

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const buildCloudItem = (
  lessonKey: string,
  wordKey: string,
  options: { learnedOn?: string } = {}
): CloudProgressItem => ({
  type: 'vocab_learnt',
  itemKey: buildCloudItemKey(lessonKey, wordKey),
  value: {
    lessonKey: normalizeLessonKey(lessonKey),
    wordKey: wordKey.trim(),
    learned: true,
    ...(options.learnedOn ? { learnedOn: options.learnedOn } : {}),
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

export const getLearnedFlashcardKeys = async (lessonKey: string): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(lessonKey));
    return parseStringSet(raw);
  } catch {
    return new Set<string>();
  }
};

export const getLearnedFlashcardKeysByLesson = async (): Promise<Map<string, Set<string>>> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const learnedStorageKeys = allKeys.filter((key) => key.startsWith(`${LEARNED_FLASHCARDS_PREFIX}:`));
    const learnedEntries = await AsyncStorage.multiGet(learnedStorageKeys);
    const learnedByLesson = new Map<string, Set<string>>();

    learnedEntries.forEach(([storageKey, raw]) => {
      const lessonKey = storageKey.replace(`${LEARNED_FLASHCARDS_PREFIX}:`, '');
      const learnedKeys = parseStringSet(raw);

      if (learnedKeys.size > 0) {
        learnedByLesson.set(normalizeLessonKey(lessonKey), learnedKeys);
      }
    });

    return learnedByLesson;
  } catch {
    return new Map<string, Set<string>>();
  }
};

export const saveLearnedFlashcardKeys = async (lessonKey: string, keys: Set<string>) => {
  try {
    await AsyncStorage.setItem(getStorageKey(lessonKey), JSON.stringify([...keys]));
  } catch {}
};

export const recordLearnedFlashcardToday = async (
  lessonKey: string,
  wordKey: string,
  isLearned: boolean
) => {
  const normalizedWordKey = wordKey.trim();
  if (!normalizedWordKey) return;

  try {
    const storageKey = todayKey(LEARNED_FLASHCARDS_TODAY_PREFIX);
    const current = parseStringSet(await AsyncStorage.getItem(storageKey));
    const activityKey = `${normalizeLessonKey(lessonKey)}:${normalizedWordKey}`;

    if (isLearned) {
      current.add(activityKey);
      void syncProgressItemToCloudIfSignedIn(
        buildCloudItem(lessonKey, normalizedWordKey, { learnedOn: getLocalDateKey() })
      );
    } else {
      current.delete(activityKey);
      void deleteProgressItemFromCloudIfSignedIn('vocab_learnt', buildCloudItemKey(lessonKey, normalizedWordKey));
    }

    await AsyncStorage.setItem(storageKey, JSON.stringify([...current]));
  } catch {}
};

export const getLearnedFlashcardCloudItems = async (): Promise<CloudProgressItem[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const learnedStorageKeys = allKeys.filter((key) => key.startsWith(`${LEARNED_FLASHCARDS_PREFIX}:`));
    const learnedEntries = await AsyncStorage.multiGet(learnedStorageKeys);
    const todayLearned = parseStringSet(await AsyncStorage.getItem(todayKey(LEARNED_FLASHCARDS_TODAY_PREFIX)));
    const localDateKey = getLocalDateKey();
    const items: CloudProgressItem[] = [];

    learnedEntries.forEach(([storageKey, raw]) => {
      const lessonKey = storageKey.replace(`${LEARNED_FLASHCARDS_PREFIX}:`, '');
      const learnedKeys = parseStringSet(raw);

      learnedKeys.forEach((wordKey) => {
        const itemKey = buildCloudItemKey(lessonKey, wordKey);
        items.push(buildCloudItem(lessonKey, wordKey, {
          learnedOn: todayLearned.has(itemKey) ? localDateKey : undefined,
        }));
      });
    });

    return items;
  } catch {
    return [];
  }
};

export const mergeLearnedFlashcardCloudItems = async (items: CloudProgressItem[]) => {
  const grouped = new Map<string, Set<string>>();
  const todayLearned = parseStringSet(await AsyncStorage.getItem(todayKey(LEARNED_FLASHCARDS_TODAY_PREFIX)));
  const localDateKey = getLocalDateKey();

  items.forEach((item) => {
    if (item.type !== 'vocab_learnt') return;

    const lessonKey =
      typeof item.value?.lessonKey === 'string'
        ? item.value.lessonKey
        : item.itemKey.split(':')[0] || 'lesson';
    const wordKey =
      typeof item.value?.wordKey === 'string'
        ? item.value.wordKey
        : item.itemKey.split(':').slice(1).join(':');

    if (!wordKey) return;

    const group = grouped.get(lessonKey) ?? new Set<string>();
    group.add(wordKey);
    grouped.set(lessonKey, group);

    if (item.value?.learnedOn === localDateKey) {
      todayLearned.add(buildCloudItemKey(lessonKey, wordKey));
    }
  });

  await Promise.all([
    ...[...grouped.entries()].map(async ([lessonKey, wordKeys]) => {
      const existing = await getLearnedFlashcardKeys(lessonKey);
      wordKeys.forEach((wordKey) => existing.add(wordKey));
      await saveLearnedFlashcardKeys(lessonKey, existing);
    }),
    AsyncStorage.setItem(todayKey(LEARNED_FLASHCARDS_TODAY_PREFIX), JSON.stringify([...todayLearned])),
  ]);
};

export const getLearnedFlashcardSummary = async (): Promise<LearnedFlashcardSummary> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const learnedStorageKeys = allKeys.filter((key) => key.startsWith(`${LEARNED_FLASHCARDS_PREFIX}:`));
    const learnedEntries = await AsyncStorage.multiGet(learnedStorageKeys);
    const todayLearned = parseStringSet(await AsyncStorage.getItem(todayKey(LEARNED_FLASHCARDS_TODAY_PREFIX)));

    let totalLearned = 0;
    let lessonCount = 0;

    learnedEntries.forEach(([, raw]) => {
      const keys = parseStringSet(raw);
      const learnedCount = keys.size;

      if (learnedCount > 0) {
        lessonCount += 1;
        totalLearned += learnedCount;
      }
    });

    return {
      totalLearned,
      lessonCount,
      learnedToday: todayLearned.size,
    };
  } catch {
    return {
      totalLearned: 0,
      lessonCount: 0,
      learnedToday: 0,
    };
  }
};

export const clearLearnedFlashcardProgress = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const progressKeys = allKeys.filter(
      (key) =>
        key.startsWith(`${LEARNED_FLASHCARDS_PREFIX}:`) ||
        key.startsWith(`${LEARNED_FLASHCARDS_TODAY_PREFIX}:`)
    );

    if (progressKeys.length > 0) {
      await AsyncStorage.multiRemove(progressKeys);
    }
  } catch {}
};
