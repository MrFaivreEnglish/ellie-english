import { useMemo } from 'react';

export function useLessonWords(lesson: any, mode: string) {
  // ALL WORDS
  const allWords = useMemo(() => {
    if (!lesson?.flashcards) return [];
    return Array.isArray(lesson.flashcards[0]?.words)
      ? lesson.flashcards.flatMap((c: any) => c.words)
      : lesson.flashcards;
  }, [lesson?.flashcards]);

  // CATEGORIES (we keep it for now, even if unused later)
  const categories = useMemo(() => {
    if (!lesson?.flashcards) return [];

    if (Array.isArray(lesson.flashcards[0]?.words)) {
      return lesson.flashcards
        .map((c: any) => c.category)
        .filter(Boolean);
    }

    return [];
  }, [lesson?.flashcards]);

  // FILTERED WORDS (for now = no filtering yet, just return all)
  const filteredWords = useMemo(() => {
    return allWords;
  }, [allWords]);

  // TYPE WRITING WORDS
  const typingWords = useMemo(() => {
    if (mode !== 'typing') return [];
    if (!allWords?.length) return [];
    return [...allWords].sort(() => Math.random() - 0.5);
  }, [allWords, mode]);

  return {
    allWords,
    categories,
    filteredWords,
    typingWords,
  };
}
