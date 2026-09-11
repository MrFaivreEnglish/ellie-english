
import Assets from '../../assets/index';

const normalizeKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/vocabulary|vocab/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const lessonThumbnails: Record<string, any> = (Assets as any)?.lessonThumbnails ?? {};
const normalizedLessonThumbnails: Record<string, any> = {};
Object.keys(lessonThumbnails).forEach(k => {
  normalizedLessonThumbnails[normalizeKey(k)] = lessonThumbnails[k];
});

const cleanLessonTitle = (title: string) => title.replace(/\s*\d+/, '').trim();

const DEFAULT_LESSON_IMAGE_URL = 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/_default.png';

const REMOTE_LESSON_IMAGE_MAP: Record<string, string> = {
  'Breakfast': 'https://i.ibb.co/ccHn7jd6/Breakfast-vocab-full-1.png',
  'School Life': 'https://i.ibb.co/bgbqVH2x/School-lvl-2-1.png',
  'Activities': 'https://i.ibb.co/84QWpWQP/Activities-vocab-1.png',
  'Classroom English': 'https://i.ibb.co/p6sZrdq5/Classroom-English-1.png',
  'Animals': 'https://i.ibb.co/XZ31xVNX/Animals-1.png',
  'Bullying': 'https://i.ibb.co/hxZ10K6L/Bullying-1.png',
  'Cinema': 'https://i.ibb.co/Z6zDCY6j/cinema-1.png',
  'City Travel': 'https://i.ibb.co/YT4vs9wz/City-Travel-vocab-1.png',
  'Clothes': 'https://i.ibb.co/ZRyWgvpd/clothes-vocab-1.png',
  'Detective': 'https://i.ibb.co/DPMqZP1s/detective-vocab.png',
  'Dystopia': 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/dystopia.webp',
  'Emotions': 'https://i.ibb.co/2Y6s2xj9/emotions.png',
  'Emotions +': 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/emotions-plus.webp',
  'Emotions Plus': 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/emotions-plus.webp',
  'More Emotions': 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/emotions-plus.webp',

  'Legends': 'https://i.ibb.co/MxL8yr1M/Legends-1.png',
  'American Dishes': 'https://i.ibb.co/G4XBTJqc/American-dishes-1.png',
  'Furniture': 'https://i.ibb.co/GQcCgKJP/Furniture-1.png',
  'Geography': 'https://i.ibb.co/9kYG43Mb/Geography-1.png',
  'Internet': 'https://i.ibb.co/FkY9x5xz/internet-vocab-1.png',
  'Jobs': 'https://i.ibb.co/7xxYM1RG/Getting-a-job-1.png',
  'Opinion': 'https://i.ibb.co/vKCrpvZ/Opinion-Vocabulary-Level-1-1.png',
  'Physical Description': 'https://i.ibb.co/GvT9F0C5/physical-description-1.png',
  'Question Words': 'https://i.ibb.co/wZHLqrft/Question-Words.png',
  'The UK': 'https://i.ibb.co/LhbXVsBd/The-United-Kingdom-and-Ireland.png',
  'Video Games': 'https://i.ibb.co/dwrBYJ6w/Video-games-1.png',
  'Love': 'https://i.ibb.co/bj4j7Z1M/Love-1.png',
  'Robots': 'https://i.ibb.co/LDCw0bfw/Robots-1.png',
  'Body': 'https://i.ibb.co/G3tT2nRx/Body-1.png',
  'Ecology': 'https://i.ibb.co/Rp03r932/Ecology-1.png',
  'Video game actions / Superpowers': 'https://i.ibb.co/JWkDKwqh/vocabulary-superpowers.png',
  'Space': 'https://i.ibb.co/pjrn98PB/Space-1.png',
  'Food Basics': 'https://i.ibb.co/ZRJb70VG/Food-basics-1.png',
  'Frequency Adverbs': 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/frequency-adverbs.png',
  'School Basics': 'https://i.ibb.co/QjH4wXwB/School-basics-1.png',
  'Instructions': 'https://i.ibb.co/yFRkjChy/Instructions-1.png',
  'Colours': 'https://i.ibb.co/SD63ymQ6/Colours-21-x-29-7-cm-1.png',
  'Nationality': 'https://i.ibb.co/3m3S215g/nationality-1.png',
  'Personality (Easy)': 'https://i.ibb.co/jvksTHBV/personality-Level-1-1.png',
  'Opinion (Easy)': 'https://i.ibb.co/vKCrpvZ/Opinion-Vocabulary-Level-1-1.png',
  'Emotions (Easy)': 'https://i.ibb.co/jvsJNkT7/emotions-level-1-1.png',
  'Daily Routine': 'https://i.ibb.co/WbXV0WN/daily-routine-1.png',
  'Date': 'https://i.ibb.co/svMJrpHK/date-vocab-1.png',
  'House': 'https://i.ibb.co/fzKsmjj1/House-1.png',
  'Describing a picture': 'https://i.ibb.co/1YgLG27F/Describing-a-picture.png',
  'Location': 'https://i.ibb.co/h5Nz2XP/Location-1.png',
  'Time': 'https://i.ibb.co/LdCCZ0Px/Time.png',
  'Family': 'https://i.ibb.co/vCMp3b90/Family-Vocab.png',
  'Video Game Actions': 'https://i.ibb.co/NgCRZLJP/video-game-actions.png',
  'Daily Questions': 'https://i.ibb.co/PZ16zHh2/Daily-questions-1.png',
  'Alphabet': 'https://i.ibb.co/Y7Bqg8LK/alphabet-1.png',
  'Superpowers': 'https://i.ibb.co/JWkDKwqh/vocabulary-superpowers.png',
  Camelot: 'https://i.ibb.co/whw9Gx7S/fiche-vocabulaire-camelot-v2.png',
  'The Blitz': 'https://i.ibb.co/wZCFydXd/Blitz-1.png',
};

