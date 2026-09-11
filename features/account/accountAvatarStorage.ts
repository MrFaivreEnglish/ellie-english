import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSourcePropType } from 'react-native';

export type AccountAvatarId =
  | 'avatar-teacher'
  | 'avatar-thumbsup'
  | 'avatar-heart'
  | 'avatar-excited'
  | 'avatar-open-book'
  | 'avatar-exam'
  | 'avatar-medal'
  | 'avatar-blogger'
  | 'avatar-adventure'
  | 'avatar-musical'
  | 'avatar-player'
  | 'avatar-rocket'
  | 'avatar-scotland'
  | 'avatar-statue-liberty'
  | 'avatar-money'
  | 'avatar-sun'
  | 'avatar-cat'
  | 'avatar-golden-retriever'
  | 'avatar-rabbit'
  | 'avatar-frog'
  | 'avatar-whale'
  | 'avatar-elephant'
  | 'avatar-alien'
  | 'avatar-sci-fi'
  | 'avatar-ninja'
  | 'avatar-knight-girl'
  | 'avatar-queen'
  | 'avatar-witch'
  | 'avatar-dragon'
  | 'avatar-bats'
  | 'avatar-brown-bear'
  | 'avatar-shark'
  | 'avatar-unicorn'
  | 'avatar-phoenix'
  | 'avatar-spirit'
  | 'avatar-melting'
  | 'avatar-magician'
  | 'avatar-celebrity'
  | 'avatar-double-decker-bus'
  | 'avatar-maple-leaf'
  | 'avatar-usa'
  | 'avatar-basketball'
  | 'avatar-skateboard'
  | 'avatar-bike'
  | 'avatar-fishing'
  | 'avatar-wrench'
  | 'avatar-police-car'
  | 'avatar-payphone'
  | 'avatar-elf'
  | 'avatar-fairy'
  | 'avatar-crown'
  | 'avatar-gameboy'
  | 'avatar-watercolor'
  | 'avatar-movie'
  | 'avatar-music-notes'
  | 'avatar-excalibur'
  | 'avatar-ball'
  | 'avatar-apple'
  | 'avatar-snowman'
  | 'avatar-rose'
  | 'avatar-wales'
  | 'avatar-ireland'
  | 'asset-ellie'
  | 'end-good'
  | 'end-perfect'
  | 'end-try-again'
  | 'end-shooting-star'
  | 'end-timer-fire'
  | 'end-timer-beat'
  | 'thumb-activities'
  | 'thumb-american-dishes'
  | 'thumb-breakfast'
  | 'thumb-describing'
  | 'thumb-bullying'
  | 'thumb-animals'
  | 'thumb-robot'
  | 'thumb-videogames'
  | 'thumb-video-game-actions'
  | 'thumb-fashion'
  | 'thumb-cinema'
  | 'thumb-cooking'
  | 'thumb-extreme'
  | 'thumb-detective'
  | 'thumb-blitz'
  | 'thumb-geography'
  | 'thumb-legends'
  | 'thumb-dystopia'
  | 'thumb-school'
  | 'thumb-school-basics'
  | 'thumb-segregation'
  | 'thumb-classroom-english'
  | 'thumb-sports'
  | 'thumb-christmas'
  | 'thumb-halloween'
  | 'thumb-school-subjects'
  | 'thumb-school-supplies';

export type AccountAvatarColorId =
  | 'ocean'
  | 'forest'
  | 'lime'
  | 'mint'
  | 'sunset'
  | 'rose'
  | 'berry'
  | 'violet'
  | 'sand'
  | 'graphite'
  | 'cosmic'
  | 'legend-gold';

type BaseAccountAvatarPreset = {
  id: AccountAvatarId;
  label: string;
  backgroundColor: string;
  accentColor: string;
  unlockLevel?: number;
  borderWidth?: number;
};

export type ThumbnailAccountAvatarPreset = BaseAccountAvatarPreset & {
  type: 'thumbnail';
  image: ImageSourcePropType;
  imageFit?: 'cover' | 'contain';
  imageInsetRatio?: number;
};

export type AccountAvatarPreset = ThumbnailAccountAvatarPreset;

const ACCOUNT_AVATAR_KEY_PREFIX = '@ellie_account_avatar';
const ACCOUNT_AVATAR_COLOR_KEY_PREFIX = '@ellie_account_avatar_color';

