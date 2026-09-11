import ArticlesGrammar from '../grammar/ArticlesGrammar';
import BeGoingToGrammar from '../grammar/BeGoingToGrammar';
import BePreteritGrammar from '../grammar/BePreteritGrammar';
import BeVerbGrammar from '../grammar/BeVerbGrammar';
import CanBeAbleToGrammar from '../grammar/CanBeAbleToGrammar';
import CanGrammar from '../grammar/CanGrammar';
import ComparativeGrammar from '../grammar/ComparativeGrammar';
import ComparativeInferiorityEqualityGrammar from '../grammar/ComparativeInferiorityEqualityGrammar';
import Conditional1Grammar from '../grammar/Conditional1Grammar';
import Conditional2Grammar from '../grammar/Conditional2Grammar';
import CouldGrammar from '../grammar/CouldGrammar';
import FrequencyGrammar from '../grammar/FrequencyGrammar';
import FutureWillGrammar from '../grammar/FutureWillGrammar';
import GenitiveGrammar from '../grammar/GenitiveGrammar';
import HadToWasAllowedToGrammar from '../grammar/HadToWasAllowedToGrammar';
import HaveHaveGotGrammar from '../grammar/HaveHaveGotGrammar';
import HypothesesGrammar from '../grammar/HypothesesGrammar';
import ImperativeGrammar from '../grammar/ImperativeGrammar';
import LikeGrammar from '../grammar/LikeGrammar';
import MustGrammar from '../grammar/MustGrammar';
import MustHaveToGrammar from '../grammar/MustHaveToGrammar';
import PassivePastGrammar from '../grammar/PassivePastGrammar';
import PassivePresGrammar from '../grammar/PassivePresGrammar';
import PastIngGrammar from '../grammar/PastIngGrammar';
import PastPerfectGrammar from '../grammar/PastPerfectGrammar';
import PossessivesGrammar from '../grammar/PossessivesGrammar';
import PresentIngGrammar from '../grammar/PresentIngGrammar';
import PresentIngInterrogativeGrammar from '../grammar/PresentIngInterrogativeGrammar';
import PresentNegativeGrammar from '../grammar/PresentNegativeGrammar';
import PresentPerfectGrammar from '../grammar/PresentPerfectGrammar';
import PresentPerfectNIGrammar from '../grammar/PresentPerfectNIGrammar';
import PresentSimpleGrammar from '../grammar/PresentSimpleGrammar';
import PreteritGrammar from '../grammar/PreteritGrammar';
import PreteritNIGrammar from '../grammar/PreteritNIGrammar';
import PronouncingEDGrammar from '../grammar/PronouncingEDGrammar';
import RelativePronounsGrammar from '../grammar/RelativePronounsGrammar';
import ShouldGrammar from '../grammar/ShouldGrammar';
import SinceForGrammar from '../grammar/SinceForGrammar';
import SuperlativeGrammar from '../grammar/SuperlativeGrammar';
import SuperlativeInferiorityGrammar from '../grammar/SuperlativeInferiorityGrammar';
import WordTypesGrammar from '../grammar/WordTypesGrammar';
import WouldLikeGrammar from '../grammar/WouldLikeGrammar';
import type { Exercise, ExerciseMode } from '../../features/grammar/grammarExercises/GrammarExerciseUtils';
import {
  isFillExercise,
  isReorderExercise,
  isTranslateExercise,
  groupNounPhraseTokens,
  tokenizeTranslateAnswer,
} from '../../features/grammar/grammarExercises/GrammarExerciseUtils';

type LessonModeConfig = {
  quiz?: boolean;
  fill: boolean;
  reorder: boolean;
  translate: boolean;
};

