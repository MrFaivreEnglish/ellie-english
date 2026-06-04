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
import { ExerciseMode, isReorderExercise, tokenizeTranslateAnswer } from '../../features/grammar/grammarExercises/GrammarExerciseUtils';

type LessonModeConfig = {
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
  switch (lesson.id) {
    case '34':
      return {
        ...exercise,
        distractorMode: 'modal-past' as const,
        distractors: [...(exercise.distractors ?? []), 'was', 'were'],
      };
    case '27':
      return {
        ...exercise,
        distractorMode: 'modal-ing' as const,
      };
    case '38':
      return {
        ...exercise,
        distractorMode: 'passive-past' as const,
        distractors: [...(exercise.distractors ?? []), 'was', 'were'],
      };
    case '2':
      return {
        ...exercise,
        distractorMode: 'present-negative' as const,
        distractors: [...(exercise.distractors ?? []), "don't", "doesn't"],
      };
    default:
      return exercise;
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
  quiz: true,
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
  imageUrl: 'https://i.ibb.co/3yvDCN98/page-1.webp',
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
  imageUrl: 'https://i.ibb.co/1fLpXKFR/page-2.webp',
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
  imageUrl: 'https://i.ibb.co/FqKkTP9m/page-3.webp',
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
  imageUrl: 'https://i.ibb.co/W4Mv6pGt/page-4.webp',
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
  imageUrl: 'https://i.ibb.co/rf2gbgbw/page-5.webp',
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
  imageUrl: 'https://i.ibb.co/HT3Z9xHz/page-6.webp',
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
  imageUrl: 'https://i.ibb.co/BHqBFsct/page-7.webp',
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
  imageUrl: 'https://i.ibb.co/p6jypHgK/page-8.webp',
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
  imageUrl: 'https://i.ibb.co/Wp4jY2Xw/Irregular-verbs-59-4-x-42-cm.webp',
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
  subcategories: level.subcategories.map((subcategory) => ({
    ...subcategory,
    lessons: subcategory.lessons.map((lesson) => ({
      ...lesson,
      availableModes: buildAvailableModes(grammarLessonModes[lesson.id] ?? defaultLessonModeConfig),
      exercises: buildLessonExercises(
        lesson,
        grammarLessonModes[lesson.id] ?? defaultLessonModeConfig
      ),
    })),
  })),
}));

export const grammarLessons: any[] = grammarCategories.flatMap((level) =>
  level.subcategories.flatMap((subcategory) => subcategory.lessons)
);