export const DEFAULT_ACCOUNT_AVATAR_ID: AccountAvatarId = 'avatar-thumbsup';
export const DEFAULT_ACCOUNT_AVATAR_COLOR_ID: AccountAvatarColorId = 'ocean';

export type AccountAvatarColorPreset = {
  id: AccountAvatarColorId;
  label: string;
  backgroundColor: string;
  accentColor: string;
  unlockLevel?: number;
  borderWidth?: number;
};

// Ten borders, one per hue family, so no two ever read as "the same colour again" — an
// earlier pass at 28 produced near-duplicates nobody could tell apart. Pictures carry the
// bulk of the ladder instead. Unlock levels aren't written here: buildRewardSchedule deals
// them out so exactly one reward lands on each level. Order is the order they're handed
// out in, so the showiest belong at the end.
//
//   ocean blue (free) · forest green · lime yellow-green · mint teal · sunset orange
//   rose red · berry magenta · violet purple · sand tan · graphite grey · cosmic indigo
//   legend gold (prestige, pinned high — see PRESTIGE_BORDER_LEVEL)
const BASE_ACCOUNT_AVATAR_COLOR_PRESETS: AccountAvatarColorPreset[] = [
  { id: 'ocean', label: 'Ocean', backgroundColor: '#EAF5FF', accentColor: '#1671B6' },
  { id: 'forest', label: 'Forest', backgroundColor: '#E9F8EF', accentColor: '#2C8F54' },
  { id: 'lime', label: 'Lime', backgroundColor: '#F0F9E3', accentColor: '#5B8F1F' },
  { id: 'mint', label: 'Mint', backgroundColor: '#EAF4F2', accentColor: '#327E76' },
  { id: 'sunset', label: 'Sunset', backgroundColor: '#FFF0E2', accentColor: '#D4681D' },
  { id: 'rose', label: 'Rose', backgroundColor: '#FFECEF', accentColor: '#D63B55' },
  { id: 'berry', label: 'Berry', backgroundColor: '#FCEAF2', accentColor: '#B3336B' },
  { id: 'violet', label: 'Violet', backgroundColor: '#F1EDFF', accentColor: '#7654D4' },
  { id: 'sand', label: 'Sand', backgroundColor: '#FBF3E4', accentColor: '#9A7B3F' },
  { id: 'graphite', label: 'Graphite', backgroundColor: '#EEF3F8', accentColor: '#44505C' },
  { id: 'cosmic', label: 'Cosmic', backgroundColor: '#E9EDFF', accentColor: '#3349C9', borderWidth: 3 },
  { id: 'legend-gold', label: 'Legend gold', backgroundColor: '#FFF4BC', accentColor: '#C48B00', borderWidth: 3 },
];

const PRESTIGE_BORDER_ID: AccountAvatarColorId = 'legend-gold';

