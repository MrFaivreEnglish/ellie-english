import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSourcePropType } from 'react-native';

export type AccountAvatarId =
  | 'spark'
  | 'check'
  | 'tips'
  | 'retry'
  | 'target'
  | 'timer'
  | 'keyboard'
  | 'rocket'
  | 'book'
  | 'star'
  | 'bolt'
  | 'game'
  | 'globe'
  | 'flame'
  | 'science'
  | 'puzzle'
  | 'leaf'
  | 'medal'
  | 'mind'
  | 'gem'
  | 'artist'
  | 'explorer'
  | 'shield'
  | 'magic'
  | 'night'
  | 'premium'
  | 'crown'
  | 'guardian'
  | 'legend'
  | 'avatar-student'
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
  | 'asset-ellie'
  | 'end-good'
  | 'end-perfect'
  | 'end-try-again'
  | 'end-shooting-star'
  | 'end-timer-fire'
  | 'end-timer-beat'
  | 'thumb-activities'
  | 'thumb-american-dishes'
  | 'thumb-family'
  | 'thumb-daily-routine'
  | 'thumb-body'
  | 'thumb-breakfast'
  | 'thumb-physical'
  | 'thumb-personality'
  | 'thumb-personality-plus'
  | 'thumb-describing'
  | 'thumb-getting-job'
  | 'thumb-job-examples'
  | 'thumb-emotions-plus'
  | 'thumb-bullying'
  | 'thumb-animals'
  | 'thumb-space'
  | 'thumb-robot'
  | 'thumb-videogames'
  | 'thumb-video-game-actions'
  | 'thumb-fashion'
  | 'thumb-cinema'
  | 'thumb-cooking'
  | 'thumb-extreme'
  | 'thumb-ecology'
  | 'thumb-detective'
  | 'thumb-blitz'
  | 'thumb-geography'
  | 'thumb-love'
  | 'thumb-city'
  | 'thumb-legends'
  | 'thumb-emotions'
  | 'thumb-dystopia'
  | 'thumb-school'
  | 'thumb-school-basics'
  | 'thumb-segregation'
  | 'thumb-uk'
  | 'thumb-classroom-english'
  | 'thumb-clothes'
  | 'thumb-colours'
  | 'thumb-daily-questions'
  | 'thumb-date'
  | 'thumb-food-basics'
  | 'thumb-frequency'
  | 'thumb-furniture'
  | 'thumb-house'
  | 'thumb-instructions'
  | 'thumb-likes'
  | 'thumb-location'
  | 'thumb-nationality'
  | 'thumb-opinion-basics'
  | 'thumb-opinion-plus'
  | 'thumb-question-words'
  | 'thumb-the-internet'
  | 'thumb-time'
  | 'thumb-types-docs'
  | 'thumb-christmas'
  | 'thumb-halloween'
  | 'thumb-school-subjects'
  | 'thumb-school-supplies';

export type AccountAvatarColorId =
  | 'ocean'
  | 'forest'
  | 'violet'
  | 'sunset'
  | 'gold'
  | 'rose'
  | 'mint'
  | 'graphite'
  | 'aurora'
  | 'royal'
  | 'platinum'
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

export type IconAccountAvatarPreset = BaseAccountAvatarPreset & {
  type: 'icon';
  icon: string;
};

export type ThumbnailAccountAvatarPreset = BaseAccountAvatarPreset & {
  type: 'thumbnail';
  image: ImageSourcePropType;
  imageFit?: 'cover' | 'contain';
  imageInsetRatio?: number;
};

export type AccountAvatarPreset = IconAccountAvatarPreset | ThumbnailAccountAvatarPreset;

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

export const ACCOUNT_AVATAR_COLOR_PRESETS: AccountAvatarColorPreset[] = [
  { id: 'ocean', label: 'Ocean', backgroundColor: '#EAF5FF', accentColor: '#1671B6' },
  { id: 'forest', label: 'Forest', backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 5 },
  { id: 'violet', label: 'Violet', backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 10 },
  { id: 'sunset', label: 'Sunset', backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 15 },
  { id: 'rose', label: 'Rose', backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 20 },
  { id: 'mint', label: 'Mint', backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 25 },
  { id: 'gold', label: 'Amber', backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 35 },
  { id: 'graphite', label: 'Graphite', backgroundColor: '#EEF3F8', accentColor: '#44505C', unlockLevel: 45 },
  { id: 'aurora', label: 'Aurora', backgroundColor: '#EAFBF5', accentColor: '#178A72', unlockLevel: 55 },
  { id: 'royal', label: 'Royal', backgroundColor: '#EEE9FF', accentColor: '#5B3DBB', unlockLevel: 65 },
  { id: 'platinum', label: 'Platinum', backgroundColor: '#F4F8FA', accentColor: '#6D7D87', unlockLevel: 80 },
  { id: 'cosmic', label: 'Cosmic', backgroundColor: '#E9EDFF', accentColor: '#3349C9', unlockLevel: 92, borderWidth: 3 },
  { id: 'legend-gold', label: 'Legend gold', backgroundColor: '#FFF4BC', accentColor: '#C48B00', unlockLevel: 100, borderWidth: 3 },
];