const grammarLessonModes: Record<string, LessonModeConfig> = {
  '40': { fill: true, reorder: false, translate: true },
  '16': { fill: true, reorder: false, translate: true },
  BePreterit: { fill: true, reorder: false, translate: true },
  '43': { fill: true, reorder: false, translate: true },
  '31': { fill: false, reorder: true, translate: true },
  '21': { fill: false, reorder: true, translate: true },
  '7': { fill: true, reorder: false, translate: true },
  '32': { fill: true, reorder: false, translate: true },
  '12': { fill: true, reorder: false, translate: true },
  '13': { fill: true, reorder: false, translate: true },
  '33': { fill: false, reorder: true, translate: true },
  '37': { fill: false, reorder: true, translate: true },
  '15': { fill: false, reorder: true, translate: true },
  '44': { fill: false, reorder: true, translate: true },
  '34': { fill: false, reorder: true, translate: true },
  '88': { fill: true, reorder: false, translate: true },
  '26': { fill: false, reorder: true, translate: true },
  '25': { fill: true, reorder: false, translate: true },
  '17': { fill: true, reorder: false, translate: true },
  '9': { fill: false, reorder: true, translate: true },
  '27': { fill: false, reorder: true, translate: true },
  '38': { fill: false, reorder: true, translate: true },
  '18': { fill: false, reorder: true, translate: true },
  '20': { fill: true, reorder: false, translate: true },
  '5': { fill: true, reorder: false, translate: true },
  '42': { fill: true, reorder: false, translate: true },
  '4': { fill: true, reorder: false, translate: true },
  '24': { fill: true, reorder: false, translate: true },
  '2': { fill: false, reorder: true, translate: true },
  '6': { fill: true, reorder: false, translate: true },
  '35': { fill: true, reorder: false, translate: true },
  '1': { fill: true, reorder: false, translate: true },
  '3': { fill: true, reorder: false, translate: true },
  '36': { fill: false, reorder: true, translate: true },
  'ED-1': { fill: false, reorder: false, translate: false },
  '39': { fill: true, reorder: false, translate: true },
  '10': { fill: false, reorder: true, translate: true },
  '30': { fill: true, reorder: false, translate: true },
  '8': { fill: true, reorder: false, translate: true },
  '22': { fill: true, reorder: false, translate: true },
  '41': { fill: false, reorder: false, translate: false },
  '11': { fill: false, reorder: true, translate: true },
};

const defaultLessonModeConfig: LessonModeConfig = {
  fill: false,
  reorder: false,
  translate: true,
};

const applyTranslateLessonOverrides = (lesson: any, exercise: any) => {
  const normalizedExercise = lesson.id === '40' || !Array.isArray(exercise.wordBank)
    ? exercise
    : { ...exercise, wordBank: groupNounPhraseTokens(exercise.wordBank) };

  switch (lesson.id) {
    case '34':
      return {
        ...normalizedExercise,
        distractorMode: 'modal-past' as const,
        distractors: [...(normalizedExercise.distractors ?? []), 'was', 'were'],
      };
    case '27':
      return {
        ...normalizedExercise,
        distractorMode: 'modal-ing' as const,
      };
    case '38':
      return {
        ...normalizedExercise,
        distractorMode: 'passive-past' as const,
        distractors: [...(normalizedExercise.distractors ?? []), 'was', 'were'],
      };
    case '2':
      return {
        ...normalizedExercise,
        distractorMode: 'present-negative' as const,
        distractors: [...(normalizedExercise.distractors ?? []), "don't", "doesn't"],
      };
    default:
      return normalizedExercise;
  }
};

