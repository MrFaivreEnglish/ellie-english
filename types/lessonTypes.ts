import type { Word } from './VocabularyTypes';
import type { Exercise, ExerciseMode } from '../features/grammar/grammarExercises/GrammarExerciseUtils';

// ─── Grammar ─────────────────────────────────────────────────────────────────

// A text-mode alternative to a grammar lesson's poster image — transcribed
// from the teacher's original image so students can read it without relying
// on an image loading. `**bold**` segments are the only supported inline
// markup, kept deliberately simple to match what the poster images actually
// emphasize (conjugated verb forms).
export type GrammarTextAccent = 'blue' | 'coral' | 'amber' | 'teal';

export interface GrammarTextColumn {
  label: string;
  accent: GrammarTextAccent;
  // A row is either a single value ("I") or a set of values shown side by
  // side on the same row ([\"Like\", \"Do\"]).
  rows: Array<string | string[]>;
}

export interface GrammarTextExample {
  en: string;
  fr: string;
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
