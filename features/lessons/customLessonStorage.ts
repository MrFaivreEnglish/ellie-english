import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAnonKey, supabaseUrl } from '../../lib/config';
import type { Word } from '../../types/VocabularyTypes';
import { getLiveContentSnapshot } from './liveContentStorage';

const CUSTOM_VOCABULARY_LESSONS_KEY = 'CUSTOM_VOCABULARY_LESSONS_V1';



const REMOTE_VOCABULARY_LESSONS_CACHE_KEY = 'REMOTE_VOCABULARY_LESSONS_CACHE_V1';
const DELETED_VOCABULARY_LESSON_IDS_KEY = 'DELETED_VOCABULARY_LESSON_IDS_V1';
const RETIRED_CUSTOM_VOCABULARY_LESSON_IDS = new Set([
  'custom-1779646902691',
]);

export type CustomVocabularyLesson = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  flashcards: Word[];
  isCustom: true;
  createdAt: string;
  updatedAt: string;
};

const isWord = (value: any): value is Word =>
  value &&
  typeof value.english === 'string' &&
  typeof value.french === 'string';

const normalizeLesson = (value: any): CustomVocabularyLesson | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.title !== 'string' || !Array.isArray(value.flashcards)) return null;

  const flashcards = value.flashcards.filter(isWord).map((word: Word) => ({
    english: word.english.trim(),
    french: word.french.trim(),
  })).filter((word: Word) => word.english && word.french);

  if (!flashcards.length) return null;

  return {
    id: typeof value.id === 'string' ? value.id : `custom-${Date.now()}`,
    title: value.title.trim(),
    description: typeof value.description === 'string' ? value.description : '',
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : '',
    category: typeof value.category === 'string' ? value.category : 'Custom',
    flashcards,
    isCustom: true,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
  };
};

const readLessons = async (): Promise<CustomVocabularyLesson[]> => {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_VOCABULARY_LESSONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeLesson)
      .filter(Boolean)
      .sort((a, b) => (a!.updatedAt < b!.updatedAt ? 1 : -1)) as CustomVocabularyLesson[];
  } catch {
    return [];
  }
};

const writeLessons = async (lessons: CustomVocabularyLesson[]) => {
  await AsyncStorage.setItem(CUSTOM_VOCABULARY_LESSONS_KEY, JSON.stringify(lessons));
};

const fetchRemoteLessons = async (
  options: { forceRefresh?: boolean } = {}
): Promise<CustomVocabularyLesson[]> => {
  if (!supabaseUrl || !supabaseAnonKey) return [];

  const snapshot = await getLiveContentSnapshot(options);
  if (snapshot) {
    return snapshot.payload.customVocabularyLessons
      .map(normalizeLesson)
      .filter((value): value is CustomVocabularyLesson => !!value);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/custom_vocabulary_lessons?select=*`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) throw new Error(`Remote fetch failed (${response.status})`);

  const rows = await response.json() as any[];

  return rows
    .map((row) => normalizeLesson({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      imageUrl: row.image_url ?? '',
      category: row.category ?? 'Custom',
      flashcards: row.flashcards,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    .filter((value): value is CustomVocabularyLesson => !!value);
};

const readRemoteCache = async (): Promise<CustomVocabularyLesson[]> => {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_VOCABULARY_LESSONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeLesson).filter(Boolean) as CustomVocabularyLesson[] : [];
  } catch {
    return [];
  }
};

const readDeletedLessonIds = async () => {
  try {
    const raw = await AsyncStorage.getItem(DELETED_VOCABULARY_LESSON_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set<string>();
  }
};

const writeDeletedLessonIds = async (ids: Set<string>) => {
  await AsyncStorage.setItem(DELETED_VOCABULARY_LESSON_IDS_KEY, JSON.stringify([...ids]));
};






export const getCustomVocabularyLessons = async (
  options: { forceRefresh?: boolean } = {}
): Promise<CustomVocabularyLesson[]> => {
  const localDrafts = await readLessons();
  const deletedIds = await readDeletedLessonIds();
  let remote: CustomVocabularyLesson[];

  try {
    remote = await fetchRemoteLessons(options);
    await AsyncStorage.setItem(REMOTE_VOCABULARY_LESSONS_CACHE_KEY, JSON.stringify(remote));
  } catch {
    remote = await readRemoteCache();
  }

  // Unsynced local drafts take precedence over published or cached rows with the same ID.
  const merged = new Map(remote.map((item) => [item.id, item] as const));
  localDrafts.forEach((item) => merged.set(item.id, item));
  deletedIds.forEach((id) => merged.delete(id));
  RETIRED_CUSTOM_VOCABULARY_LESSON_IDS.forEach((id) => merged.delete(id));
  return [...merged.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
};

export const saveCustomVocabularyLesson = async (
  lesson: Omit<CustomVocabularyLesson, 'createdAt' | 'updatedAt' | 'isCustom'> & {
    createdAt?: string;
  }
): Promise<CustomVocabularyLesson[]> => {
  const existing = await readLessons();
  const now = new Date().toISOString();
  const nextLesson: CustomVocabularyLesson = {
    ...lesson,
    title: lesson.title.trim(),
    description: lesson.description?.trim() ?? '',
    imageUrl: lesson.imageUrl?.trim() ?? '',
    category: lesson.category?.trim() || 'Custom',
    flashcards: lesson.flashcards.map((word) => ({
      english: word.english.trim(),
      french: word.french.trim(),
    })).filter((word) => word.english && word.french),
    isCustom: true,
    createdAt: lesson.createdAt ?? now,
    updatedAt: now,
  };

  const nextLessons = existing.filter((item) => item.id !== lesson.id);
  nextLessons.unshift(nextLesson);
  await writeLessons(nextLessons);
  const deletedIds = await readDeletedLessonIds();
  deletedIds.delete(nextLesson.id);
  await writeDeletedLessonIds(deletedIds);
  return getCustomVocabularyLessons();
};

export const deleteCustomVocabularyLesson = async (id: string): Promise<CustomVocabularyLesson[]> => {
  const existing = await readLessons();
  const nextLessons = existing.filter((lesson) => lesson.id !== id);
  await writeLessons(nextLessons);
  const deletedIds = await readDeletedLessonIds();
  deletedIds.add(id);
  await writeDeletedLessonIds(deletedIds);
  return getCustomVocabularyLessons();
};

export const clearVocabularyLessonDeletionMarkers = async () => {
  await AsyncStorage.removeItem(DELETED_VOCABULARY_LESSON_IDS_KEY);
};

export const clearLocalVocabularyLessonDrafts = async () => {
  await Promise.all([
    AsyncStorage.removeItem(CUSTOM_VOCABULARY_LESSONS_KEY),
    AsyncStorage.removeItem(DELETED_VOCABULARY_LESSON_IDS_KEY),
  ]);
};
