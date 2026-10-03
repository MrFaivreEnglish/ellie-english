import { vocabularyCategories } from '../../content/lessons/vocabularyRegistry';
import { getCustomVocabularyLessons } from '../lessons/customLessonStorage';
import {
  getLearnedFlashcardKeysByLesson,
  getLearnedFlashcardRecencyByActivityKey,
  normalizeFlashcardLessonKey,
} from './flashcardProgressStorage';
import { shuffleArray } from './vocabularyUtils';
import type { Word } from '../../types/VocabularyTypes';

const bundledCustomVocabularyLessons = require('../../content/lessons/customVocabularyLessons.json') as any[];

export const getLessonProgressKey = (lesson: any) =>
  normalizeFlashcardLessonKey(String(lesson?.id || lesson?.title || 'lesson'));

export const vocabularyWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;

export const getLessonWords = (lesson: any): Word[] => {
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




export const MAX_VOCAB_RUSH_WORDS = 30;


// Every vocabulary lesson a student can have learned words in: bundled, teacher-added, built-in.
export const getAllVocabularyLessons = async (): Promise<any[]> => {
  const customLessons = await getCustomVocabularyLessons().catch(() => []);
  return [
    ...bundledCustomVocabularyLessons,
    ...customLessons,
    ...vocabularyCategories.flatMap((category) => category.lessons),
  ];
};

export const getKnownVocabularyWords = async (limit = MAX_VOCAB_RUSH_WORDS): Promise<Word[]> => {
  const allLessons = await getAllVocabularyLessons();

  const [learnedByLesson, recencyByActivityKey] = await Promise.all([
    getLearnedFlashcardKeysByLesson(),
    getLearnedFlashcardRecencyByActivityKey(),
  ]);
  const seenWords = new Set<string>();
  const knownWords: { word: Word; recencyDate: string }[] = [];

  allLessons.forEach((lesson) => {
    const lessonKey = getLessonProgressKey(lesson);
    const learnedKeys = learnedByLesson.get(lessonKey);
    if (!learnedKeys?.size) return;

    getLessonWords(lesson).forEach((word) => {
      const wordKey = vocabularyWordKey(word);
      if (!learnedKeys.has(wordKey) || seenWords.has(wordKey)) return;

      seenWords.add(wordKey);


      const recencyDate = recencyByActivityKey.get(`${lessonKey}:${wordKey}`) ?? '';
      knownWords.push({ word, recencyDate });
    });
  });

  if (knownWords.length <= limit) {
    return shuffleArray(knownWords.map((entry) => entry.word));
  }






  const sortedByRecency = [...knownWords].sort((a, b) =>
    b.recencyDate > a.recencyDate ? 1 : b.recencyDate < a.recencyDate ? -1 : 0
  );
  const recentPoolSize = Math.max(limit, Math.ceil(sortedByRecency.length * 0.5));
  const recentPool = shuffleArray(sortedByRecency.slice(0, recentPoolSize));
  const olderPool = shuffleArray(sortedByRecency.slice(recentPoolSize));

  const recentCount = Math.min(recentPool.length, Math.ceil(limit * 0.7));
  const olderCount = Math.min(olderPool.length, limit - recentCount);
  const selected = [...recentPool.slice(0, recentCount), ...olderPool.slice(0, olderCount)];

  if (selected.length < limit) {
    const leftover = [...recentPool.slice(recentCount), ...olderPool.slice(olderCount)];
    selected.push(...leftover.slice(0, limit - selected.length));
  }

  return shuffleArray(selected.map((entry) => entry.word)).slice(0, limit);
};
