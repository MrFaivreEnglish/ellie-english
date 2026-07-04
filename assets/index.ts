// assets/index.ts
// Typed asset registry for images, sounds, and lesson thumbnails.
// Safe for Expo Web & Expo Hosting (no spaces/case issues).

export type LocalAsset = number; // Metro bundler returns numeric IDs
export type RemoteAsset = { uri: string };
export type AssetValue = LocalAsset | RemoteAsset;

// Core sounds
export const bestsuccess: LocalAsset = require('./bestsuccess.mp3');
export const bigsuccess: LocalAsset = require('./bigsuccess.mp3');
export const success: LocalAsset = require('./success.mp3');

// Core images
export const embarrassed: LocalAsset = require('./embarrassed.png');
export const good: LocalAsset = require('./good.png');
export const shootingStar: LocalAsset = require('./shooting-star.png');
export const timerFire: LocalAsset = require('./timerfire.png');
export const comic: LocalAsset = require('./comic.png');

// Lesson thumbnails
export const lessonThumbnails: Record<string, AssetValue> = (() => {
  const raw: Record<string, AssetValue | string> = {
    Activities: require('./thumbnails/activities-thumbnail.png'),
    'American Dishes': require('./thumbnails/american-dishes-thumbnail.png'),
    Animals: require('./thumbnails/animals-thumbnail.png'),
    Body: require('./thumbnails/body-thumbnail.png'),
    Breakfast: require('./thumbnails/breakfast-thumbnail.png'),
    Bullying: require('./thumbnails/bullying-thumbnail.png'),
    Cinema: require('./thumbnails/cinema-thumbnail.png'),
    'City Travel': require('./thumbnails/city-travel-thumbnail.png'),
    'Classroom English': require('./thumbnails/classroom-english-thumbnail.png'),
    Clothes: require('./thumbnails/clothes-thumbnail.png'),
    Colours: require('./thumbnails/colours-thumbnail.png'),
    Cooking: require('./thumbnails/cooking-thumbnail.png'),
    'Daily Questions': require('./thumbnails/daily-questions-thumbnail.png'),
    'Daily Routine': require('./thumbnails/daily-routine-thumbnail.png'),
    Date: require('./thumbnails/date-thumbnail.png'),
    'Describing a picture': require('./thumbnails/describing-thumbnail.png'),
    Detective: require('./thumbnails/detective-stories-thumbnail.png'),
    Dystopia: require('./thumbnails/dystopia-thumbnail.png'),
    Ecology: require('./thumbnails/ecology-thumbnail.png'),
    Emotions: require('./thumbnails/emotions-easy-thumbnail.png'),
    'Emotions Level 2': require('./thumbnails/emotions-level-2-thumbnail.png'),
    'Emotions +': require('./thumbnails/emotions-level-2-thumbnail.png'),
    'Emotions Plus': require('./thumbnails/emotions-level-2-thumbnail.png'),
    'More Emotions': require('./thumbnails/emotions-level-2-thumbnail.png'),
    Family: require('./thumbnails/family-thumbnail.png'),
    'Food Basics': require('./thumbnails/food-basics-thumbnail.png'),
    'Food +': require('./thumbnails/food-basics-thumbnail.png'),
    Tastes: require('./thumbnails/likes-thumbnail.png'),
    'Frequency Adverbs': require('./thumbnails/frequency-thumbnail.png'),
    Furniture: require('./thumbnails/furniture-thumbnail.png'),
    Geography: require('./thumbnails/geography-thumbnail.png'),
    'Getting a job': require('./thumbnails/getting-a-job-thumbnail.png'),
    House: require('./thumbnails/house-thumbnail.png'),
    Instructions: require('./thumbnails/instructions-thumbnail.png'),
    'Job examples': require('./thumbnails/job-examples-thumbnail.png'),
    Legends: require('./thumbnails/legends-thumbnail.png'),
    Likes: require('./thumbnails/likes-thumbnail.png'),
    Location: require('./thumbnails/location-thumbnail.png'),
    Love: require('./thumbnails/love-thumbnail.png'),
    Nationality: require('./thumbnails/nationality-thumbnail.png'),
    'Opinion Basics': require('./thumbnails/opinion-level-1-thumbnail.png'),
    'Opinion +': require('./thumbnails/opinion-level-2-thumbnail.png'),
    'Personality Basics': require('./thumbnails/personality-thumbnail.png'),
    'Personality+': require('./thumbnails/personality-thumbnail.png'),
    'Personality +': require('./thumbnails/personality-plus-thumbnail.png'),
    'Physical Description': require('./thumbnails/physical-description-thumbnail.png'),
    'Question Words': require('./thumbnails/question-words-thumbnail.png'),
    Robots: require('./thumbnails/robot-thumbnail.png'),
    'School Basics': require('./thumbnails/school-basics-thumbnail.png'),
    'School Life': require('./thumbnails/school-life-thumbnail.png'),
    Segregation: require('./thumbnails/segregation-thumbnail.png'),
    Space: require('./thumbnails/space-thumbnail.png'),
    'The Internet': require('./thumbnails/the-internet-thumbnail.png'),
    'The UK': require('./thumbnails/the-uk-and-ireland-thumbnail.png'),
    Time: require('./thumbnails/time-thumbnail.png'),
    'Video Game Actions': require('./thumbnails/video-game-actions-thumbnail.png'),
    'Video Games': require('./thumbnails/videogames-thumbnail.png'),

    Jobs: require('./thumbnails/job-examples-thumbnail.png'),
    Internet: require('./thumbnails/the-internet-thumbnail.png'),
    Opinion: require('./thumbnails/opinion-level-1-thumbnail.png'),
    Fashion: require('./thumbnails/fashion-thumbnail.png'),

    'Types of documents': require('./thumbnails/typesdocs-thumbnail.png'),
    'Types of Documents': require('./thumbnails/typesdocs-thumbnail.png'),
    'Types-of-documents': require('./thumbnails/typesdocs-thumbnail.png'),

    'Video game powers': require('./thumbnails/video-game-actions-thumbnail.png'),

    'Extreme sports': require('./thumbnails/extreme-sports-thumbnail.png'),
    'Extreme Sports': require('./thumbnails/extreme-sports-thumbnail.png'),
    'Extreme-Sports': require('./thumbnails/extreme-sports-thumbnail.png'),

    'The Blitz': require('./thumbnails/blitzthumbnail.png'),
    Christmas: require('./thumbnails/christmas-thumbnail.png'),
    Halloween: require('./thumbnails/halloween-thumbnail.png'),
    'School Subjects': require('./thumbnails/subjects-thumbnail.png'),
    'School Supplies': require('./thumbnails/supplies-thumbnail.png'),
  };

  const mapped: Record<string, AssetValue> = {};
  Object.keys(raw).forEach((k) => {
    const v = raw[k];
    if (typeof v === 'string' && v.startsWith('http')) mapped[k] = { uri: v } as RemoteAsset;
    else mapped[k] = v as LocalAsset;
  });
  return mapped;
})();

// Consolidated default export
const Assets = {
  bestsuccess,
  bigsuccess,
  success,
  embarrassed,
  good,
  shootingStar,
  timerFire,
  comic,
  lessonThumbnails,
};

export default Assets;
