import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Word } from '../../types/VocabularyTypes';

const CUSTOM_VOCABULARY_LESSONS_KEY = 'CUSTOM_VOCABULARY_LESSONS_V1';

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

export const getCustomVocabularyLessons = async () => readLessons();

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
  return nextLessons;
};

export const deleteCustomVocabularyLesson = async (id: string): Promise<CustomVocabularyLesson[]> => {
  const existing = await readLessons();
  const nextLessons = existing.filter((lesson) => lesson.id !== id);
  await writeLessons(nextLessons);
  return nextLessons;
};
