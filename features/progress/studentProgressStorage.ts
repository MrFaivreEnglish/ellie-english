import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CloudProgressItem } from '../account/accountStorage';
import {
  LEARNED_FLASHCARDS_RECENCY_KEY,
  clearLearnedFlashcardProgress,
  condenseOldLearnedFlashcardDays,
  getLearnedFlashcardCloudItems,
  mergeLearnedFlashcardCloudItems,
} from '../vocabulary/flashcardProgressStorage';
import {
  clearGrammarProgress,
  getGrammarProgressCloudItems,
  pruneOldGrammarDays,
  mergeGrammarProgressCloudItems,
} from '../grammar/grammarProgressStorage';
import {
  clearVocabularyTimerBests,
  getVocabularyTimerBestCloudItems,
  mergeVocabularyTimerBestCloudItems,
} from '../vocabulary/vocabularyTimerStorage';
import {
  clearShinyEllieProgress,
  getShinyEllieCloudItems,
  mergeShinyEllieCloudItems,
  type ShinyEllieProgress,
} from './shinyEllieStorage';
import {
  MODE_UNLOCKS_KEY,
  clearModeUnlocks,
  getModeUnlockCloudItems,
  mergeModeUnlockCloudItems,
} from './modeUnlockStorage';
import { clearLocalXPProgress, pruneOldDailyXPRecords, setLocalXP } from './xpStorage';
import {
  REVIEW_WORDS_KEY,
  clearReviewWords,
  getReviewWordCloudItems,
  mergeReviewWordCloudItems,
} from '../vocabulary/reviewWordsStorage';

export type LocalStudentProgressSnapshot = {
  entries: [string, string][];
};

const LOCAL_PROGRESS_KEYS = new Set([
  'TOTAL_XP',
  '@vocabulary_timer_bests_v1',
  '@shiny_ellie_unlocked',
  '@shiny_ellie_mode',
  '@shiny_ellie_color_variant',
  '@shiny_ellie_presentation_mode',
  MODE_UNLOCKS_KEY,
  LEARNED_FLASHCARDS_RECENCY_KEY,
  REVIEW_WORDS_KEY,
]);

const LOCAL_PROGRESS_PREFIXES = [
  'TYPING_WORD_XP_AWARDED_',
  'PRACTICE_XP_AWARDED_',
  'DAILY_PRACTICE_ACTIVITY_',
  '@learned_flashcards:',
  '@learned_flashcards_today:',
  '@grammar_progress:',
  '@grammar_progress_today:',
];

const isLocalStudentProgressKey = (key: string) =>
  LOCAL_PROGRESS_KEYS.has(key) || LOCAL_PROGRESS_PREFIXES.some((prefix) => key.startsWith(prefix));

// Per-day records only matter for today; run once at startup so old days don't pile up.
export const pruneOldDailyProgressRecords = async () => {
  await Promise.all([
    pruneOldDailyXPRecords(),
    pruneOldGrammarDays(),
    condenseOldLearnedFlashcardDays(),
  ]);
};

export const clearLocalStudentProgress = async () => {
  await Promise.all([
    clearLocalXPProgress(),
    clearLearnedFlashcardProgress(),
    clearGrammarProgress(),
    clearVocabularyTimerBests(),
    clearShinyEllieProgress(),
    clearModeUnlocks(),
    clearReviewWords(),
  ]);
};

export const getLocalStudentProgressSnapshot = async (): Promise<LocalStudentProgressSnapshot> => {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter(isLocalStudentProgressKey);
    if (keys.length === 0) return { entries: [] };

    const entries = await AsyncStorage.multiGet(keys);

    return {
      entries: entries.filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    };
  } catch {
    return { entries: [] };
  }
};

export const restoreLocalStudentProgressSnapshot = async (snapshot: LocalStudentProgressSnapshot | null) => {
  await clearLocalStudentProgress();

  if (!snapshot?.entries.length) {
    return;
  }

  try {
    await AsyncStorage.multiSet(snapshot.entries);
  } catch {}
};

export const replaceLocalStudentXP = async (xp: number) => {
  await setLocalXP(xp);
};

export const getLocalStudentProgressCloudItems = async (): Promise<CloudProgressItem[]> => {
  const [learnedFlashcards, grammarProgress, timerBests, shinyEllie, modeUnlocks, reviewWords] = await Promise.all([
    getLearnedFlashcardCloudItems(),
    getGrammarProgressCloudItems(),
    getVocabularyTimerBestCloudItems(),
    getShinyEllieCloudItems(),
    getModeUnlockCloudItems(),
    getReviewWordCloudItems(),
  ]);

  return [
    ...learnedFlashcards,
    ...grammarProgress,
    ...timerBests,
    ...shinyEllie,
    ...modeUnlocks,
    ...reviewWords,
  ];
};

export const mergeCloudStudentProgressItems = async (
  items: CloudProgressItem[],
  options: { resetMissingAchievements?: boolean } = {}
): Promise<{ shinyEllie: ShinyEllieProgress }> => {
  await Promise.all([
    mergeLearnedFlashcardCloudItems(items),
    mergeGrammarProgressCloudItems(items),
    mergeVocabularyTimerBestCloudItems(items),
    mergeModeUnlockCloudItems(items),
    mergeReviewWordCloudItems(items),
  ]);

  const shinyEllie = await mergeShinyEllieCloudItems(items, {
    resetIfMissing: options.resetMissingAchievements,
  });

  return { shinyEllie };
};

export const replaceLocalStudentProgressFromCloud = async (
  xp: number,
  items: CloudProgressItem[]
): Promise<{ shinyEllie: ShinyEllieProgress }> => {
  await clearLocalStudentProgress();
  await setLocalXP(xp);

  return mergeCloudStudentProgressItems(items, {
    resetMissingAchievements: true,
  });
};
