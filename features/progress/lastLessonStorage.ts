import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_LESSON_KEY = '@last_lesson_v1';

export type LastLessonType = 'grammar' | 'vocabulary';

export type LastLessonEntry = {
  type: LastLessonType;
  lessonId?: string;
  title: string;
  savedAt: number;
};

export const saveLastLesson = async (entry: Omit<LastLessonEntry, 'savedAt'>) => {
  if (!entry.title?.trim()) return;

  try {
    await AsyncStorage.setItem(
      LAST_LESSON_KEY,
      JSON.stringify({
        ...entry,
        title: entry.title.trim(),
        lessonId: entry.lessonId?.trim() || undefined,
        savedAt: Date.now(),
      })
    );
  } catch {}
};

export const getLastLesson = async (): Promise<LastLessonEntry | null> => {
  try {
    const raw = await AsyncStorage.getItem(LAST_LESSON_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (
      parsed &&
      (parsed.type === 'grammar' || parsed.type === 'vocabulary') &&
      typeof parsed.title === 'string'
    ) {
      return {
        type: parsed.type,
        title: parsed.title,
        lessonId: typeof parsed.lessonId === 'string' ? parsed.lessonId : undefined,
        savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0,
      };
    }
  } catch {}

  return null;
};
