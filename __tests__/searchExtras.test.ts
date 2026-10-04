import AsyncStorage from '@react-native-async-storage/async-storage';
import { highlightParts } from '../features/home/searchContent';
import { addRecentSearch, clearRecentSearches, getRecentSearches, MAX_RECENT_SEARCHES } from '../features/home/recentSearches';

const store: Record<string, string> = {};
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
});

describe('highlightParts', () => {
  it('marks the match while keeping the original spelling', () => {
    expect(highlightParts('Été chaud', 'ete')).toEqual([
      { text: 'Été', match: true },
      { text: ' chaud', match: false },
    ]);
    expect(highlightParts('summer', 'mm')).toEqual([
      { text: 'su', match: false },
      { text: 'mm', match: true },
      { text: 'er', match: false },
    ]);
  });

  it('returns the text untouched when nothing matches', () => {
    expect(highlightParts('winter', 'xyz')).toEqual([{ text: 'winter', match: false }]);
    expect(highlightParts('winter', '')).toEqual([{ text: 'winter', match: false }]);
  });
});

describe('recent searches', () => {
  it('keeps the newest first, without duplicates, up to a limit', async () => {
    for (const word of ['cat', 'dog', 'Cat', 'a', 'bird', 'fish', 'frog', 'lion', 'bear']) {
      await addRecentSearch(word);
    }
    const recent = await getRecentSearches();
    expect(recent[0]).toBe('bear');
    expect(recent).toHaveLength(MAX_RECENT_SEARCHES);
    expect(recent).not.toContain('a');
    expect(recent.filter((item) => item.toLowerCase() === 'cat')).toEqual(['Cat']);
  });

  it('moves a repeated search to the front and can be cleared', async () => {
    await addRecentSearch('cat');
    await addRecentSearch('dog');
    await addRecentSearch('CAT');
    expect(await getRecentSearches()).toEqual(['CAT', 'dog']);
    await clearRecentSearches();
    expect(await getRecentSearches()).toEqual([]);
  });
});
