import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CloudProgressItem } from './accountStorage';
import {
  clearLearnedFlashcardProgress,
  getLearnedFlashcardCloudItems,
  mergeLearnedFlashcardCloudItems,
} from './flashcardProgressStorage';
import {
  clearGrammarProgress,
  getGrammarProgressCloudItems,
  mergeGrammarProgressCloudItems,
} from './grammarProgressStorage';
import {
  clearVocabularyTimerBests,
  getVocabularyTimerBestCloudItems,
  mergeVocabularyTimerBestCloudItems,
} from './vocabularyTimerStorage';
import {
  clearShinyEllieProgress,
  getShinyEllieCloudItems,
  mergeShinyEllieCloudItems,
  type ShinyEllieProgress,
} from './shinyEllieStorage';
import { clearLocalXPProgress, setLocalXP } from './xpStorage';

export type LocalStudentProgressSnapshot = {
  entries: [string, string][];
};

const LOCAL_PROGRESS_KEYS = new Set([
  'TOTAL_XP',
  '@vocabulary_timer_bests_v1',
  '@shiny_ellie_unlocked',
  '@shiny_ellie_mode',
]);

const LOCAL_PROGRESS_PREFIXES = [
  'TYPING_WORD_XP_AWARDED_',
  'DAILY_PRACTICE_ACTIVITY_',
  '@learned_flashcards:',
  '@learned_flashcards_today:',
  '@grammar_progress:',
  '@grammar_progress_today:',
];

const isLocalStudentProgressKey = (key: string) =>
  LOCAL_PROGRESS_KEYS.has(key) || LOCAL_PROGRESS_PREFIXES.some((prefix) => key.startsWith(prefix));

export const clearLocalStudentProgress = async () => {
  await Promise.all([
    clearLocalXPProgress(),
    clearLearnedFlashcardProgress(),
    clearGrammarProgress(),
    clearVocabularyTimerBests(),
    clearShinyEllieProgress(),
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
  const [learnedFlashcards, grammarProgress, timerBests, shinyEllie] = await Promise.all([
    getLearnedFlashcardCloudItems(),
    getGrammarProgressCloudItems(),
    getVocabularyTimerBestCloudItems(),
    getShinyEllieCloudItems(),
  ]);

  return [
    ...learnedFlashcards,
    ...grammarProgress,
    ...timerBests,
    ...shinyEllie,
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
  ]);

  const shinyEllie = await mergeShinyEllieCloudItems(items, {
    resetIfMissing: options.resetMissingAchievements,
  });

  return { shinyEllie };
};
