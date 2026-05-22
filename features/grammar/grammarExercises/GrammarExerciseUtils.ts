export const CARD_HEIGHT = 280;

export interface Exercise {
  question: string;
  answer: string | boolean;
  options?: string[];
  type?: 'choice' | 'fill' | 'reorder' | 'translate';
  words?: string[];
  reorderWordBank?: Array<{ id: string; word: string }>;
  prompt?: string;
  distractors?: string[];
  wordBank?: string[];
}

export type ExerciseMode = 'quiz' | 'fill' | 'reorder' | 'translate';

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const getRandomizedQuestions = (exs: Exercise[], count = 10): Exercise[] => {
  return shuffle(exs)
    .slice(0, count)
    .map(ex =>
      ex.options && typeof ex.answer === 'string'
        ? { ...ex, options: shuffle(ex.options) }
        : ex
    );
};

export const isFillExercise = (exercise: Exercise) => {
  return exercise.type === 'fill' || (typeof exercise.answer === 'string' && exercise.question.includes('___'));
};

export const isReorderExercise = (exercise: Exercise) => {
  return exercise.type === 'reorder' && Array.isArray(exercise.words) && typeof exercise.answer === 'string';
};

export const isTranslateExercise = (exercise: Exercise) => {
  return exercise.type === 'translate' && typeof exercise.answer === 'string';
};

const NOUN_PHRASE_STARTERS = new Set([
  'a',
  'an',
  'the',
  'my',
  'your',
  'his',
  'her',
  'our',
  'their',
  'this',
  'that',
  'these',
  'those',
]);

const stripEdgePunctuation = (value: string) => value.replace(/^[^\w']+|[^\w']+$/g, '');

export const tokenizeTranslateAnswer = (answer: string) => {
  const rawTokens = answer.trim().split(/\s+/).filter(Boolean);
  const groupedTokens: string[] = [];

  for (let index = 0; index < rawTokens.length; index += 1) {
    const token = rawTokens[index];
    const normalizedToken = stripEdgePunctuation(token).toLowerCase();

    if (NOUN_PHRASE_STARTERS.has(normalizedToken) && rawTokens[index + 1]) {
      groupedTokens.push(`${token} ${rawTokens[index + 1]}`);
      index += 1;
      continue;
    }

    groupedTokens.push(token);
  }

  return groupedTokens;
};

const buildTranslateWordBank = (exercise: Exercise) => {
  if (typeof exercise.answer !== 'string') return exercise.wordBank;

  const answerTokens = tokenizeTranslateAnswer(exercise.answer);
  const answerTokenKeys = new Set(answerTokens.map(normalizeAnswer));
  const configuredDistractors = exercise.distractors ?? [];

  const distractors = configuredDistractors
    .filter(token => !answerTokenKeys.has(normalizeAnswer(token)))
    .filter((token, index, list) => list.findIndex(candidate => normalizeAnswer(candidate) === normalizeAnswer(token)) === index);

  return shuffle([...answerTokens, ...distractors]);
};

export const getQuestionsForMode = (exs: Exercise[], mode: ExerciseMode, count = 10): Exercise[] => {
  const translateExercises = exs.filter(isTranslateExercise);
  if (mode === 'translate') {
    return shuffle(translateExercises)
      .slice(0, count)
      .map(ex => ({
        ...ex,
        options: undefined,
        wordBank: shuffle(ex.wordBank ?? buildTranslateWordBank(ex) ?? []),
      }));
  }

  const filtered = mode === 'fill'
    ? exs.filter(isFillExercise).map(ex => ({ ...ex, type: 'fill' as const, options: undefined }))
    : mode === 'reorder'
      ? exs.filter(isReorderExercise).map(ex => ({ ...ex, options: undefined }))
      : exs.filter(ex => ex.type !== 'fill' && ex.type !== 'reorder' && ex.type !== 'translate');

  return getRandomizedQuestions(filtered, count);
};

export const normalizeAnswer = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+'s\b/g, "'s")
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/[.!?]+$/g, '');