const NORMALIZED_REMOTE_LESSON_IMAGE_MAP: Record<string, string> = {};
Object.keys(REMOTE_LESSON_IMAGE_MAP).forEach(k => {
  NORMALIZED_REMOTE_LESSON_IMAGE_MAP[normalizeKey(k)] = REMOTE_LESSON_IMAGE_MAP[k];
});

export const shuffleArray = <T,>(array: T[], random: () => number = Math.random): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomValue = Math.max(0, Math.min(0.9999999999999999, random()));
    const j = Math.floor(randomValue * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const countAlignedMatchingPairs = <T,>(
  left: T[],
  right: T[],
  getPairId: (card: T) => string | number
) => left.reduce(
  (count, card, index) => count + (right[index] && getPairId(card) === getPairId(right[index]) ? 1 : 0),
  0
);





export const shuffleMatchingPairColumns = <T,>(
  leftCards: T[],
  rightCards: T[],
  getPairId: (card: T) => string | number,
  options: { random?: () => number; adjacentPairChance?: number } = {}
): { left: T[]; right: T[] } => {
  const random = options.random ?? Math.random;
  const adjacentPairChance = Math.max(0, Math.min(1, options.adjacentPairChance ?? 0.22));
  const left = shuffleArray(leftCards, random);
  const maxAlignedPairs = random() < adjacentPairChance ? 1 : 0;

  let bestRight = shuffleArray(rightCards, random);
  let bestAlignedCount = countAlignedMatchingPairs(left, bestRight, getPairId);

  for (let attempt = 1; attempt < 12 && bestAlignedCount > maxAlignedPairs; attempt += 1) {
    const candidate = shuffleArray(rightCards, random);
    const alignedCount = countAlignedMatchingPairs(left, candidate, getPairId);

    if (alignedCount < bestAlignedCount) {
      bestRight = candidate;
      bestAlignedCount = alignedCount;
    }
  }

  if (bestAlignedCount <= maxAlignedPairs || left.length <= 1) {
    return { left, right: bestRight };
  }




  // Deterministic rotation enforces the adjacency cap if random retries fail.
  const rightByPairId = new Map(rightCards.map((card) => [getPairId(card), card]));
  const rightInLeftOrder = left.map((card) => rightByPairId.get(getPairId(card)));

  if (rightInLeftOrder.every((card): card is T => card !== undefined)) {
    const offset = 1 + Math.floor(Math.max(0, Math.min(0.9999999999999999, random())) * (left.length - 1));
    return {
      left,
      right: rightInLeftOrder.map((_, index) => rightInLeftOrder[(index + offset) % rightInLeftOrder.length]),
    };
  }

  return { left, right: bestRight };
};

export const getLessonImage = (title: string): string => {
  if (REMOTE_LESSON_IMAGE_MAP[title]) return REMOTE_LESSON_IMAGE_MAP[title];

  const cleanTitle = cleanLessonTitle(title);
  const lookupKey = normalizeKey(cleanTitle);
  return NORMALIZED_REMOTE_LESSON_IMAGE_MAP[lookupKey] || REMOTE_LESSON_IMAGE_MAP[cleanTitle] || DEFAULT_LESSON_IMAGE_URL;
};

export const PAIRS_PER_SET = 5;
export const DESKTOP_PAIRS_PER_SET = 6;





export const getPairsPerSetForLayout = (isDesktopWeb: boolean) =>
  isDesktopWeb ? DESKTOP_PAIRS_PER_SET : PAIRS_PER_SET;

export const getMatchingSetRanges = (wordCount: number, maxPairsPerSet = PAIRS_PER_SET) => {
  const safeWordCount = Math.max(0, wordCount);
  const safeMaxPairs = Math.max(2, maxPairsPerSet);
  const ranges: Array<{ start: number; end: number }> = [];

  let start = 0;
  while (start < safeWordCount) {
    const end = Math.min(start + safeMaxPairs, safeWordCount);
    ranges.push({ start, end });
    start = end;
  }

  const lastRange = ranges[ranges.length - 1];
  const previousRange = ranges[ranges.length - 2];

  // Avoid a final matching set containing only one pair.
  if (lastRange && previousRange && lastRange.end - lastRange.start === 1 && previousRange.end - previousRange.start > 2) {
    previousRange.end -= 1;
    lastRange.start -= 1;
  }

  return ranges;
};

export const getMatchingSetCount = (wordCount: number, maxPairsPerSet = PAIRS_PER_SET) =>
  getMatchingSetRanges(wordCount, maxPairsPerSet).length;

export const getMatchingSetWords = <T,>(words: T[], setIndex: number, maxPairsPerSet = PAIRS_PER_SET): T[] => {
  const ranges = getMatchingSetRanges(words.length, maxPairsPerSet);
  const range = ranges[setIndex];

  if (!range) return [];

  return words.slice(range.start, range.end);
};

export const getLocalLessonImage = (title: string): any => {
  if (lessonThumbnails[title]) return lessonThumbnails[title];

  const rawNormalizedTitle = normalizeKey(title);
  if (normalizedLessonThumbnails[rawNormalizedTitle]) return normalizedLessonThumbnails[rawNormalizedTitle];

  const clean = cleanLessonTitle(title);

  if (lessonThumbnails[clean]) return lessonThumbnails[clean];

  const normalizedTitle = normalizeKey(clean);
  if (normalizedLessonThumbnails[normalizedTitle]) return normalizedLessonThumbnails[normalizedTitle];

  return undefined;
};

export const getLessonThumbnailSource = (lesson: { title?: string; thumbnail?: any } | null | undefined): any => {
  if (lesson?.thumbnail) return lesson.thumbnail;
  if (!lesson?.title) return undefined;

  return getLocalLessonImage(lesson.title);
};







export const getSerializableVocabularyLesson = <T extends { thumbnail?: any }>(lesson: T): T => {
  const thumbnail = lesson?.thumbnail;
  if (!thumbnail || typeof thumbnail === 'number') return lesson;

  if (typeof thumbnail === 'object' && typeof thumbnail.uri === 'string') {
    return { ...lesson, thumbnail: { uri: thumbnail.uri } };
  }

  // Navigation params may keep numeric asset IDs or URI objects, but not native asset records.
  const serializableLesson = { ...lesson };
  delete serializableLesson.thumbnail;
  return serializableLesson;
};
