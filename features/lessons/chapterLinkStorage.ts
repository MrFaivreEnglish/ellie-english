import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAnonKey, supabaseUrl } from '../../lib/config';
import { getLiveContentSnapshot } from './liveContentStorage';

const CUSTOM_CHAPTER_LINK_OVERRIDES_KEY = 'CUSTOM_CHAPTER_LINK_OVERRIDES_V1';




const REMOTE_CHAPTER_LINK_CACHE_KEY = 'REMOTE_CHAPTER_LINK_CACHE_V1';
const DELETED_CHAPTER_LINK_OVERRIDE_IDS_KEY = 'DELETED_CHAPTER_LINK_OVERRIDE_IDS_V1';

export type ChapterAppLinkTarget = {
  target: 'grammar' | 'vocabulary';
  lessonTitle: string;
  lessonId?: string;
};

export type ChapterLinkOverride = {
  id: string;
  categoryTitle: string;
  lessonTitle: string;
  displayTitle: string;
  url: string;




  appLink?: ChapterAppLinkTarget;
  createdAt: string;
  updatedAt: string;
};

export const makeChapterLinkOverrideId = (categoryTitle: string, lessonTitle: string) =>
  `${categoryTitle.trim()}::${lessonTitle.trim()}`;

const normalizeChapterAppLink = (value: any): ChapterAppLinkTarget | undefined => {
  if (!value || typeof value !== 'object') return undefined;

  const target = value.target === 'grammar' || value.target === 'vocabulary' ? value.target : null;
  const lessonTitle = String(value.lessonTitle ?? '').trim();
  const lessonId = String(value.lessonId ?? '').trim();

  if (!target || (!lessonTitle && !lessonId)) return undefined;

  return { target, lessonTitle, ...(lessonId ? { lessonId } : {}) };
};

export const normalizeChapterLinkOverride = (value: any): ChapterLinkOverride | null => {
  if (!value || typeof value !== 'object') return null;

  const categoryTitle = String(value.categoryTitle ?? '').trim();
  const lessonTitle = String(value.lessonTitle ?? '').trim();
  const displayTitle = String(value.displayTitle ?? value.title ?? lessonTitle).trim();
  const url = String(value.url ?? '').trim();
  const appLink = normalizeChapterAppLink(value.appLink);


  if (!categoryTitle || !lessonTitle || (!url && !appLink)) return null;

  const now = new Date().toISOString();

  return {
    id: typeof value.id === 'string' && value.id.trim()
      ? value.id.trim()
      : makeChapterLinkOverrideId(categoryTitle, lessonTitle),
    categoryTitle,
    lessonTitle,
    displayTitle: displayTitle || lessonTitle,
    url,
    ...(appLink ? { appLink } : {}),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  };
};

export const normalizeChapterLinkOverrides = (values: any): ChapterLinkOverride[] => {
  if (!Array.isArray(values)) return [];

  return values
    .map(normalizeChapterLinkOverride)
    .filter((value): value is ChapterLinkOverride => !!value);
};

const sortOverrides = (overrides: ChapterLinkOverride[]) =>
  [...overrides].sort((a, b) => {
    const categoryCompare = a.categoryTitle.localeCompare(b.categoryTitle, undefined, { sensitivity: 'base' });
    if (categoryCompare !== 0) return categoryCompare;
    return a.lessonTitle.localeCompare(b.lessonTitle, undefined, { sensitivity: 'base' });
  });

const readOverrides = async (): Promise<ChapterLinkOverride[]> => {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_CHAPTER_LINK_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return sortOverrides(normalizeChapterLinkOverrides(parsed));
  } catch {
    return [];
  }
};

const writeOverrides = async (overrides: ChapterLinkOverride[]) => {
  await AsyncStorage.setItem(CUSTOM_CHAPTER_LINK_OVERRIDES_KEY, JSON.stringify(sortOverrides(overrides)));
};