export const ASSET_ACCOUNT_AVATAR_PRESETS: ThumbnailAccountAvatarPreset[] = [
  { type: 'thumbnail', id: 'avatar-open-book', label: 'Open book', image: require('../../assets/Avatars/open-book.png'), backgroundColor: '#ECF8F3', accentColor: '#258B62', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-thumbsup', label: 'Thumbs up', image: require('../../assets/Avatars/thumbsup.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-heart', label: 'Heart', image: require('../../assets/Avatars/heart.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-excited', label: 'Excited', image: require('../../assets/Avatars/excited.png'), backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 2, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-cat', label: 'Cat', image: require('../../assets/Avatars/cat.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 6, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-sun', label: 'Sun', image: require('../../assets/Avatars/sun.png'), backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 12, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-rabbit', label: 'Rabbit', image: require('../../assets/Avatars/rabbit.png'), backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 16, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-frog', label: 'Frog', image: require('../../assets/Avatars/frog.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 20, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-golden-retriever', label: 'Retriever', image: require('../../assets/Avatars/golden-retriever.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 22, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-elephant', label: 'Elephant', image: require('../../assets/Avatars/elephant.png'), backgroundColor: '#F4F8FA', accentColor: '#6D7D87', unlockLevel: 26, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-whale', label: 'Whale', image: require('../../assets/Avatars/whale.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 29, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-scotland', label: 'Scotland', image: require('../../assets/Avatars/scotland.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 34, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-statue-liberty', label: 'Liberty', image: require('../../assets/Avatars/statue-of-liberty.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 37, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-blogger', label: 'Blogger', image: require('../../assets/Avatars/blogger.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 40, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-musical', label: 'Musical', image: require('../../assets/Avatars/musical.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 42, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-money', label: 'Money', image: require('../../assets/Avatars/money.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 45, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-player', label: 'Player', image: require('../../assets/Avatars/player.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 48, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-adventure', label: 'Adventure', image: require('../../assets/Avatars/adventure.png'), backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', unlockLevel: 52, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-rocket', label: 'Rocket', image: require('../../assets/Avatars/rocket.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 55, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-alien', label: 'Alien', image: require('../../assets/Avatars/alien.png'), backgroundColor: '#E9EDFF', accentColor: '#3349C9', unlockLevel: 59, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-sci-fi', label: 'Sci-fi', image: require('../../assets/Avatars/sci-fi.png'), backgroundColor: '#E9EDFF', accentColor: '#3349C9', unlockLevel: 62, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-ninja', label: 'Ninja', image: require('../../assets/Avatars/ninja.png'), backgroundColor: '#EEF3F8', accentColor: '#44505C', unlockLevel: 67, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-knight-girl', label: 'Knight girl', image: require('../../assets/Avatars/knightgirl.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 73, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-witch', label: 'Witch', image: require('../../assets/Avatars/witch.png'), backgroundColor: '#F5EEFF', accentColor: '#8B4DD6', unlockLevel: 76, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-queen', label: 'Queen', image: require('../../assets/Avatars/queen.png'), backgroundColor: '#FFF4BC', accentColor: '#C48B00', unlockLevel: 79, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-dragon', label: 'Dragon', image: require('../../assets/Avatars/dragon.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 85, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-exam', label: 'Exam', image: require('../../assets/Avatars/exam.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 87, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-teacher', label: 'Teacher', image: require('../../assets/Avatars/teacher.png'), backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 91, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-medal', label: 'Medal', image: require('../../assets/Avatars/medal.png'), backgroundColor: '#FFF4BC', accentColor: '#C48B00', unlockLevel: 98, imageFit: 'contain', imageInsetRatio: 0.08 },
  // Characters and culture icons, replacing the abstract lesson thumbnails that made poor
  // profile pictures. Ordered everyday -> showy, since that's the order they're handed out
  // in: hobbies and objects early, animals and culture next, then fantasy, then prestige.
  { type: 'thumbnail', id: 'avatar-basketball', label: 'Basketball', image: require('../../assets/Avatars/basketball.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-ball', label: 'Football', image: require('../../assets/Avatars/ball.png'), backgroundColor: '#F8EFE6', accentColor: '#8F5D2C', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-apple', label: 'Apple', image: require('../../assets/Avatars/apple.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-skateboard', label: 'Skateboard', image: require('../../assets/Avatars/skateboard.png'), backgroundColor: '#EEF3F8', accentColor: '#44505C', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-bike', label: 'Bike', image: require('../../assets/Avatars/bike.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-fishing', label: 'Fishing', image: require('../../assets/Avatars/fishing.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-wrench', label: 'Wrench', image: require('../../assets/Avatars/wrench.png'), backgroundColor: '#F4F8FA', accentColor: '#6D7D87', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-gameboy', label: 'Handheld', image: require('../../assets/Avatars/gameboy.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-watercolor', label: 'Painting', image: require('../../assets/Avatars/watercolor.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-movie', label: 'Movie', image: require('../../assets/Avatars/movie.png'), backgroundColor: '#EEF3F8', accentColor: '#44505C', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-music-notes', label: 'Music notes', image: require('../../assets/Avatars/music-notes.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-brown-bear', label: 'Brown bear', image: require('../../assets/Avatars/brown-bear.png'), backgroundColor: '#F8EFE6', accentColor: '#8F5D2C', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-shark', label: 'Shark', image: require('../../assets/Avatars/shark.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-bats', label: 'Bats', image: require('../../assets/Avatars/bats.png'), backgroundColor: '#EEF3F8', accentColor: '#44505C', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-snowman', label: 'Snowman', image: require('../../assets/Avatars/snowman.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-police-car', label: 'Police car', image: require('../../assets/Avatars/police-car.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-payphone', label: 'Red phone box', image: require('../../assets/Avatars/payphone.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-double-decker-bus', label: 'London bus', image: require('../../assets/Avatars/double-decker-bus.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', imageFit: 'contain', imageInsetRatio: 0.08 },
  // The four UK nations, sitting together: Scotland is already earlier in this list.
  { type: 'thumbnail', id: 'avatar-rose', label: 'England', image: require('../../assets/Avatars/rose.png'), backgroundColor: '#FCEAF2', accentColor: '#B3336B', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-wales', label: 'Wales', image: require('../../assets/Avatars/wales.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-ireland', label: 'Ireland', image: require('../../assets/Avatars/ireland.png'), backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-usa', label: 'USA', image: require('../../assets/Avatars/usa.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-maple-leaf', label: 'Canada', image: require('../../assets/Avatars/maple-leaf.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-celebrity', label: 'Celebrity', image: require('../../assets/Avatars/celebrity.png'), backgroundColor: '#FCEAF2', accentColor: '#B3336B', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-magician', label: 'Magician', image: require('../../assets/Avatars/magician.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-melting', label: 'Melting', image: require('../../assets/Avatars/melting.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-spirit', label: 'Spirit', image: require('../../assets/Avatars/spirit.png'), backgroundColor: '#EAF4F2', accentColor: '#327E76', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-elf', label: 'Elf', image: require('../../assets/Avatars/elf.png'), backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-fairy', label: 'Fairy', image: require('../../assets/Avatars/fairy.png'), backgroundColor: '#F5EEFF', accentColor: '#8B4DD6', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-unicorn', label: 'Unicorn', image: require('../../assets/Avatars/unicorn.png'), backgroundColor: '#F5EEFF', accentColor: '#8B4DD6', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-excalibur', label: 'Excalibur', image: require('../../assets/Avatars/excalibur.png'), backgroundColor: '#E9EDFF', accentColor: '#3349C9', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-phoenix', label: 'Phoenix', image: require('../../assets/Avatars/phoenix.png'), backgroundColor: '#FFF4BC', accentColor: '#C48B00', imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'avatar-crown', label: 'Crown', image: require('../../assets/Avatars/crown.png'), backgroundColor: '#FFF4BC', accentColor: '#C48B00', imageFit: 'contain', imageInsetRatio: 0.08 },
];

export const END_CARD_ACCOUNT_AVATAR_PRESETS: ThumbnailAccountAvatarPreset[] = [
  { type: 'thumbnail', id: 'end-try-again', label: 'Try again', image: require('../../assets/embarrassed.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 30, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'end-good', label: 'Great job', image: require('../../assets/good.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 77, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'end-shooting-star', label: 'Shooting star', image: require('../../assets/shooting-star.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 80, imageFit: 'contain', imageInsetRatio: 0.12 },
  { type: 'thumbnail', id: 'end-timer-beat', label: 'Time beat', image: require('../../assets/timerbeat.png'), backgroundColor: '#FFF4BC', accentColor: '#C48B00', unlockLevel: 82, imageFit: 'contain', imageInsetRatio: 0.1 },
  { type: 'thumbnail', id: 'end-perfect', label: 'Perfect', image: require('../../assets/comic.png'), backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 88, imageFit: 'contain', imageInsetRatio: 0.08 },
  { type: 'thumbnail', id: 'asset-ellie', label: 'Ellie', image: require('../../assets/icony.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 99, imageFit: 'contain', imageInsetRatio: 0.08 },
];

export const THUMBNAIL_ACCOUNT_AVATAR_PRESETS: ThumbnailAccountAvatarPreset[] = [
  { type: 'thumbnail', id: 'thumb-activities', label: 'Activities', image: require('../../assets/thumbnails/activities-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7' },
  { type: 'thumbnail', id: 'thumb-classroom-english', label: 'Classroom', image: require('../../assets/thumbnails/classroom-english-thumbnail.png'), backgroundColor: '#ECF8F3', accentColor: '#258B62' },
  { type: 'thumbnail', id: 'thumb-breakfast', label: 'Breakfast', image: require('../../assets/thumbnails/breakfast-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 7 },
  { type: 'thumbnail', id: 'thumb-school-basics', label: 'School basics', image: require('../../assets/thumbnails/school-basics-thumbnail.png'), backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 24 },
  { type: 'thumbnail', id: 'thumb-school', label: 'School life', image: require('../../assets/thumbnails/school-life-thumbnail.png'), backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 27 },
  { type: 'thumbnail', id: 'thumb-sports', label: 'Sports', image: require('../../assets/thumbnails/sports-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7' },
  { type: 'thumbnail', id: 'thumb-cooking', label: 'Cooking', image: require('../../assets/thumbnails/cooking-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 46 },
  { type: 'thumbnail', id: 'thumb-cinema', label: 'Cinema', image: require('../../assets/thumbnails/cinema-thumbnail.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 49 },
  { type: 'thumbnail', id: 'thumb-fashion', label: 'Fashion', image: require('../../assets/thumbnails/fashion-thumbnail.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 50 },
  { type: 'thumbnail', id: 'thumb-videogames', label: 'Video games', image: require('../../assets/thumbnails/videogames-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 53 },
  { type: 'thumbnail', id: 'thumb-video-game-actions', label: 'Game actions', image: require('../../assets/thumbnails/video-game-actions-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 56 },
  { type: 'thumbnail', id: 'thumb-american-dishes', label: 'American dishes', image: require('../../assets/thumbnails/american-dishes-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 57 },
  { type: 'thumbnail', id: 'thumb-animals', label: 'Animals', image: require('../../assets/thumbnails/animals-thumbnail.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 60 },
  { type: 'thumbnail', id: 'thumb-geography', label: 'Geography', image: require('../../assets/thumbnails/geography-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 63 },
  { type: 'thumbnail', id: 'thumb-robot', label: 'Robots', image: require('../../assets/thumbnails/robot-thumbnail.png'), backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 65 },
  { type: 'thumbnail', id: 'thumb-detective', label: 'Detective', image: require('../../assets/thumbnails/detective-stories-thumbnail.png'), backgroundColor: '#F5EEFF', accentColor: '#8B4DD6', unlockLevel: 70 },
  { type: 'thumbnail', id: 'thumb-extreme', label: 'Extreme', image: require('../../assets/thumbnails/extreme-sports-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 71 },
  { type: 'thumbnail', id: 'thumb-legends', label: 'Legends', image: require('../../assets/thumbnails/legends-thumbnail.png'), backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 74 },
  { type: 'thumbnail', id: 'thumb-blitz', label: 'Blitz', image: require('../../assets/thumbnails/blitzthumbnail.png'), backgroundColor: '#F4F8FA', accentColor: '#6D7D87', unlockLevel: 83 },
  { type: 'thumbnail', id: 'thumb-dystopia', label: 'Dystopia', image: require('../../assets/thumbnails/dystopia-thumbnail.png'), backgroundColor: '#E9EDFF', accentColor: '#3349C9', unlockLevel: 86 },
  { type: 'thumbnail', id: 'thumb-segregation', label: 'History', image: require('../../assets/thumbnails/segregation-thumbnail.png'), backgroundColor: '#F4F8FA', accentColor: '#6D7D87', unlockLevel: 89 },
  { type: 'thumbnail', id: 'thumb-christmas', label: 'Christmas', image: require('../../assets/thumbnails/christmas-thumbnail.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54' },
  { type: 'thumbnail', id: 'thumb-halloween', label: 'Halloween', image: require('../../assets/thumbnails/halloween-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D' },
  { type: 'thumbnail', id: 'thumb-school-subjects', label: 'Subjects', image: require('../../assets/thumbnails/subjects-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6' },
  { type: 'thumbnail', id: 'thumb-school-supplies', label: 'Supplies', image: require('../../assets/thumbnails/supplies-thumbnail.png'), backgroundColor: '#ECF8F3', accentColor: '#258B62' },
  // Thumbnails that already shipped as lesson art but were never offered as profile
  // pictures. They carry the levels that 18 near-identical borders used to waste.
];

const defaultImageAccountAvatarIds: AccountAvatarId[] = [
  'avatar-open-book',
  'avatar-thumbsup',
  'avatar-heart',
  'thumb-activities',
  'thumb-classroom-english',
];
const defaultImageAccountAvatarIdSet = new Set<AccountAvatarId>(defaultImageAccountAvatarIds);

const FIRST_REWARD_LEVEL = 2;

// Legend gold is the one border worth waiting for, so it sits out the even spread and lands
// as the last thing before the closing trio.
const PRESTIGE_BORDER_LEVEL = 97;

// The closing trio is pinned to the last three levels before Ellie Master, so the run to 100
// always ends on the same three rather than wherever the schedule happened to land.
const FINAL_IMAGE_UNLOCK_LEVELS = [98, 99, 100];
const finalImageAccountAvatarIds: AccountAvatarId[] = [
  'avatar-teacher',
  'avatar-medal',
  'asset-ellie',
];
const isFinalImageAccountAvatarPreset = (preset: ThumbnailAccountAvatarPreset) =>
  finalImageAccountAvatarIds.includes(preset.id);

/**
 * Deals out levels so that exactly one reward lands on each, colours included.
 *
 * Colours used to carry hardcoded unlock levels that happened to sit on top of avatar
 * levels: 11 levels handed out two rewards while 27 handed out none. Here colours are
 * spread evenly through the run and take their level outright, and avatars fill every
 * level left over, in order.
 */
const buildRewardSchedule = (colorCount: number, avatarCount: number) => {
  const slotCount = colorCount + avatarCount;
  const colorSlots = new Set<number>();

  // Offset by one band so the very first reward is a picture rather than a border — a new
  // avatar reads as the bigger prize, and level 2 is the one a student sees soonest.
  for (let index = 0; index < colorCount; index += 1) {
    colorSlots.add(Math.floor(((index + 1) * slotCount) / (colorCount + 1)));
  }

  // Levels available before the pinned prestige border and closing trio.
  const availableLevels = PRESTIGE_BORDER_LEVEL - FIRST_REWARD_LEVEL;

  // Once there are more rewards than levels below the finale, the surplus carries on past
  // level 100 rather than landing on top of the pinned ones — the master range has nothing
  // in it, so that's where the overflow belongs.
  const reservedLevels = new Set([PRESTIGE_BORDER_LEVEL, ...FINAL_IMAGE_UNLOCK_LEVELS]);
  const packedLevels: number[] = [];
  for (let level = FIRST_REWARD_LEVEL; packedLevels.length < slotCount; level += 1) {
    if (!reservedLevels.has(level)) packedLevels.push(level);
  }

  // With fewer rewards than levels, share the shortfall out evenly instead of packing from
  // level 2 and leaving one dead stretch just before the finale — a gap every few levels is
  // barely noticeable, thirteen in a row is. Once the art catches up this packs densely again.
  const slotToLevel = (slot: number) => (
    slotCount >= availableLevels || slotCount <= 1
      ? packedLevels[slot]
      : FIRST_REWARD_LEVEL + Math.round((slot * (availableLevels - 1)) / (slotCount - 1))
  );

  const colorLevels: number[] = [];
  const avatarLevels: number[] = [];

  for (let slot = 0; slot < slotCount; slot += 1) {
    const level = slotToLevel(slot);
    if (colorSlots.has(slot) && colorLevels.length < colorCount) colorLevels.push(level);
    else avatarLevels.push(level);
  }

  // Rounding can only collide if colours outnumber the slots between them; if it ever does,
  // take levels back off the avatars rather than leaving a colour unreachable forever.
  while (colorLevels.length < colorCount && avatarLevels.length > 0) {
    colorLevels.push(avatarLevels.pop() as number);
  }

  return {
    colorLevels: colorLevels.sort((a, b) => a - b),
    avatarLevels: avatarLevels.sort((a, b) => a - b),
  };
};

// The legendary ones. They live in the asset list next to the everyday avatars, but handing
// them out in list order put them around level 55 and left the last forty levels paying out
// lesson thumbnails — the ladder got less exciting the higher you climbed. Pulling them to
// the end makes the run escalate: objects and animals, then lesson art, then these.
const prestigeImageAccountAvatarIds: AccountAvatarId[] = [
  'avatar-dragon',
  'avatar-magician',
  'avatar-elf',
  'avatar-fairy',
  'avatar-unicorn',
  'avatar-excalibur',
  'avatar-phoenix',
  'avatar-crown',
];

const isReservedImageAccountAvatarPreset = (preset: ThumbnailAccountAvatarPreset) =>
  isFinalImageAccountAvatarPreset(preset) ||
  prestigeImageAccountAvatarIds.includes(preset.id);

const findImageAccountAvatarPreset = (id: AccountAvatarId) => (
  [
    ...ASSET_ACCOUNT_AVATAR_PRESETS,
    ...THUMBNAIL_ACCOUNT_AVATAR_PRESETS,
    ...END_CARD_ACCOUNT_AVATAR_PRESETS,
  ].find((preset) => preset.id === id) as ThumbnailAccountAvatarPreset
);

const orderedImageAccountAvatarPresets: ThumbnailAccountAvatarPreset[] = [
  ...ASSET_ACCOUNT_AVATAR_PRESETS.filter((preset) => !isReservedImageAccountAvatarPreset(preset)),
  ...THUMBNAIL_ACCOUNT_AVATAR_PRESETS.filter((preset) => !isReservedImageAccountAvatarPreset(preset)),
  ...END_CARD_ACCOUNT_AVATAR_PRESETS.filter((preset) => !isReservedImageAccountAvatarPreset(preset)),
  ...prestigeImageAccountAvatarIds.map(findImageAccountAvatarPreset),
  ...finalImageAccountAvatarIds.map(findImageAccountAvatarPreset),
];

// Minus the free starting border and minus legend gold, which is pinned rather than spread.
const unlockableColorCount = BASE_ACCOUNT_AVATAR_COLOR_PRESETS.length - 2;
const scheduledAvatarCount = orderedImageAccountAvatarPresets.filter((preset) => (
  !defaultImageAccountAvatarIdSet.has(preset.id) && !isFinalImageAccountAvatarPreset(preset)
)).length;

const rewardSchedule = buildRewardSchedule(unlockableColorCount, scheduledAvatarCount);

export const ACCOUNT_AVATAR_COLOR_PRESETS: AccountAvatarColorPreset[] = (() => {
  const levels = [...rewardSchedule.colorLevels];
  // The first colour is the one everybody starts with, so it never consumes a level.
  return BASE_ACCOUNT_AVATAR_COLOR_PRESETS.map((preset, index) => {
    if (index === 0) return preset;
    if (preset.id === PRESTIGE_BORDER_ID) return { ...preset, unlockLevel: PRESTIGE_BORDER_LEVEL };
    return { ...preset, unlockLevel: levels.shift() };
  });
})();

export const IMAGE_ACCOUNT_AVATAR_PRESETS: ThumbnailAccountAvatarPreset[] = (() => {
  const levels = [...rewardSchedule.avatarLevels];
  const finalLevels = [...FINAL_IMAGE_UNLOCK_LEVELS];

  return orderedImageAccountAvatarPresets.map((preset) => {
    if (defaultImageAccountAvatarIdSet.has(preset.id)) return { ...preset, unlockLevel: undefined };
    if (isFinalImageAccountAvatarPreset(preset)) return { ...preset, unlockLevel: finalLevels.shift() };
    return { ...preset, unlockLevel: levels.shift() };
  });
})();

export const PICKER_ACCOUNT_AVATAR_PRESETS: AccountAvatarPreset[] = IMAGE_ACCOUNT_AVATAR_PRESETS;

export const ACCOUNT_AVATAR_PRESETS: AccountAvatarPreset[] = IMAGE_ACCOUNT_AVATAR_PRESETS;

const isUnlockedForLevel = (unlockLevel: number | undefined, currentLevel: number) =>
  !unlockLevel || currentLevel >= unlockLevel;

const normalizeLevel = (level: number) => {
  if (!Number.isFinite(level)) return 1;
  return Math.max(1, Math.floor(level));
};

export const getAccountAvatarUnlocksBetweenLevels = (
  previousLevel: number,
  currentLevel: number
) => {
  const fromLevel = normalizeLevel(previousLevel);
  const toLevel = normalizeLevel(currentLevel);

  if (toLevel <= fromLevel) return [];

  return IMAGE_ACCOUNT_AVATAR_PRESETS.filter((preset) => (
    !!preset.unlockLevel && preset.unlockLevel > fromLevel && preset.unlockLevel <= toLevel
  ));
};

export const getAccountAvatarColorUnlocksBetweenLevels = (
  previousLevel: number,
  currentLevel: number
) => {
  const fromLevel = normalizeLevel(previousLevel);
  const toLevel = normalizeLevel(currentLevel);

  if (toLevel <= fromLevel) return [];

  return ACCOUNT_AVATAR_COLOR_PRESETS.filter((preset) => (
    !!preset.unlockLevel && preset.unlockLevel > fromLevel && preset.unlockLevel <= toLevel
  ));
};

export const getUnlockedAccountAvatarId = (
  avatarId: string | null | undefined,
  currentLevel: number
): AccountAvatarId => {
  const preset = ACCOUNT_AVATAR_PRESETS.find((candidate) => candidate.id === avatarId);
  return preset && isUnlockedForLevel(preset.unlockLevel, currentLevel)
    ? preset.id
    : DEFAULT_ACCOUNT_AVATAR_ID;
};

export const getUnlockedAccountAvatarColorId = (
  colorId: string | null | undefined,
  currentLevel: number
): AccountAvatarColorId => {
  const preset = ACCOUNT_AVATAR_COLOR_PRESETS.find((candidate) => candidate.id === colorId);
  return preset && isUnlockedForLevel(preset.unlockLevel, currentLevel)
    ? preset.id
    : DEFAULT_ACCOUNT_AVATAR_COLOR_ID;
};

const accountAvatarStorageKey = (accountId?: string | null) =>
  `${ACCOUNT_AVATAR_KEY_PREFIX}:${accountId?.trim() || 'device'}`;

const accountAvatarColorStorageKey = (accountId?: string | null) =>
  `${ACCOUNT_AVATAR_COLOR_KEY_PREFIX}:${accountId?.trim() || 'device'}`;

export const getAccountAvatarPreset = (avatarId?: string | null) =>
  ACCOUNT_AVATAR_PRESETS.find((preset) => preset.id === avatarId) ??
  ACCOUNT_AVATAR_PRESETS.find((preset) => preset.id === DEFAULT_ACCOUNT_AVATAR_ID) ??
  ACCOUNT_AVATAR_PRESETS[0];

export const getAccountAvatarColorPreset = (colorId?: string | null) =>
  ACCOUNT_AVATAR_COLOR_PRESETS.find((preset) => preset.id === colorId) ??
  ACCOUNT_AVATAR_COLOR_PRESETS.find((preset) => preset.id === DEFAULT_ACCOUNT_AVATAR_COLOR_ID) ??
  ACCOUNT_AVATAR_COLOR_PRESETS[0];

export const isAccountAvatarId = (value: string | null): value is AccountAvatarId =>
  ACCOUNT_AVATAR_PRESETS.some((preset) => preset.id === value);

export const isAccountAvatarColorId = (value: string | null): value is AccountAvatarColorId =>
  ACCOUNT_AVATAR_COLOR_PRESETS.some((preset) => preset.id === value);

export const loadAccountAvatarId = async (accountId?: string | null): Promise<AccountAvatarId> => {
  try {
    const savedAvatarId = await AsyncStorage.getItem(accountAvatarStorageKey(accountId));
    return isAccountAvatarId(savedAvatarId) ? savedAvatarId : DEFAULT_ACCOUNT_AVATAR_ID;
  } catch {
    return DEFAULT_ACCOUNT_AVATAR_ID;
  }
};

export const saveAccountAvatarId = async (
  accountId: string | null | undefined,
  avatarId: AccountAvatarId
) => {
  await AsyncStorage.setItem(accountAvatarStorageKey(accountId), avatarId);
};

export const loadAccountAvatarColorId = async (
  accountId?: string | null
): Promise<AccountAvatarColorId> => {
  try {
    const savedColorId = await AsyncStorage.getItem(accountAvatarColorStorageKey(accountId));
    return isAccountAvatarColorId(savedColorId) ? savedColorId : DEFAULT_ACCOUNT_AVATAR_COLOR_ID;
  } catch {
    return DEFAULT_ACCOUNT_AVATAR_COLOR_ID;
  }
};

export const saveAccountAvatarColorId = async (
  accountId: string | null | undefined,
  colorId: AccountAvatarColorId
) => {
  await AsyncStorage.setItem(accountAvatarColorStorageKey(accountId), colorId);
};
