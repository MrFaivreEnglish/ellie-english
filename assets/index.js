const bestsuccess = require('./bestsuccess.mp3');
const bigsuccess = require('./bigsuccess.mp3');
const success = require('./success.mp3');

const embarrassed = require('./embarrassed.png');
const good = require('./good.png');
const shootingStar = require('./shooting-star.png');
const timerFire = require('./timerfire.png');
const comic = require('./comic.png');

const lessonThumbnails = (() => {
  const raw = {
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
    Ecology: require('./thumbnails/ecology-thumbnail.png'),
    Emotions: require('./thumbnails/emotions-easy-thumbnail.png'),
    'Emotions Level 2': require('./thumbnails/emotions-level-2-thumbnail.png'),
    'Emotions +': require('./thumbnails/emotions-level-2-thumbnail.png'),
    Family: require('./thumbnails/family-thumbnail.png'),
    'Food Basics': require('./thumbnails/food-basics-thumbnail.png'),
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
  };

  const mapped = {};
  Object.keys(raw).forEach((key) => {
    const value = raw[key];
    mapped[key] = typeof value === 'string' && value.startsWith('http')
      ? { uri: value }
      : value;
  });
  return mapped;
})();

module.exports = {
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
