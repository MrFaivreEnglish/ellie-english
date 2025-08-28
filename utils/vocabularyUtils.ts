// Removed static image imports that caused bundler resolution errors. We now rely on assets/index.js
// which exports lessonThumbnails (data URIs or local requires) for stable lookups.
// @ts-ignore
const Assets = require('../assets');

const normalizeKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/vocabulary|vocab/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizedLessonThumbnails: Record<string, any> = {};
if (Assets && Assets.lessonThumbnails) {
  Object.keys(Assets.lessonThumbnails).forEach(k => {
    normalizedLessonThumbnails[normalizeKey(k)] = Assets.lessonThumbnails[k];
  });
}

export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getLessonImage = (title: string): string => {
  const cleanTitle = title.replace(/\s*\d+/, '').trim();
  const imageMap: { [key: string]: string } = {
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
    'Emotions': 'https://i.ibb.co/2Y6s2xj9/emotions.png',
    // 'Extreme Sports' thumbnail mapping intentionally removed to allow fallback behavior
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
    'Frequency Adverbs': 'https://i.ibb.co/3mgWMh47/Frequency-Adverbs.png',
    'School Basics': 'https://i.ibb.co/QjH4wXwB/School-basics-1.png',
    'Instructions': 'https://i.ibb.co/yFRkjChy/Instructions-1.png',
    'Colours': 'https://i.ibb.co/SD63ymQ6/Colours-21-x-29-7-cm-1.png',
    // Newly added Extras
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
    'Camelot': 'https://i.ibb.co/whw9Gx7S/fiche-vocabulaire-camelot-v2.png',
    'The Blitz': 'https://i.ibb.co/wZCFydXd/Blitz-1.png'
  };

  // Build a normalized lookup so title capitalization and minor variations don't break the lookup
  const normalizedImageMap: Record<string, string> = {};
  Object.keys(imageMap).forEach(k => {
    normalizedImageMap[normalizeKey(k)] = imageMap[k];
  });

  const lookupKey = normalizeKey(cleanTitle);
  return normalizedImageMap[lookupKey] || imageMap[cleanTitle] || 'https://i.ibb.co/yBB0N2GJ/united-kingdom2.png';
};

export const PAIRS_PER_SET = 6;

export const getLocalLessonImage = (title: string): any => {
  const clean = title.replace(/\s*\d+/, '');

  // Prefer exact key from assets.lessonThumbnails if present
  if (Assets && Assets.lessonThumbnails) {
    if (Assets.lessonThumbnails[clean]) return Assets.lessonThumbnails[clean];

    // Normalized lookup to handle slight title variations
    const normalizedTitle = normalizeKey(clean);
    const normalizedLocalMap: Record<string, any> = Object.keys(Assets.lessonThumbnails).reduce((acc, key) => {
      acc[normalizeKey(key)] = Assets.lessonThumbnails[key];
      return acc;
    }, {} as Record<string, any>);

    if (normalizedLocalMap[normalizedTitle]) return normalizedLocalMap[normalizedTitle];
  }

  // As a final attempt, consult the precomputed normalizedLessonThumbnails (may contain data URIs)
  const normalizedTitleFallback = normalizeKey(clean);
  if (normalizedLessonThumbnails[normalizedTitleFallback]) return normalizedLessonThumbnails[normalizedTitleFallback];

  return undefined;
};