import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncXPToCloudIfSignedIn } from '../account/accountStorage';

const XP_KEY = 'TOTAL_XP';
const DAILY_WORD_XP_PREFIX = 'TYPING_WORD_XP_AWARDED';
const DAILY_ACTIVITY_XP_PREFIX = 'PRACTICE_XP_AWARDED';
const DAILY_PRACTICE_PREFIX = 'DAILY_PRACTICE_ACTIVITY';
const stringSetWriteQueues = new Map<string, Promise<void>>();
const pendingStringSetAdds = new Map<string, Set<string>>();

const normalizeXP = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

const todayKey = (prefix: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${prefix}_${year}-${month}-${day}`;
};

const readStringSet = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed) ? new Set(parsed.filter((item) => typeof item === 'string')) : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

const getStringSet = async (key: string) => {
  const values = await readStringSet(key);
  const pendingValues = pendingStringSetAdds.get(key);

  if (pendingValues) {
    pendingValues.forEach((value) => values.add(value));
  }

  return values;
};

const addStringSetValue = async (key: string, value: string) => {
  const pendingValues = pendingStringSetAdds.get(key) ?? new Set<string>();
  pendingValues.add(value);
  pendingStringSetAdds.set(key, pendingValues);

  const previousWrite = stringSetWriteQueues.get(key) ?? Promise.resolve();
  const nextWrite = previousWrite.catch(() => {}).then(async () => {
    const values = await readStringSet(key);
    const latestPendingValues = pendingStringSetAdds.get(key);

    if (latestPendingValues) {
      latestPendingValues.forEach((pendingValue) => values.add(pendingValue));
    }

    await AsyncStorage.setItem(key, JSON.stringify([...values]));
  });

  stringSetWriteQueues.set(key, nextWrite);

  const clearQueue = () => {
    if (stringSetWriteQueues.get(key) === nextWrite) {
      stringSetWriteQueues.delete(key);
      pendingStringSetAdds.delete(key);
    }
  };

  nextWrite.then(clearQueue, clearQueue);

  await nextWrite;
};

const getAwardedWordKeysToday = async () => getStringSet(todayKey(DAILY_WORD_XP_PREFIX));
const getAwardedActivityXPKeysToday = async () => getStringSet(todayKey(DAILY_ACTIVITY_XP_PREFIX));

const getPracticeActivityKeysToday = async () => {
  const [activityKeys, awardedWordKeys] = await Promise.all([
    getStringSet(todayKey(DAILY_PRACTICE_PREFIX)),
    getAwardedWordKeysToday(),
  ]);

  awardedWordKeys.forEach((wordKey) => {
    activityKeys.add(`vocabulary:typing:${wordKey}`);
  });

  return activityKeys;
};

// 🔄 Get XP
export const getXP = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(XP_KEY);
    return value ? normalizeXP(parseInt(value, 10)) : 0;
  } catch {
    return 0;
  }
};

// 💾 Save XP
export const setLocalXP = async (xp: number) => {
  try {
    const nextXP = normalizeXP(xp);
    await AsyncStorage.setItem(XP_KEY, nextXP.toString());
  } catch {}
};

export const setXP = async (xp: number) => {
  try {
    const nextXP = normalizeXP(xp);
    await setLocalXP(nextXP);
    void syncXPToCloudIfSignedIn(nextXP);
  } catch {}
};

export const clearLocalXPProgress = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const progressKeys = allKeys.filter(
      (key) =>
        key === XP_KEY ||
        key.startsWith(`${DAILY_WORD_XP_PREFIX}_`) ||
        key.startsWith(`${DAILY_ACTIVITY_XP_PREFIX}_`) ||
        key.startsWith(`${DAILY_PRACTICE_PREFIX}_`)
    );

    pendingStringSetAdds.clear();
    stringSetWriteQueues.clear();

    if (progressKeys.length > 0) {
      await AsyncStorage.multiRemove(progressKeys);
    }
  } catch {}
};

// ➕ Add XP
export const addXP = async (amount: number): Promise<number> => {
  const currentXP = await getXP();
  const newXP = normalizeXP(currentXP + amount);
  await setXP(newXP);
  return newXP;
};

export const hasWordXpAwardedToday = async (wordKey: string): Promise<boolean> => {
  const awardedKeys = await getAwardedWordKeysToday();
  return awardedKeys.has(wordKey);
};

export const getTodayPracticedWordCount = async (): Promise<number> => {
  const awardedKeys = await getAwardedWordKeysToday();
  return awardedKeys.size;
};

export const getTodayPracticeCount = async (): Promise<number> => {
  const activityKeys = await getPracticeActivityKeysToday();
  return activityKeys.size;
};

export const markPracticeActivityToday = async (activityKey: string) => {
  const normalizedKey = activityKey.trim();
  if (!normalizedKey) return;

  try {
    const storageKey = todayKey(DAILY_PRACTICE_PREFIX);
    await addStringSetValue(storageKey, normalizedKey);
  } catch {}
};

export const awardActivityXPOnceToday = async (activityKey: string, amount: number): Promise<number> => {
  const normalizedKey = activityKey.trim();
  const normalizedAmount = normalizeXP(amount);
  if (!normalizedKey) return 0;

  await markPracticeActivityToday(normalizedKey);
  if (normalizedAmount <= 0) return 0;

  try {
    const storageKey = todayKey(DAILY_ACTIVITY_XP_PREFIX);
    const awardedKeys = await getAwardedActivityXPKeysToday();

    if (awardedKeys.has(normalizedKey)) return 0;

    await addStringSetValue(storageKey, normalizedKey);
    await addXP(normalizedAmount);
    return normalizedAmount;
  } catch {
    return 0;
  }
};

export const markWordXpAwardedToday = async (wordKey: string) => {
  try {
    await addStringSetValue(todayKey(DAILY_WORD_XP_PREFIX), wordKey);
    await markPracticeActivityToday(`vocabulary:typing:${wordKey}`);
  } catch {}
};
