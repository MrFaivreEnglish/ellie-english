import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncProgressItemToCloudIfSignedIn, type CloudProgressItem } from './accountStorage';

const VOCABULARY_TIMER_BESTS_KEY = '@vocabulary_timer_bests_v1';

export type VocabularyTimerBests = Record<string, number>;

export const getVocabularyTimerBests = async (): Promise<VocabularyTimerBests> => {
  try {
    const raw = await AsyncStorage.getItem(VOCABULARY_TIMER_BESTS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value > 0)
    ) as VocabularyTimerBests;
  } catch (error) {
    console.warn('Failed to load vocabulary timer bests', error);
    return {};
  }
};

export const saveVocabularyTimerBest = async (key: string, timeMs: number) => {
  if (!key || !Number.isFinite(timeMs) || timeMs <= 0) return;

  try {
    const bests = await getVocabularyTimerBests();
    const previousBest = bests[key];

    if (previousBest == null || previousBest <= 0 || timeMs < previousBest) {
      bests[key] = timeMs;
      await AsyncStorage.setItem(VOCABULARY_TIMER_BESTS_KEY, JSON.stringify(bests));
      void syncProgressItemToCloudIfSignedIn({
        type: 'timer_best',
        itemKey: key,
        value: { timeMs },
      });
    }
  } catch (error) {
    console.warn('Failed to save vocabulary timer best', error);
  }
};

export const getVocabularyTimerBestCloudItems = async (): Promise<CloudProgressItem[]> => {
  const bests = await getVocabularyTimerBests();

  return Object.entries(bests).map(([key, timeMs]) => ({
    type: 'timer_best' as const,
    itemKey: key,
    value: { timeMs },
  }));
};

export const mergeVocabularyTimerBestCloudItems = async (items: CloudProgressItem[]) => {
  try {
    const bests = await getVocabularyTimerBests();
    let changed = false;

    items.forEach((item) => {
      if (item.type !== 'timer_best') return;

      const rawTimeMs = item.value?.timeMs;
      const timeMs = typeof rawTimeMs === 'number' ? rawTimeMs : Number(rawTimeMs);

      if (!item.itemKey || !Number.isFinite(timeMs) || timeMs <= 0) return;

      const previousBest = bests[item.itemKey];
      if (previousBest == null || previousBest <= 0 || timeMs < previousBest) {
        bests[item.itemKey] = timeMs;
        changed = true;
      }
    });

    if (changed) {
      await AsyncStorage.setItem(VOCABULARY_TIMER_BESTS_KEY, JSON.stringify(bests));
    }
  } catch (error) {
    console.warn('Failed to merge vocabulary timer bests', error);
  }
};

export const clearVocabularyTimerBests = async () => {
  await AsyncStorage.removeItem(VOCABULARY_TIMER_BESTS_KEY);
};
