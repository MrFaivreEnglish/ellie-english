const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore.has(key) ? mockStore.get(key)! : null)),
  setItem: jest.fn((key: string, value: string) => { mockStore.set(key, value); return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { mockStore.delete(key); return Promise.resolve(); }),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([...mockStore.keys()])),
  clear: jest.fn(() => { mockStore.clear(); return Promise.resolve(); }),
}));

const mockSyncProgressItem = jest.fn(() => Promise.resolve());
jest.mock('../features/account/accountStorage', () => ({
  syncProgressItemToCloudIfSignedIn: (...args: unknown[]) => mockSyncProgressItem(...(args as [])),
}));

import {
  buildModeUnlockKey,
  clearModeUnlocks,
  getModeUnlockCloudItems,
  isModeUnlocked,
  mergeModeUnlockCloudItems,
  unlockMode,
} from '../features/progress/modeUnlockStorage';

describe('modeUnlockStorage', () => {
  beforeEach(async () => {
    await clearModeUnlocks();
    mockStore.clear();
    mockSyncProgressItem.mockClear();
  });

  it('reports an unlock as new exactly once', async () => {
    expect(await isModeUnlocked('vocabTimer', 'Lesson 3')).toBe(false);

    expect(await unlockMode('vocabTimer', 'Lesson 3')).toBe(true);
    expect(await unlockMode('vocabTimer', 'Lesson 3')).toBe(false);

    expect(await isModeUnlocked('vocabTimer', 'Lesson 3')).toBe(true);
    expect(mockSyncProgressItem).toHaveBeenCalledTimes(1);
  });

  it('keeps modes and lessons apart', async () => {
    await unlockMode('vocabTimer', 'Lesson 3');

    expect(await isModeUnlocked('grammarGame', 'Lesson 3')).toBe(false);
    expect(await isModeUnlocked('vocabTimer', 'Lesson 4')).toBe(false);
  });

  it('treats scope keys that only differ by case or spacing as the same lesson', async () => {
    expect(buildModeUnlockKey('grammarGame', 'Present Perfect')).toBe(
      buildModeUnlockKey('grammarGame', '  present   perfect  ')
    );

    await unlockMode('grammarGame', 'Present Perfect');
    expect(await isModeUnlocked('grammarGame', 'present perfect')).toBe(true);
  });

  it('survives concurrent unlocks of different lessons', async () => {
    await Promise.all([
      unlockMode('vocabTimer', 'a'),
      unlockMode('vocabTimer', 'b'),
      unlockMode('grammarGame', 'c'),
    ]);

    expect(await isModeUnlocked('vocabTimer', 'a')).toBe(true);
    expect(await isModeUnlocked('vocabTimer', 'b')).toBe(true);
    expect(await isModeUnlocked('grammarGame', 'c')).toBe(true);
  });

  it('round-trips through cloud progress items', async () => {
    await unlockMode('vocabTimer', 'Lesson 3');
    const items = await getModeUnlockCloudItems();
    expect(items).toHaveLength(1);

    await clearModeUnlocks();
    expect(await isModeUnlocked('vocabTimer', 'Lesson 3')).toBe(false);

    await mergeModeUnlockCloudItems(items);
    expect(await isModeUnlocked('vocabTimer', 'Lesson 3')).toBe(true);
  });

  it('ignores cloud achievements that are not mode unlocks', async () => {
    await mergeModeUnlockCloudItems([{ type: 'achievement', itemKey: 'shiny_ellie', value: {} }]);

    expect(await getModeUnlockCloudItems()).toHaveLength(0);
  });
});
