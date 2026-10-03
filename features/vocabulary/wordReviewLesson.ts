import type { VocabularyLesson } from '../../types/lessonTypes';
import type { RootStackParamList } from '../../types/navigationTypes';
import type { ReviewWord } from './reviewWordsStorage';

export const WORD_REVIEW_LESSON_ID = 'words-to-review';
// Enough for one sitting; the rest stay due and come up next time.
export const MAX_WORDS_PER_REVIEW = 20;

// A review session is an ordinary vocabulary lesson built from the due words, so it gets
// flashcards, matching and typing for free. It opens on typing, which is what moves words
// through the review schedule.
export const buildWordReviewLesson = (words: ReviewWord[]): VocabularyLesson => ({
  id: WORD_REVIEW_LESSON_ID,
  title: 'Words to review',
  description: 'Words you got wrong while typing, back for another go.',
  flashcards: words.slice(0, MAX_WORDS_PER_REVIEW).map((word) => ({
    english: word.english,
    french: word.french,
    ...(word.alternatives?.length ? { alternatives: word.alternatives } : {}),
    ...(word.lessonTitle ? { sourceLesson: { title: word.lessonTitle } } : {}),
  })),
  isWordReview: true,
});

type RootNavigation = {
  navigate: (screen: 'MainTabs', params: RootStackParamList['MainTabs']) => void;
};

// Back returns to the root screen the review was opened from (Home or My words).
export const openWordReview = (
  navigation: RootNavigation,
  words: ReviewWord[],
  from: { backLabel: string; backTarget: 'Home' | 'MyWords' } = { backLabel: 'Back to Home', backTarget: 'Home' }
) => {
  if (words.length === 0) return;

  navigation.navigate('MainTabs', {
    screen: 'Vocabulary',
    params: {
      screen: 'VocabularyLesson',
      params: {
        lesson: buildWordReviewLesson(words),
        initialMode: 'typing',
        backLabel: from.backLabel,
        backTarget: from.backTarget,
      },
    },
  });
};
