import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncProgressItemToCloudIfSignedIn, type CloudProgressItem } from '../account/accountStorage';






export const MODE_UNLOCKS_KEY = '@mode_unlocks_v1';
const MODE_UNLOCK_CLOUD_PREFIX = 'mode_unlock:';

export type UnlockableMode = 'vocabTimer' | 'grammarGame';

const MODE_PREFIX: Record<UnlockableMode, string> = {
  vocabTimer: 'vocab-timer',
  grammarGame: 'grammar-game',
};

const normalizeScopeKey = (scopeKey: string) =>
  scopeKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'default';

export const buildModeUnlockKey = (mode: UnlockableMode, scopeKey: string) =>
  `${MODE_PREFIX[mode]}:${normalizeScopeKey(scopeKey)}`;




let unlocksCache: Set<string> | null = null;
// Serialize read-modify-write operations so concurrent unlocks cannot overwrite each other.
let writeQueue: Promise<void> = Promise.resolve();

const parseKeySet = (raw: string | null) => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? new Set(parsed.filter((item): item is string => typeof item === 'string'))
      : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

const readUnlocks = async (): Promise<Set<string>> => {
  if (unlocksCache) return unlocksCache;

  try {
    unlocksCache = parseKeySet(await AsyncStorage.getItem(MODE_UNLOCKS_KEY));
  } catch {
    unlocksCache = new Set<string>();
  }

  return unlocksCache;
};

const persistUnlocks = (mutate: (unlocks: Set<string>) => boolean) => {
  const nextWrite = writeQueue.catch(() => {}).then(async () => {
    const unlocks = await readUnlocks();
    if (!mutate(unlocks)) return;

    unlocksCache = unlocks;
    try {
      await AsyncStorage.setItem(MODE_UNLOCKS_KEY, JSON.stringify([...unlocks]));
    } catch {}
  });

  writeQueue = nextWrite;
  return nextWrite;
};

export const getUnlockedModes = async (): Promise<Set<string>> => new Set(await readUnlocks());

export const isModeUnlocked = async (mode: UnlockableMode, scopeKey: string): Promise<boolean> => {
  const unlocks = await readUnlocks();
  return unlocks.has(buildModeUnlockKey(mode, scopeKey));
};



export const unlockMode = async (mode: UnlockableMode, scopeKey: string): Promise<boolean> => {
  const unlockKey = buildModeUnlockKey(mode, scopeKey);
  let isNewUnlock = false;

  await persistUnlocks((unlocks) => {
    if (unlocks.has(unlockKey)) return false;
    unlocks.add(unlockKey);
    isNewUnlock = true;
    return true;
  });

  if (isNewUnlock) {
    void syncProgressItemToCloudIfSignedIn({
      type: 'achievement',
      itemKey: `${MODE_UNLOCK_CLOUD_PREFIX}${unlockKey}`,
      value: { mode, scopeKey: normalizeScopeKey(scopeKey) },
    });
  }

  return isNewUnlock;
};

export const getModeUnlockCloudItems = async (): Promise<CloudProgressItem[]> => {
  const unlocks = await readUnlocks();

  return [...unlocks].map((unlockKey) => ({
    type: 'achievement' as const,
    itemKey: `${MODE_UNLOCK_CLOUD_PREFIX}${unlockKey}`,
    value: { unlockKey },
  }));
};

export const mergeModeUnlockCloudItems = async (items: CloudProgressItem[]) => {
  const cloudUnlockKeys = items
    .filter((item) => item.type === 'achievement' && item.itemKey.startsWith(MODE_UNLOCK_CLOUD_PREFIX))
    .map((item) => item.itemKey.slice(MODE_UNLOCK_CLOUD_PREFIX.length))
    .filter((unlockKey) => unlockKey.length > 0);

  if (cloudUnlockKeys.length === 0) return;

  await persistUnlocks((unlocks) => {
    const sizeBefore = unlocks.size;
    cloudUnlockKeys.forEach((unlockKey) => unlocks.add(unlockKey));
    return unlocks.size !== sizeBefore;
  });
};

export const clearModeUnlocks = async () => {
  await persistUnlocks((unlocks) => {
    unlocks.clear();
    return true;
  });
  unlocksCache = new Set<string>();
  try {
    await AsyncStorage.removeItem(MODE_UNLOCKS_KEY);
  } catch {}
};