const readDeletedOverrideIds = async () => {
  try {
    const raw = await AsyncStorage.getItem(DELETED_CHAPTER_LINK_OVERRIDE_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set<string>();
  }
};

const writeDeletedOverrideIds = async (ids: Set<string>) => {
  await AsyncStorage.setItem(DELETED_CHAPTER_LINK_OVERRIDE_IDS_KEY, JSON.stringify([...ids]));
};

const fetchRemoteOverrides = async (
  options: { forceRefresh?: boolean } = {}
): Promise<ChapterLinkOverride[]> => {
  if (!supabaseUrl || !supabaseAnonKey) return [];

  const snapshot = await getLiveContentSnapshot(options);
  if (snapshot) return normalizeChapterLinkOverrides(snapshot.payload.chapterLinkOverrides);

  const response = await fetch(`${supabaseUrl}/rest/v1/chapter_link_overrides?select=*`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) throw new Error(`Remote fetch failed (${response.status})`);

  const rows = await response.json() as any[];

  return rows.map((row) => ({
    id: row.id,
    categoryTitle: row.category_title,
    lessonTitle: row.lesson_title,
    displayTitle: row.display_title,
    url: row.url,


    ...(row.app_link_target && (row.app_link_lesson_title || row.app_link_lesson_id)
      ? {
          appLink: {
            target: row.app_link_target,
            lessonTitle: row.app_link_lesson_title ?? '',
            ...(row.app_link_lesson_id ? { lessonId: row.app_link_lesson_id } : {}),
          },
        }
      : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

const readRemoteCache = async (): Promise<ChapterLinkOverride[]> => {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_CHAPTER_LINK_CACHE_KEY);
    return raw ? normalizeChapterLinkOverrides(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
};






export const getCustomChapterLinkOverrides = async (
  options: { forceRefresh?: boolean } = {}
): Promise<ChapterLinkOverride[]> => {
  const localDrafts = await readOverrides();
  const deletedIds = await readDeletedOverrideIds();
  let remote: ChapterLinkOverride[];

  try {
    remote = await fetchRemoteOverrides(options);
    await AsyncStorage.setItem(REMOTE_CHAPTER_LINK_CACHE_KEY, JSON.stringify(remote));
  } catch {
    remote = await readRemoteCache();
  }

  // Unsynced local overrides take precedence over published or cached rows.
  const merged = new Map(remote.map((item) => [item.id, item] as const));
  localDrafts.forEach((item) => merged.set(item.id, item));
  deletedIds.forEach((id) => merged.delete(id));
  return sortOverrides([...merged.values()]);
};

export const saveCustomChapterLinkOverride = async (
  override: Omit<ChapterLinkOverride, 'createdAt' | 'updatedAt'> & { createdAt?: string }
): Promise<ChapterLinkOverride[]> => {
  const existing = await readOverrides();
  const now = new Date().toISOString();
  const nextOverride: ChapterLinkOverride = {
    id: override.id || makeChapterLinkOverrideId(override.categoryTitle, override.lessonTitle),
    categoryTitle: override.categoryTitle.trim(),
    lessonTitle: override.lessonTitle.trim(),
    displayTitle: override.displayTitle.trim() || override.lessonTitle.trim(),
    url: override.url.trim(),
    ...(override.appLink ? { appLink: override.appLink } : {}),
    createdAt: override.createdAt ?? now,
    updatedAt: now,
  };

  const nextOverrides = existing.filter((item) => item.id !== nextOverride.id);
  nextOverrides.push(nextOverride);
  await writeOverrides(nextOverrides);
  const deletedIds = await readDeletedOverrideIds();
  deletedIds.delete(nextOverride.id);
  await writeDeletedOverrideIds(deletedIds);
  return getCustomChapterLinkOverrides();
};

export const deleteCustomChapterLinkOverride = async (id: string): Promise<ChapterLinkOverride[]> => {
  const existing = await readOverrides();
  const nextOverrides = existing.filter((override) => override.id !== id);
  await writeOverrides(nextOverrides);
  const deletedIds = await readDeletedOverrideIds();
  deletedIds.add(id);
  await writeDeletedOverrideIds(deletedIds);
  return getCustomChapterLinkOverrides();
};

export const clearChapterLinkDeletionMarkers = async () => {
  await AsyncStorage.removeItem(DELETED_CHAPTER_LINK_OVERRIDE_IDS_KEY);
};

export const clearLocalChapterLinkDrafts = async () => {
  await Promise.all([
    AsyncStorage.removeItem(CUSTOM_CHAPTER_LINK_OVERRIDES_KEY),
    AsyncStorage.removeItem(DELETED_CHAPTER_LINK_OVERRIDE_IDS_KEY),
  ]);
};
