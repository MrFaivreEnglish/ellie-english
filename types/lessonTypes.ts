import type { Word } from './VocabularyTypes';
import type { Exercise, ExerciseMode } from '../features/grammar/grammarExercises/GrammarExerciseUtils';








export type GrammarTextAccent = 'blue' | 'coral' | 'amber' | 'teal' | 'green';

export interface GrammarTextColumn {
  label: string;
  accent: GrammarTextAccent;


  rows: Array<string | string[]>;
}

export interface GrammarTextExample {
  en: string;
  fr: string;


  correct?: boolean;
}

export interface GrammarTextSubsection {
  text: string;
  accent: GrammarTextAccent;
  rows: string[];
}

export interface GrammarTextCard {
  eyebrow?: string;
  paragraph?: string;
  tip?: string;
  columns?: GrammarTextColumn[];
  examples?: GrammarTextExample[];
  subsections?: GrammarTextSubsection[];
}

export interface GrammarLessonTextContent {
  cards: GrammarTextCard[];
}

export interface GrammarLesson {
  id?: string | number;
  title: string;
  description?: string;
  imageUrl?: string;
  textContent?: GrammarLessonTextContent;
  exercises: Exercise[];
  availableModes?: Partial<Record<ExerciseMode, boolean>>;
  isMixedGrammarLesson?: boolean;
  sourceLessonCount?: number;
  sourceLessonImages?: string[];
  sourceLessonImageCards?: Array<{ id?: string | number; title?: string; imageUrl?: string }>;
  sourceLessonProgressKeys?: string[];
  practiceType?: 'vocabulary';
  flashcardLabels?: { english: string; french: string };
}



export type VocabGroup = {
  category: string;
  words: Word[];
  imageUrl?: string;
  image?: string;
};

export interface VocabularyLesson {
  id?: string | number;
  title: string;
  description?: string;
  imageUrl?: string;
  image?: string;
  thumbnail?: number | { uri: string };
  category?: string;
  flashcards: Word[] | VocabGroup[];
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isLearnedMix?: boolean;
  // Built on the fly from Words to review (see features/vocabulary/wordReviewLesson.ts).
  isWordReview?: boolean;
  isVocabularyMix?: boolean;
  useRefillMatching?: boolean;
  sourceLessonCount?: number;
  sourceLessonImages?: string[];
  sourceLessonImageCards?: Array<{ id: string; title: string; imageUrl: string }>;
  practiceType?: 'vocabulary';
  categoryLabel?: string;
  flashcardLabels?: { english: string; french: string };
  initialReverseDirection?: boolean;
  allowMultiCategorySelection?: boolean;
  categoryPickerTitle?: string;
  categoryPickerLabel?: string;
  categoryPickerAllLabel?: string;
  typingPromptLabel?: string;
  typingAnswerPlaceholder?: string;
}
