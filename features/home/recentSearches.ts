import AsyncStorage from '@react-native-async-storage/async-storage';

// The last few things a student looked for, newest first, kept on this device only.
export const RECENT_SEARCHES_KEY = '@recent_searches_v1';
export const MAX_RECENT_SEARCHES = 6;

export const getRecentSearches = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const addRecentSearch = async (query: string): Promise<string[]> => {
  const cleaned = query.trim().replace(/\s+/g, ' ');
  if (cleaned.length < 2) return getRecentSearches();

  const current = await getRecentSearches();
  const next = [cleaned, ...current.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
  try {
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {}
  return next;
};

export const clearRecentSearches = async () => {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {}
};
