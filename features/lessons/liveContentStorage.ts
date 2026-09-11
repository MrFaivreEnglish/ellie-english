import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAnonKey, supabaseUrl } from '../../lib/config';

const LIVE_CONTENT_CACHE_KEY = 'LIVE_ADMIN_CONTENT_CACHE_V1';

export type LiveContentPayload = {
  chapterLinkOverrides: any[];
  customChapters: any[];
  customVocabularyLessons: any[];
};

export type LiveContentSnapshot = {
  version: number;
  publishedAt: string;
  payload: LiveContentPayload;
};

const emptyPayload = (): LiveContentPayload => ({
  chapterLinkOverrides: [],
  customChapters: [],
  customVocabularyLessons: [],
});

const normalizePayload = (value: any): LiveContentPayload => ({
  chapterLinkOverrides: Array.isArray(value?.chapterLinkOverrides) ? value.chapterLinkOverrides : [],
  customChapters: Array.isArray(value?.customChapters) ? value.customChapters : [],
  customVocabularyLessons: Array.isArray(value?.customVocabularyLessons) ? value.customVocabularyLessons : [],
});

const normalizeSnapshot = (value: any): LiveContentSnapshot | null => {
  const version = Number(value?.version);
  if (!Number.isFinite(version) || version < 1 || !value?.payload) return null;

  return {
    version: Math.floor(version),
    publishedAt: typeof value.published_at === 'string'
      ? value.published_at
      : typeof value.publishedAt === 'string'
        ? value.publishedAt
        : '',
    payload: normalizePayload(value.payload),
  };
};

let memorySnapshot: LiveContentSnapshot | null = null;
let fetchInFlight: Promise<LiveContentSnapshot | null> | null = null;

const readCachedSnapshot = async () => {
  try {
    const raw = await AsyncStorage.getItem(LIVE_CONTENT_CACHE_KEY);
    return raw ? normalizeSnapshot(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

const cacheSnapshot = async (snapshot: LiveContentSnapshot) => {
  memorySnapshot = snapshot;
  try {
    await AsyncStorage.setItem(LIVE_CONTENT_CACHE_KEY, JSON.stringify(snapshot));
  } catch {}
};

const fetchRemoteSnapshot = async (): Promise<LiveContentSnapshot | null> => {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/published_admin_content?id=eq.live&select=version,payload,published_at`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    }
  );

  if (!response.ok) throw new Error(`Live content fetch failed (${response.status})`);

  const rows = await response.json() as any[];
  return normalizeSnapshot(rows[0]);
};

export const getLiveContentSnapshot = async (
  options: { forceRefresh?: boolean } = {}
): Promise<LiveContentSnapshot | null> => {
  if (!options.forceRefresh && memorySnapshot) return memorySnapshot;
  if (fetchInFlight) return fetchInFlight;

  fetchInFlight = (async () => {
    try {
      const remote = await fetchRemoteSnapshot();
      if (remote) await cacheSnapshot(remote);
      return remote;
    } catch {
      if (memorySnapshot) return memorySnapshot;
      const cached = await readCachedSnapshot();
      if (cached) memorySnapshot = cached;
      return cached;
    } finally {
      fetchInFlight = null;
    }
  })();

  return fetchInFlight;
};

export const setLiveContentSnapshotCache = async (snapshot: LiveContentSnapshot) => {
  await cacheSnapshot({
    ...snapshot,
    payload: normalizePayload(snapshot.payload ?? emptyPayload()),
  });
};