const splitGenitiveWords = (words: string[]) =>
  words.flatMap((word) => {
    const match = word.match(/^(.+?)('s)([.!?]?)$/i);
    if (!match) return [word];
    const [, base, suffix, punctuation] = match;
    return [base, `${suffix}${punctuation}`];
  });

const buildReorderWordBank = (words: string[]) => {
  return words.map((word, index) => ({ id: `answer-${index}`, word }));
};

const stripReorderDistractorFields = (exercise: any) => {
  const nextExercise = { ...exercise };
  delete nextExercise.distractors;
  delete nextExercise.distractorMode;
  delete nextExercise.wordBank;
  return nextExercise;
};

const applyReorderLessonOverrides = (lesson: any, exercise: any) => {
  if (!isReorderExercise(exercise)) return exercise;

  let nextWords = Array.isArray(exercise.words) ? [...exercise.words] : [];

  switch (lesson.id) {
    case '44':
      nextWords = splitGenitiveWords(nextWords);
      break;
    default:
      break;
  }

  const reorderExercise = stripReorderDistractorFields(exercise);

  return {
    ...reorderExercise,
    words: nextWords,
    reorderWordBank: buildReorderWordBank(nextWords),
  };
};

const buildReorderExerciseFromTranslateAnswer = (lesson: any, exercise: any) => {
  if (typeof exercise.answer !== 'string') return null;

  const baseExercise = stripReorderDistractorFields(exercise);
  const words = tokenizeTranslateAnswer(exercise.answer);

  return applyReorderLessonOverrides(lesson, {
    ...baseExercise,
    type: 'reorder' as const,
    question: 'Put the words in order.',
    prompt: undefined,
    options: undefined,
    words,
  });
};

const buildAvailableModes = (
  modeConfig: LessonModeConfig
): Partial<Record<ExerciseMode, boolean>> => ({
  quiz: modeConfig.quiz ?? true,
  fill: modeConfig.fill,
  reorder: modeConfig.reorder,
  translate: modeConfig.translate,
});

const buildLessonExercises = (lesson: any, modeConfig: LessonModeConfig) => {
  if (lesson.practiceType === 'vocabulary') return [];

  const baseExercises = modeConfig.reorder
    ? lesson.exercises
        .map((exercise: any) => applyReorderLessonOverrides(lesson, exercise))
    : lesson.exercises.filter((exercise: any) => !isReorderExercise(exercise));

  const translateExercises = modeConfig.translate
    ? (lesson.translateExercises ?? []).map((exercise: any) => applyTranslateLessonOverrides(lesson, exercise))
    : [];

  const reorderExercises = modeConfig.reorder
    ? (lesson.translateExercises ?? [])
        .map((exercise: any) => buildReorderExerciseFromTranslateAnswer(lesson, exercise))
        .filter(Boolean)
    : [];

  return [...baseExercises, ...reorderExercises, ...translateExercises];
};

const getGrammarLessonProgressId = (lesson: any) =>
  String(lesson.id ?? lesson.title ?? 'grammar-lesson');

const slugifyGrammarLessonId = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mixed';

const MIXED_GRAMMAR_FALLBACK_IMAGE_URL = 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/les-groupes-de-mots.webp';
const MIXED_GRAMMAR_IMAGE_URL_FIELD = 'imageUrl';

const getLessonImageUrl = (lesson: any) =>
  typeof lesson.imageUrl === 'string' && lesson.imageUrl.trim().length > 0
    ? lesson.imageUrl
    : null;

const getStableImageIndex = (seed: string, itemCount: number) => {
  if (itemCount <= 1) return 0;

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % itemCount;
};

const prepareGrammarLesson = (lesson: any) => {
  const modeConfig = grammarLessonModes[lesson.id] ?? defaultLessonModeConfig;

  return {
    ...lesson,
    availableModes: buildAvailableModes(modeConfig),
    exercises: buildLessonExercises(lesson, modeConfig),
  };
};

const tagExerciseSourceLesson = (exercise: Exercise, lesson: any): Exercise => ({
  ...exercise,
  sourceLesson: {
    id: lesson.id,
    title: lesson.title,
  },
});

export const createMixedGrammarLesson = ({
  idSeed,
  title,
  description,
  sourceLessons: requestedSourceLessons,
}: {
  idSeed: string;
  title: string;
  description: string;
  sourceLessons: any[];
}) => {
  const sourceLessons = requestedSourceLessons.filter(
    (lesson) =>
      lesson.practiceType !== 'vocabulary' &&
      Array.isArray(lesson.exercises) &&
      lesson.exercises.length > 0
  );

  if (sourceLessons.length < 2) return null;

  const exercises = sourceLessons.flatMap((lesson) =>
    lesson.exercises.map((exercise: Exercise) => tagExerciseSourceLesson(exercise, lesson))
  );

  if (exercises.length === 0) return null;

  const sourceLessonImageCards = sourceLessons
    .map((lesson) => {
      const imageUrl = getLessonImageUrl(lesson);

      return imageUrl
        ? {
            id: getGrammarLessonProgressId(lesson),
            title: lesson.title,
            imageUrl,
          }
        : null;
    })
    .filter((imageCard): imageCard is { id: string; title: string; imageUrl: string } => !!imageCard);
  const sourceLessonImages = sourceLessonImageCards.map((imageCard) => imageCard.imageUrl);
  const selectedImageUrl =
    sourceLessonImages[getStableImageIndex(idSeed, sourceLessonImages.length)] ??
    MIXED_GRAMMAR_FALLBACK_IMAGE_URL;

  return {
    id: `grammar-mix-${slugifyGrammarLessonId(idSeed)}`,
    title,
    description,
    [MIXED_GRAMMAR_IMAGE_URL_FIELD]: selectedImageUrl,
    isMixedGrammarLesson: true,
    sourceLessonCount: sourceLessons.length,
    sourceLessonImageCards,
    sourceLessonImages,
    sourceLessonProgressKeys: sourceLessons.map(getGrammarLessonProgressId),
    availableModes: {
      quiz: true,
      fill: exercises.some(isFillExercise),
      reorder: exercises.some(isReorderExercise),
      translate: exercises.some(isTranslateExercise),
    },
    exercises,
  };
};

const buildMixedGrammarLesson = (subcategoryTitle: string, lessons: any[]) =>
  createMixedGrammarLesson({
    idSeed: subcategoryTitle,
    title: `Mixed practice: ${subcategoryTitle}`,
    description: `Mix sentences from ${lessons.length} grammar lessons.`,
    sourceLessons: lessons,
  });

const irregularVerbPracticeOptions = {
  flashcardLabels: {
    english: 'Conjugation',
    french: 'Verb',
  },
  initialReverseDirection: true,
  allowMultiCategorySelection: true,
  categoryPickerTitle: 'Select lessons',
  categoryPickerLabel: 'Lessons',
  categoryPickerAllLabel: 'All lessons',
  typingPromptLabel: 'Verb',
  typingAnswerPlaceholder: 'Type the conjugation',
};

const IrregularVerbsSpecialOnes = {
  id: 'irregular-verbs-special-ones-1',
  title: 'Irregular Verbs 1 : Irréguliers spéciaux',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/irregular-verbs-1-irreguliers-speciaux.webp',
  categoryLabel: '1 - Irréguliers spéciaux / uniques',
  ...irregularVerbPracticeOptions,
  flashcards: [
    { english: 'was / were / been - être', french: 'be' },
    { english: 'became / become - devenir', french: 'become' },
    { english: 'came / come - venir', french: 'come' },
    { english: 'did / done - faire', french: 'do' },
    { english: 'went / gone - aller', french: 'go' },
    { english: 'made / made - fabriquer, faire', french: 'make' },
    { english: 'ran / run - courir', french: 'run' },
    { english: 'saw / seen - voir', french: 'see' },
    { english: 'shot / shot - tirer', french: 'shoot' },
    { english: "sat / sat - s'asseoir", french: 'sit' },
  ],
};

const IrregularVerbsDEndings = {
  id: 'irregular-verbs-d-endings-2',
  title: 'Irregular Verbs 2 : Terminaisons en -D',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/irregular-verbs-2-terminaisons-en-d.webp',
  categoryLabel: '2 - Terminaisons en -D',
  ...irregularVerbPracticeOptions,
  flashcards: [
    { english: 'found / found - trouver', french: 'find' },
    { english: 'had / had - avoir', french: 'have' },
    { english: 'heard / heard - entendre', french: 'hear' },
    { english: 'paid / paid - payer', french: 'pay' },
    { english: 'said / said - dire', french: 'say' },
    { english: 'told / told - raconter, dire', french: 'tell' },
    { english: 'understood / understood - comprendre', french: 'understand' },
  ],
};

const IrregularVerbsNoChange = {
  id: 'irregular-verbs-no-change-3',
  title: 'Irregular Verbs 3 : Pas de changement',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/irregular-verbs-3-pas-de-changement.webp',
  categoryLabel: '3 - Facile, pas de changement',
  ...irregularVerbPracticeOptions,
  flashcards: [
    { english: 'cut / cut - couper', french: 'cut' },
    { english: 'let / let - laisser, permettre', french: 'let' },
    { english: 'put / put - mettre', french: 'put' },
    { english: 'cost / cost - coûter', french: 'cost' },
    { english: 'read / read [red] - lire', french: 'read' },
  ],
};

const IrregularVerbsGht = {
  id: 'irregular-verbs-ght-4',
  title: 'Irregular Verbs 4 : GHT',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/irregular-verbs-4-ght.webp',
  categoryLabel: "4 - J'ai acheté, GHT",
  ...irregularVerbPracticeOptions,
  flashcards: [
    { english: 'brought / brought - apporter', french: 'bring' },
    { english: 'bought / bought - acheter', french: 'buy' },
    { english: 'caught / caught - attraper', french: 'catch' },
    { english: 'fought / fought - se battre', french: 'fight' },
    { english: 'thought / thought - penser', french: 'think' },
    { english: 'taught / taught - enseigner', french: 'teach' },
  ],
};

const IrregularVerbsEnParticiple = {
  id: 'irregular-verbs-en-participle-5',
  title: 'Irregular Verbs 5 : Participe en -EN',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/irregular-verbs-5-participe-en-en.webp',
  categoryLabel: '5 - Participe en -EN',
  ...irregularVerbPracticeOptions,
  flashcards: [
    { english: 'broke / broken - casser', french: 'break' },
    { english: 'chose / chosen - choisir', french: 'choose' },
    { english: 'drove / driven - conduire', french: 'drive' },
    { english: 'ate / eaten - manger', french: 'eat' },
    { english: 'fell / fallen - tomber', french: 'fall' },
    { english: 'forgot / forgotten - oublier', french: 'forget' },
    { english: 'got / got / gotten - obtenir', french: 'get' },
    { english: 'gave / given - donner', french: 'give' },
    { english: 'rode / ridden - monter (vélo)', french: 'ride' },
    { english: 'spoke / spoken - parler', french: 'speak' },
    { english: 'stole / stolen - voler, dérober', french: 'steal' },
    { english: 'took / taken - prendre', french: 'take' },
    { english: 'woke / woken - (se) réveiller', french: 'wake' },
    { english: 'wrote / written - écrire', french: 'write' },
  ],
};

const IrregularVerbsEwOwn = {
  id: 'irregular-verbs-ew-own-6',
  title: 'Irregular Verbs 6 : EW / OWN',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/irregular-verbs-6-ew-own.webp',
  categoryLabel: '6 - EW / OWN',
  ...irregularVerbPracticeOptions,
  flashcards: [
    { english: 'knew / known - savoir, connaître', french: 'know' },
    { english: 'flew / flown - voler', french: 'fly' },
    { english: 'threw / thrown - jeter', french: 'throw' },
    { english: 'grew / grown - grandir', french: 'grow' },
  ],
};

const IrregularVerbsTEndings = {
  id: 'irregular-verbs-t-endings-7',
  title: 'Irregular Verbs 7 : Terminaisons en -T',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/irregular-verbs-7-terminaisons-en-t.webp',
  categoryLabel: '7 - Terminaisons en -T',
  ...irregularVerbPracticeOptions,
  flashcards: [
    { english: 'built / built - construire', french: 'build' },
    { english: 'dreamt / dreamt - rêver', french: 'dream' },
    { english: 'felt / felt - sentir, ressentir', french: 'feel' },
    { english: 'kept / kept - garder', french: 'keep' },
    { english: 'learnt / learnt - apprendre', french: 'learn' },
    { english: 'left / left - quitter, laisser', french: 'leave' },
    { english: 'lost / lost - perdre', french: 'lose' },
    { english: 'meant / meant - signifier, vouloir dire', french: 'mean' },
    { english: 'met / met - rencontrer', french: 'meet' },
    { english: 'sent / sent - envoyer', french: 'send' },
    { english: 'slept / slept - dormir', french: 'sleep' },
    { english: 'spent / spent - dépenser', french: 'spend' },
  ],
};

const IrregularVerbsIAU = {
  id: 'irregular-verbs-i-a-u-8',
  title: 'Irregular Verbs 8 : i -> a -> u',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/irregular-verbs-8-i-a-u.webp',
  categoryLabel: '8 - i -> a -> u',
  ...irregularVerbPracticeOptions,
  flashcards: [
    { english: 'began / begun - commencer', french: 'begin' },
    { english: 'drank / drunk - boire', french: 'drink' },
    { english: 'sang / sung - chanter', french: 'sing' },
    { english: 'swam / swum - nager', french: 'swim' },
  ],
};

export const irregularVerbLessons = [
  IrregularVerbsSpecialOnes,
  IrregularVerbsDEndings,
  IrregularVerbsNoChange,
  IrregularVerbsGht,
  IrregularVerbsEnParticiple,
  IrregularVerbsEwOwn,
  IrregularVerbsTEndings,
  IrregularVerbsIAU,
];

const IrregularVerbsPractice = {
  id: 'irregular-verbs-practice',
  title: 'All Irregular Verbs',
  description: 'Choose one or more irregular verb lessons to study together.',
  practiceType: 'vocabulary',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/all-irregular-verbs.webp',
  ...irregularVerbPracticeOptions,
  flashcards: irregularVerbLessons.map((lesson) => ({
    category: lesson.categoryLabel,
    image: lesson.imageUrl,
    words: lesson.flashcards,
  })),
};

const rawGrammarCategories: Array<{
  group: string;
  title: string;
  subcategories: Array<{ title: string; lessons: any[] }>;
}> = [
  {
    group: '🌱 Essentials',
    title: '🌱 Essentials',
    subcategories: [
      { title: 'Bases de grammaire', lessons: [WordTypesGrammar, ArticlesGrammar] },
      { title: 'Temps du présent', lessons: [PresentSimpleGrammar, PresentNegativeGrammar, PresentIngGrammar, PresentIngInterrogativeGrammar] },
      { title: 'Parler de soi', lessons: [LikeGrammar, BeVerbGrammar, HaveHaveGotGrammar] },
      { title: 'La possession', lessons: [GenitiveGrammar, PossessivesGrammar] },
      { title: 'Pouvoir / Devoir', lessons: [CanGrammar, MustGrammar] },
      { title: 'Fréquence', lessons: [FrequencyGrammar] },
    ],
  },
  {
    group: '🌿 Developing',
    title: '🌿 Developing',
    subcategories: [
      { title: 'Temps du passé', lessons: [PreteritGrammar, BePreteritGrammar, PreteritNIGrammar, PastIngGrammar, PronouncingEDGrammar] },
      { title: 'Irregular Verbs', lessons: [IrregularVerbsPractice, ...irregularVerbLessons] },
      { title: 'Futur', lessons: [FutureWillGrammar, BeGoingToGrammar] },
      { title: 'Modaux', lessons: [CanBeAbleToGrammar, MustHaveToGrammar, HypothesesGrammar, WouldLikeGrammar] },
      { title: 'Comparaisons', lessons: [ComparativeGrammar, ComparativeInferiorityEqualityGrammar, SuperlativeGrammar, SuperlativeInferiorityGrammar] },
      { title: 'Ordres/Conseils', lessons: [ShouldGrammar, ImperativeGrammar] },
    ],
  },
  {
    group: '🌳 Growing strong',
    title: '🌳 Growing strong',
    subcategories: [
      { title: 'Temps parfaits', lessons: [PresentPerfectGrammar, PresentPerfectNIGrammar, PastPerfectGrammar, SinceForGrammar] },
      { title: 'Voix passive', lessons: [PassivePresGrammar, PassivePastGrammar] },
      { title: 'Pronoms', lessons: [RelativePronounsGrammar] },
      { title: 'Modaux avancés', lessons: [HadToWasAllowedToGrammar, CouldGrammar] },
      { title: 'Conditions', lessons: [Conditional1Grammar, Conditional2Grammar] },
    ],
  },
];

export const grammarCategories = rawGrammarCategories.map((level) => ({
  ...level,
  subcategories: level.subcategories.map((subcategory) => {
    const lessons = subcategory.lessons.map(prepareGrammarLesson);

    return {
      ...subcategory,
      lessons,
      mixedLesson: buildMixedGrammarLesson(subcategory.title, lessons),
    };
  }),
}));

export const grammarLessons: any[] = grammarCategories.flatMap((level) =>
  level.subcategories.flatMap((subcategory) => subcategory.lessons)
);
