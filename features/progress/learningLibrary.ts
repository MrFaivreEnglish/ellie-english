import { grammarLessons } from '../../content/lessons/grammarRegistry';
import {
  getGrammarLessonProgressCounts,
  getGrammarLessonProgressKey,
  getGrammarProgressSummary,
} from '../grammar/grammarProgressStorage';
import { getLearnedFlashcardKeysByLesson } from '../vocabulary/flashcardProgressStorage';
import {
  getAllVocabularyLessons,
  getLessonProgressKey,
  getLessonWords,
  vocabularyWordKey,
} from '../vocabulary/knownWords';
import { getMasteredReviewWordCount, getReviewWords, getTodayKey, type ReviewWord } from '../vocabulary/reviewWordsStorage';
import type { Word } from '../../types/VocabularyTypes';

// Everything the My words screen shows: what a student has learnt, lesson by lesson, and
// what is waiting for review. Read-only; it only gathers what other stores already keep.

export type LearnedWordGroup = {
  lessonTitle: string;
  words: Word[];
};

export type PractisedGrammarLesson = {
  title: string;
  answers: number;
};

export type LearningLibrary = {
  learnedGroups: LearnedWordGroup[];
  learnedWordCount: number;
  grammarLessons: PractisedGrammarLesson[];
  grammarAnswerCount: number;
  reviewWords: ReviewWord[];
  dueReviewCount: number;
  masteredReviewCount: number;
};

const OTHER_PRACTICE_TITLE = 'Other practice';

const byTitle = (a: { lessonTitle?: string; title?: string }, b: { lessonTitle?: string; title?: string }) =>
  String(a.lessonTitle ?? a.title).localeCompare(String(b.lessonTitle ?? b.title));

const getLearnedWordGroups = async (): Promise<LearnedWordGroup[]> => {
  const [lessons, learnedByLesson] = await Promise.all([
    getAllVocabularyLessons(),
    getLearnedFlashcardKeysByLesson(),
  ]);

  // The first lesson each word appears in, so a word marked learnt during mixed practice
  // (saved under the mix, not its lesson) still lands under the lesson it comes from.
  const homeByWordKey = new Map<string, { word: Word; lessonTitle: string }>();
  const lessonTitleByKey = new Map<string, string>();
  lessons.forEach((lesson) => {
    const title = String(lesson?.title ?? '').trim();
    if (!title) return;
    lessonTitleByKey.set(getLessonProgressKey(lesson), title);
    getLessonWords(lesson).forEach((word) => {
      const key = vocabularyWordKey(word);
      if (!homeByWordKey.has(key)) homeByWordKey.set(key, { word, lessonTitle: title });
    });
  });

  const groups = new Map<string, Map<string, Word>>();
  const addWord = (lessonTitle: string, key: string, word: Word) => {
    const group = groups.get(lessonTitle) ?? new Map<string, Word>();
    group.set(key, word);
    groups.set(lessonTitle, group);
  };
  const placed = new Set<string>();

  learnedByLesson.forEach((wordKeys, lessonKey) => {
    const lessonTitle = lessonTitleByKey.get(lessonKey);
    wordKeys.forEach((key) => {
      if (placed.has(key)) return;
      placed.add(key);

      const home = homeByWordKey.get(key);
      if (home) {
        addWord(lessonTitle ?? home.lessonTitle, key, home.word);
        return;
      }

      // A word from a lesson that no longer exists: show it as it was saved.
      const [english = '', french = ''] = key.split('|');
      if (english && french) addWord(lessonTitle ?? OTHER_PRACTICE_TITLE, key, { english, french });
    });
  });

  return [...groups.entries()]
    .map(([lessonTitle, words]) => ({
      lessonTitle,
      words: [...words.values()].sort((a, b) => a.english.localeCompare(b.english)),
    }))
    .sort(byTitle);
};

const getPractisedGrammarLessons = async (): Promise<PractisedGrammarLesson[]> => {
  const keyed = grammarLessons
    .filter((lesson) => lesson?.title)
    .map((lesson) => ({ title: String(lesson.title), key: getGrammarLessonProgressKey(lesson) }));
  const counts = await getGrammarLessonProgressCounts(keyed.map((lesson) => lesson.key));

  const practised = new Map<string, PractisedGrammarLesson>();
  keyed.forEach(({ title, key }) => {
    const answers = counts[key] ?? 0;
    // The same lesson can be listed under more than one level; show it once.
    if (answers > 0 && !practised.has(key)) practised.set(key, { title, answers });
  });
  return [...practised.values()].sort(byTitle);
};

export const getLearningLibrary = async (): Promise<LearningLibrary> => {
  const [learnedGroups, practisedGrammar, grammarSummary, reviewWords, masteredReviewCount] = await Promise.all([
    getLearnedWordGroups(),
    getPractisedGrammarLessons(),
    getGrammarProgressSummary(),
    getReviewWords(),
    getMasteredReviewWordCount(),
  ]);
  const today = getTodayKey();

  return {
    learnedGroups,
    learnedWordCount: learnedGroups.reduce((total, group) => total + group.words.length, 0),
    grammarLessons: practisedGrammar,
    grammarAnswerCount: grammarSummary.totalCorrectAnswers,
    reviewWords,
    dueReviewCount: reviewWords.filter((word) => word.dueOn <= today).length,
    masteredReviewCount,
  };
};
