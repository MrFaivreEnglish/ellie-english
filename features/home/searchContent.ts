import type { Word } from '../../types/VocabularyTypes';

// Search across everything in the app from one box: lessons by title, words by English or
// French. Accents and case are ignored, so "ete" finds "été".

export const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export type LessonHit = { type: 'vocabulary' | 'grammar'; title: string; lesson: any };
export type WordHit = { word: Word; lessonTitle: string; lesson: any };

export type SearchResults = {
  lessons: LessonHit[];
  words: WordHit[];
};

export const MAX_LESSON_HITS = 12;
export const MAX_WORD_HITS = 25;

const getLessonWords = (lesson: any): Word[] => {
  if (!lesson?.flashcards) return [];
  const words = Array.isArray(lesson.flashcards[0]?.words)
    ? lesson.flashcards.flatMap((group: any) => group.words ?? [])
    : lesson.flashcards;

  return words.filter((word: any) => word?.english && word?.french);
};

// Prefix matches rank above matches in the middle of a word.
const rank = (haystack: string, needle: string) => (haystack.startsWith(needle) ? 0 : 1);

export const searchContent = (
  query: string,
  vocabularyLessons: any[],
  grammarLessons: any[]
): SearchResults => {
  const needle = normalizeSearchText(query);
  if (needle.length < 2) return { lessons: [], words: [] };

  const lessons: LessonHit[] = [];
  const seenLessons = new Set<string>();
  const addLessons = (type: LessonHit['type'], list: any[]) => {
    list.forEach((lesson) => {
      const title = String(lesson?.title ?? '').trim();
      const key = `${type}:${normalizeSearchText(title)}`;
      if (!title || seenLessons.has(key) || !normalizeSearchText(title).includes(needle)) return;
      seenLessons.add(key);
      lessons.push({ type, title, lesson });
    });
  };
  addLessons('vocabulary', vocabularyLessons);
  addLessons('grammar', grammarLessons);
  lessons.sort((a, b) => rank(normalizeSearchText(a.title), needle) - rank(normalizeSearchText(b.title), needle));

  const words: Array<WordHit & { score: number }> = [];
  const seenWords = new Set<string>();
  vocabularyLessons.forEach((lesson) => {
    getLessonWords(lesson).forEach((word) => {
      const english = normalizeSearchText(word.english);
      const french = normalizeSearchText(word.french);
      if (!english.includes(needle) && !french.includes(needle)) return;

      const key = `${english}|${french}`;
      if (seenWords.has(key)) return;
      seenWords.add(key);
      words.push({
        word,
        lessonTitle: String(lesson?.title ?? ''),
        lesson,
        score: Math.min(rank(english, needle), rank(french, needle)),
      });
    });
  });
  words.sort((a, b) => a.score - b.score || a.word.english.localeCompare(b.word.english));

  return {
    lessons: lessons.slice(0, MAX_LESSON_HITS),
    words: words.slice(0, MAX_WORD_HITS).map(({ score: _score, ...hit }) => hit),
  };
};
