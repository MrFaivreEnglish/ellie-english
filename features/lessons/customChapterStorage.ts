import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLiveContentSnapshot } from './liveContentStorage';
import type { ChapterAppLinkTarget } from './chapterLinkStorage';

const CUSTOM_CHAPTERS_KEY = 'CUSTOM_CHAPTERS_V1';
const DELETED_CUSTOM_CHAPTER_IDS_KEY = 'DELETED_CUSTOM_CHAPTER_IDS_V1';

export type CustomChapter = {
  id: string;
  categoryTitle: string;
  categoryIcon: string;
  categoryColor: string;
  title: string;
  url: string;
  appLink?: ChapterAppLinkTarget;
  position: number;
  isCustom: true;
  createdAt: string;
  updatedAt: string;
};

export const normalizeCustomChapter = (value: any): CustomChapter | null => {
  if (!value || typeof value !== 'object') return null;

  const id = String(value.id ?? '').trim();
  const categoryTitle = String(value.categoryTitle ?? '').trim();
  const title = String(value.title ?? '').trim();
  const url = String(value.url ?? '').trim();
  const rawAppLink = value.appLink;
  const appLinkTarget = rawAppLink?.target === 'grammar' || rawAppLink?.target === 'vocabulary'
    ? rawAppLink.target
    : null;
  const appLinkLessonTitle = String(rawAppLink?.lessonTitle ?? '').trim();
  const appLinkLessonId = String(rawAppLink?.lessonId ?? '').trim();
  const appLink = appLinkTarget && (appLinkLessonId || appLinkLessonTitle)
    ? {
        target: appLinkTarget,
        lessonTitle: appLinkLessonTitle,
        ...(appLinkLessonId ? { lessonId: appLinkLessonId } : {}),
      }
    : undefined;

  if (!id || !categoryTitle || !title || (!url && !appLink)) return null;

  const now = new Date().toISOString();
  const position = Number(value.position);

  return {
    id,
    categoryTitle,
    categoryIcon: String(value.categoryIcon ?? '').trim() || '📚',
    categoryColor: String(value.categoryColor ?? '').trim() || '#1671B6',
    title,
    url,
    ...(appLink ? { appLink } : {}),
    position: Number.isFinite(position) ? Math.max(0, Math.floor(position)) : 0,
    isCustom: true,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  };
};

const readLocalChapters = async (): Promise<CustomChapter[]> => {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_CHAPTERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map(normalizeCustomChapter).filter((value): value is CustomChapter => !!value)
      : [];
  } catch {
    return [];
  }
};

const readDeletedIds = async () => {
  try {
    const raw = await AsyncStorage.getItem(DELETED_CUSTOM_CHAPTER_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set<string>();
  }
};

const writeDeletedIds = async (ids: Set<string>) => {
  await AsyncStorage.setItem(DELETED_CUSTOM_CHAPTER_IDS_KEY, JSON.stringify([...ids]));
};

const sortChapters = (chapters: CustomChapter[]) => [...chapters].sort((a, b) => {
  const categoryCompare = a.categoryTitle.localeCompare(b.categoryTitle, undefined, { sensitivity: 'base' });
  if (categoryCompare !== 0) return categoryCompare;
  if (a.position !== b.position) {
    if (a.position === 0) return 1;
    if (b.position === 0) return -1;
    return a.position - b.position;
  }
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
});

export const getCustomChapters = async (
  options: { forceRefresh?: boolean } = {}
): Promise<CustomChapter[]> => {
  const [snapshot, local, deletedIds] = await Promise.all([
    getLiveContentSnapshot(options),
    readLocalChapters(),
    readDeletedIds(),
  ]);
  const remote = (snapshot?.payload.customChapters ?? [])
    .map(normalizeCustomChapter)
    .filter((value): value is CustomChapter => !!value);
  const merged = new Map(remote.map((chapter) => [chapter.id, chapter] as const));
  local.forEach((chapter) => merged.set(chapter.id, chapter));
  deletedIds.forEach((id) => merged.delete(id));
  return sortChapters([...merged.values()]);
};

export const saveCustomChapter = async (
  chapter: Omit<CustomChapter, 'isCustom' | 'createdAt' | 'updatedAt'> & { createdAt?: string }
) => {
  const existing = await readLocalChapters();
  const now = new Date().toISOString();
  const next = normalizeCustomChapter({
    ...chapter,
    isCustom: true,
    createdAt: chapter.createdAt ?? now,
    updatedAt: now,
  });
  if (!next) throw new Error('Complete the chapter before saving it.');

  await AsyncStorage.setItem(
    CUSTOM_CHAPTERS_KEY,
    JSON.stringify([next, ...existing.filter((item) => item.id !== next.id)])
  );
  const deletedIds = await readDeletedIds();
  deletedIds.delete(next.id);
  await writeDeletedIds(deletedIds);
  return getCustomChapters();
};

export const deleteCustomChapter = async (id: string) => {
  const existing = await readLocalChapters();
  await AsyncStorage.setItem(CUSTOM_CHAPTERS_KEY, JSON.stringify(existing.filter((item) => item.id !== id)));
  const deletedIds = await readDeletedIds();
  deletedIds.add(id);
  await writeDeletedIds(deletedIds);
  return getCustomChapters();
};

export const clearCustomChapterDeletionMarkers = async () => {
  await AsyncStorage.removeItem(DELETED_CUSTOM_CHAPTER_IDS_KEY);
};

export const clearLocalCustomChapterDrafts = async () => {
  await Promise.all([
    AsyncStorage.removeItem(CUSTOM_CHAPTERS_KEY),
    AsyncStorage.removeItem(DELETED_CUSTOM_CHAPTER_IDS_KEY),
  ]);
};
