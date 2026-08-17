import { vocabularyCategories } from '../../content/lessons/vocabularyRegistry';
import { getCustomVocabularyLessons } from '../lessons/customLessonStorage';
import { getLearnedFlashcardKeysByLesson, normalizeFlashcardLessonKey } from './flashcardProgressStorage';
import { shuffleArray } from './vocabularyUtils';
import type { Word } from '../../types/VocabularyTypes';

const bundledCustomVocabularyLessons = require('../../content/lessons/customVocabularyLessons.json') as any[];

const getLessonProgressKey = (lesson: any) =>
  normalizeFlashcardLessonKey(String(lesson?.id || lesson?.title || 'lesson'));

const vocabularyWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;

const getLessonWords = (lesson: any): Word[] => {
  if (!lesson?.flashcards) return [];

  const words = Array.isArray(lesson.flashcards[0]?.words)
    ? lesson.flashcards.flatMap((group: any) => group.words ?? [])
    : lesson.flashcards;

  return words
    .map((word: any) => ({
      english: String(word?.english ?? '').trim(),
      french: String(word?.french ?? '').trim(),
    }))
    .filter((word: Word) => word.english && word.french);
};

/** Words the user has marked "learnt" across all lessons, shuffled and capped at `limit`. */
export const getKnownVocabularyWords = async (limit = 30): Promise<Word[]> => {
  const customLessons = await getCustomVocabularyLessons().catch(() => []);
  const allLessons = [
    ...bundledCustomVocabularyLessons,
    ...customLessons,
    ...vocabularyCategories.flatMap((category) => category.lessons),
  ];

  const learnedByLesson = await getLearnedFlashcardKeysByLesson();
  const seenWords = new Set<string>();
  const knownWords: Word[] = [];

  allLessons.forEach((lesson) => {
    const learnedKeys = learnedByLesson.get(getLessonProgressKey(lesson));
    if (!learnedKeys?.size) return;

    getLessonWords(lesson).forEach((word) => {
      const wordKey = vocabularyWordKey(word);
      if (!learnedKeys.has(wordKey) || seenWords.has(wordKey)) return;

      seenWords.add(wordKey);
      knownWords.push(word);
    });
  });

  return shuffleArray(knownWords).slice(0, limit);
};
