import type { Word } from './VocabularyTypes';
import type { Exercise, ExerciseMode } from '../features/grammar/grammarExercises/GrammarExerciseUtils';

// ─── Grammar ─────────────────────────────────────────────────────────────────

export interface GrammarLesson {
  id?: string | number;
  title: string;
  description?: string;
  imageUrl?: string;
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

// ─── Vocabulary ───────────────────────────────────────────────────────────────

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
  isVocabularyMix?: boolean;
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
