
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

// Every lesson now carries its own imageUrl (see scripts/remap-lesson-images.js), so this
// is only reached by a lesson without one. It used to look the title up in a map of old
// imgbb links; imgbb had already deleted some of them, and renaming a lesson broke the
// match anyway. __tests__/lessonSheetImages.test.ts checks no bundled lesson lands here.
export const getLessonImage = (_title: string): string => DEFAULT_LESSON_IMAGE_URL;

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

const asRemoteImageUri = (value: unknown) =>
  typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;

/**
 * Every hosted sheet a vocabulary lesson can show: each category's own sheet, then the
 * whole-lesson sheet picked the same way as useVocabularyLessonContent (the lesson's own
 * image, else a bundled thumbnail, else the hosted image for its title). Used to download
 * a year's sheets before class; bundled thumbnails need no download and add nothing.
 */
export const getLessonSheetImageUris = (lesson: any): string[] => {
  if (!lesson) return [];

  const uris = new Set<string>();

  if (Array.isArray(lesson.flashcards)) {
    lesson.flashcards.forEach((group: any) => {
      const uri = asRemoteImageUri(group?.imageUrl ?? group?.image);
      if (uri) uris.add(uri);
    });
  }

  const ownImage = lesson.imageUrl ?? lesson.image;
  if (ownImage) {
    const uri = asRemoteImageUri(ownImage);
    if (uri) uris.add(uri);
  } else if (lesson.title && !getLessonThumbnailSource(lesson)) {
    uris.add(getLessonImage(lesson.title));
  }

  return [...uris];
};