export const ICON_ACCOUNT_AVATAR_PRESETS: IconAccountAvatarPreset[] = [
  { type: 'icon', id: 'spark', label: 'Spark', icon: 'auto-awesome', backgroundColor: '#EAF5FF', accentColor: '#1671B6' },
  { type: 'icon', id: 'check', label: 'Great job', icon: 'check-circle', backgroundColor: '#E9F8EF', accentColor: '#2C8F54' },
  { type: 'icon', id: 'tips', label: 'Bright idea', icon: 'tips-and-updates', backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 3 },
  { type: 'icon', id: 'retry', label: 'Retry', icon: 'refresh', backgroundColor: '#EEF3F8', accentColor: '#44505C', unlockLevel: 5 },
  { type: 'icon', id: 'rocket', label: 'Rocket', icon: 'rocket-launch', backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 9 },
  { type: 'icon', id: 'target', label: 'Target', icon: 'track-changes', backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 11 },
  { type: 'icon', id: 'book', label: 'Book', icon: 'menu-book', backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 13 },
  { type: 'icon', id: 'timer', label: 'Timer', icon: 'timer', backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 15 },
  { type: 'icon', id: 'star', label: 'Star', icon: 'stars', backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 19 },
  { type: 'icon', id: 'bolt', label: 'Bolt', icon: 'bolt', backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 25 },
  { type: 'icon', id: 'keyboard', label: 'Writer', icon: 'keyboard', backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 28 },
  { type: 'icon', id: 'game', label: 'Game', icon: 'sports-esports', backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 32 },
  { type: 'icon', id: 'globe', label: 'Globe', icon: 'public', backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', unlockLevel: 36 },
  { type: 'icon', id: 'leaf', label: 'Leaf', icon: 'eco', backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 39 },
  { type: 'icon', id: 'flame', label: 'Flame', icon: 'local-fire-department', backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 44 },
  { type: 'icon', id: 'science', label: 'Science', icon: 'science', backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 47 },
  { type: 'icon', id: 'puzzle', label: 'Puzzle', icon: 'extension', backgroundColor: '#F5EEFF', accentColor: '#8B4DD6', unlockLevel: 51 },
  { type: 'icon', id: 'medal', label: 'Medal', icon: 'military-tech', backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 54 },
  { type: 'icon', id: 'artist', label: 'Artist', icon: 'palette', backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 58 },
  { type: 'icon', id: 'mind', label: 'Mind', icon: 'psychology', backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 61 },
  { type: 'icon', id: 'gem', label: 'Gem', icon: 'diamond', backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 66 },
  { type: 'icon', id: 'explorer', label: 'Explorer', icon: 'explore', backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', unlockLevel: 69 },
  { type: 'icon', id: 'shield', label: 'Shield', icon: 'shield', backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 72 },
  { type: 'icon', id: 'magic', label: 'Magic', icon: 'auto-fix-high', backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 75 },
  { type: 'icon', id: 'night', label: 'Night', icon: 'dark-mode', backgroundColor: '#E9EDFF', accentColor: '#3349C9', unlockLevel: 78 },
  { type: 'icon', id: 'premium', label: 'Premium', icon: 'workspace-premium', backgroundColor: '#F4F8FA', accentColor: '#6D7D87', unlockLevel: 81 },
  { type: 'icon', id: 'crown', label: 'Champion', icon: 'emoji-events', backgroundColor: '#FFF4C7', accentColor: '#987000', unlockLevel: 84 },
  { type: 'icon', id: 'guardian', label: 'Guardian', icon: 'local-police', backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 90 },
  { type: 'icon', id: 'legend', label: 'Legend', icon: 'verified', backgroundColor: '#FFF4BC', accentColor: '#C48B00', unlockLevel: 100, borderWidth: 3 },
];

export const FEATURED_ICON_ACCOUNT_AVATAR_PRESETS: IconAccountAvatarPreset[] = [
  ICON_ACCOUNT_AVATAR_PRESETS.find((preset) => preset.id === 'spark')!,
  ICON_ACCOUNT_AVATAR_PRESETS.find((preset) => preset.id === 'check')!,
  ICON_ACCOUNT_AVATAR_PRESETS.find((preset) => preset.id === 'tips')!,
  ICON_ACCOUNT_AVATAR_PRESETS.find((preset) => preset.id === 'star')!,
  ICON_ACCOUNT_AVATAR_PRESETS.find((preset) => preset.id === 'crown')!,
  ICON_ACCOUNT_AVATAR_PRESETS.find((preset) => preset.id === 'legend')!,
];

export const ASSET_ACCOUNT_AVATAR_PRESETS: ThumbnailAccountAvatarPreset[] = [
  { type: 'thumbnail', id: 'avatar-student', label: 'Student', image: require('../../assets/Avatars/student.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', imageFit: 'contain', imageInsetRatio: 0.08 },
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
  { type: 'thumbnail', id: 'thumb-family', label: 'Family', image: require('../../assets/thumbnails/family-thumbnail.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 4 },
  { type: 'thumbnail', id: 'thumb-breakfast', label: 'Breakfast', image: require('../../assets/thumbnails/breakfast-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 7 },
  { type: 'thumbnail', id: 'thumb-daily-routine', label: 'Daily routine', image: require('../../assets/thumbnails/daily-routine-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 8 },
  { type: 'thumbnail', id: 'thumb-clothes', label: 'Clothes', image: require('../../assets/thumbnails/clothes-thumbnail.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 10 },
  { type: 'thumbnail', id: 'thumb-food-basics', label: 'Food basics', image: require('../../assets/thumbnails/food-basics-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 14 },
  { type: 'thumbnail', id: 'thumb-colours', label: 'Colours', image: require('../../assets/thumbnails/colours-thumbnail.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 17 },
  { type: 'thumbnail', id: 'thumb-daily-questions', label: 'Daily questions', image: require('../../assets/thumbnails/daily-questions-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 18 },
  { type: 'thumbnail', id: 'thumb-personality', label: 'Personality', image: require('../../assets/thumbnails/personality-thumbnail.png'), backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 21 },
  { type: 'thumbnail', id: 'thumb-nationality', label: 'Nationality', image: require('../../assets/thumbnails/nationality-thumbnail.png'), backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', unlockLevel: 23 },
  { type: 'thumbnail', id: 'thumb-school-basics', label: 'School basics', image: require('../../assets/thumbnails/school-basics-thumbnail.png'), backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 24 },
  { type: 'thumbnail', id: 'thumb-school', label: 'School life', image: require('../../assets/thumbnails/school-life-thumbnail.png'), backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 27 },
  { type: 'thumbnail', id: 'thumb-instructions', label: 'Instructions', image: require('../../assets/thumbnails/instructions-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 31 },
  { type: 'thumbnail', id: 'thumb-time', label: 'Time', image: require('../../assets/thumbnails/time-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 33 },
  { type: 'thumbnail', id: 'thumb-opinion-basics', label: 'Opinion', image: require('../../assets/thumbnails/opinion-level-1-thumbnail.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 35 },
  { type: 'thumbnail', id: 'thumb-job-examples', label: 'Jobs', image: require('../../assets/thumbnails/job-examples-thumbnail.png'), backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 38 },
  { type: 'thumbnail', id: 'thumb-emotions-plus', label: 'More emotions', image: require('../../assets/thumbnails/emotions-level-2-thumbnail.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 41 },
  { type: 'thumbnail', id: 'thumb-love', label: 'Love', image: require('../../assets/thumbnails/love-thumbnail.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 43 },
  { type: 'thumbnail', id: 'thumb-cooking', label: 'Cooking', image: require('../../assets/thumbnails/cooking-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 46 },
  { type: 'thumbnail', id: 'thumb-cinema', label: 'Cinema', image: require('../../assets/thumbnails/cinema-thumbnail.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 49 },
  { type: 'thumbnail', id: 'thumb-fashion', label: 'Fashion', image: require('../../assets/thumbnails/fashion-thumbnail.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 50 },
  { type: 'thumbnail', id: 'thumb-videogames', label: 'Video games', image: require('../../assets/thumbnails/videogames-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 53 },
  { type: 'thumbnail', id: 'thumb-video-game-actions', label: 'Game actions', image: require('../../assets/thumbnails/video-game-actions-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 56 },
  { type: 'thumbnail', id: 'thumb-american-dishes', label: 'American dishes', image: require('../../assets/thumbnails/american-dishes-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 57 },
  { type: 'thumbnail', id: 'thumb-animals', label: 'Animals', image: require('../../assets/thumbnails/animals-thumbnail.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 60 },
  { type: 'thumbnail', id: 'thumb-geography', label: 'Geography', image: require('../../assets/thumbnails/geography-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 63 },
  { type: 'thumbnail', id: 'thumb-space', label: 'Space', image: require('../../assets/thumbnails/space-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 64 },
  { type: 'thumbnail', id: 'thumb-robot', label: 'Robots', image: require('../../assets/thumbnails/robot-thumbnail.png'), backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 65 },
  { type: 'thumbnail', id: 'thumb-ecology', label: 'Ecology', image: require('../../assets/thumbnails/ecology-thumbnail.png'), backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', unlockLevel: 68 },
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
];

const defaultImageAccountAvatarIds: AccountAvatarId[] = [
  'avatar-open-book',
  'avatar-thumbsup',
  'avatar-heart',
  'thumb-activities',
  'thumb-classroom-english',
];
const defaultImageAccountAvatarIdSet = new Set<AccountAvatarId>(defaultImageAccountAvatarIds);

const fixedImageUnlockLevels: Partial<Record<AccountAvatarId, number>> = {
  'end-good': 82,
  'end-shooting-star': 84,
  'end-timer-beat': 86,
  'end-perfect': 90,
  'avatar-student': 92,
  'avatar-teacher': 96,
  'avatar-medal': 98,
  'asset-ellie': 100,
};

const finalImageAccountAvatarIds: AccountAvatarId[] = [
  'avatar-student',
  'avatar-teacher',
  'avatar-medal',
  'asset-ellie',
];
const fixedImageAccountAvatarIdSet = new Set<AccountAvatarId>(Object.keys(fixedImageUnlockLevels) as AccountAvatarId[]);
const isFinalImageAccountAvatarPreset = (preset: ThumbnailAccountAvatarPreset) =>
  finalImageAccountAvatarIds.includes(preset.id);

const withEvenImageUnlockLevels = (
  presets: ThumbnailAccountAvatarPreset[]
): ThumbnailAccountAvatarPreset[] => {
  const flexiblePresets = presets.filter((preset) => (
    !defaultImageAccountAvatarIdSet.has(preset.id) &&
    !fixedImageAccountAvatarIdSet.has(preset.id)
  ));
  const lastFlexibleIndex = Math.max(1, flexiblePresets.length - 1);
  const flexibleStartLevel = 2;
  const flexibleEndLevel = 80;
  const flexibleLevels = new Map<AccountAvatarId, number>();

  flexiblePresets.forEach((preset, index) => {
    flexibleLevels.set(
      preset.id,
      Math.round(flexibleStartLevel + ((flexibleEndLevel - flexibleStartLevel) * index) / lastFlexibleIndex)
    );
  });

  return presets.map((preset) => {
    const fixedUnlockLevel = fixedImageUnlockLevels[preset.id];
    if (fixedUnlockLevel !== undefined) return { ...preset, unlockLevel: fixedUnlockLevel };
    if (defaultImageAccountAvatarIdSet.has(preset.id)) return { ...preset, unlockLevel: undefined };

    const flexibleUnlockLevel = flexibleLevels.get(preset.id);
    return flexibleUnlockLevel !== undefined
      ? { ...preset, unlockLevel: flexibleUnlockLevel }
      : preset;
  });
};

export const IMAGE_ACCOUNT_AVATAR_PRESETS: ThumbnailAccountAvatarPreset[] = withEvenImageUnlockLevels([
  ...ASSET_ACCOUNT_AVATAR_PRESETS.filter((preset) => !isFinalImageAccountAvatarPreset(preset)),
  ...THUMBNAIL_ACCOUNT_AVATAR_PRESETS.filter((preset) => !isFinalImageAccountAvatarPreset(preset)),
  ...END_CARD_ACCOUNT_AVATAR_PRESETS.filter((preset) => !isFinalImageAccountAvatarPreset(preset)),
  ...ASSET_ACCOUNT_AVATAR_PRESETS.filter((preset) => preset.id === 'avatar-student'),
  ...ASSET_ACCOUNT_AVATAR_PRESETS.filter((preset) => preset.id === 'avatar-teacher'),
  ...ASSET_ACCOUNT_AVATAR_PRESETS.filter((preset) => preset.id === 'avatar-medal'),
  ...END_CARD_ACCOUNT_AVATAR_PRESETS.filter((preset) => preset.id === 'asset-ellie'),
]);

export const PICKER_ACCOUNT_AVATAR_PRESETS: AccountAvatarPreset[] = [
  ...IMAGE_ACCOUNT_AVATAR_PRESETS,
  ...FEATURED_ICON_ACCOUNT_AVATAR_PRESETS,
];

export const ACCOUNT_AVATAR_PRESETS: AccountAvatarPreset[] = [
  ...ICON_ACCOUNT_AVATAR_PRESETS,
  ...IMAGE_ACCOUNT_AVATAR_PRESETS,
];

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
