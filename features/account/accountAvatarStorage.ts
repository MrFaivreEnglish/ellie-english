import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSourcePropType } from 'react-native';

export type AccountAvatarId =
  | 'spark'
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
  | 'thumb-animals'
  | 'thumb-space'
  | 'thumb-robot'
  | 'thumb-videogames'
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
  | 'thumb-segregation'
  | 'thumb-uk';

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
};

export type AccountAvatarPreset = IconAccountAvatarPreset | ThumbnailAccountAvatarPreset;

const ACCOUNT_AVATAR_KEY_PREFIX = '@ellie_account_avatar';
const ACCOUNT_AVATAR_COLOR_KEY_PREFIX = '@ellie_account_avatar_color';

export const DEFAULT_ACCOUNT_AVATAR_ID: AccountAvatarId = 'spark';
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
  { type: 'icon', id: 'rocket', label: 'Rocket', icon: 'rocket-launch', backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 5 },
  { type: 'icon', id: 'book', label: 'Book', icon: 'menu-book', backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 7 },
  { type: 'icon', id: 'star', label: 'Star', icon: 'stars', backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 9 },
  { type: 'icon', id: 'bolt', label: 'Bolt', icon: 'bolt', backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 11 },
  { type: 'icon', id: 'game', label: 'Game', icon: 'sports-esports', backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 13 },
  { type: 'icon', id: 'globe', label: 'Globe', icon: 'public', backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', unlockLevel: 15 },
  { type: 'icon', id: 'leaf', label: 'Leaf', icon: 'eco', backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 18 },
  { type: 'icon', id: 'flame', label: 'Flame', icon: 'local-fire-department', backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 21 },
  { type: 'icon', id: 'science', label: 'Science', icon: 'science', backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 24 },
  { type: 'icon', id: 'puzzle', label: 'Puzzle', icon: 'extension', backgroundColor: '#F5EEFF', accentColor: '#8B4DD6', unlockLevel: 27 },
  { type: 'icon', id: 'medal', label: 'Medal', icon: 'military-tech', backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 30 },
  { type: 'icon', id: 'artist', label: 'Artist', icon: 'palette', backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 34 },
  { type: 'icon', id: 'mind', label: 'Mind', icon: 'psychology', backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 38 },
  { type: 'icon', id: 'gem', label: 'Gem', icon: 'diamond', backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 44 },
  { type: 'icon', id: 'explorer', label: 'Explorer', icon: 'explore', backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', unlockLevel: 50 },
  { type: 'icon', id: 'shield', label: 'Shield', icon: 'shield', backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 56 },
  { type: 'icon', id: 'magic', label: 'Magic', icon: 'auto-fix-high', backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 62 },
  { type: 'icon', id: 'night', label: 'Night', icon: 'dark-mode', backgroundColor: '#E9EDFF', accentColor: '#3349C9', unlockLevel: 70 },
  { type: 'icon', id: 'premium', label: 'Premium', icon: 'workspace-premium', backgroundColor: '#F4F8FA', accentColor: '#6D7D87', unlockLevel: 78 },
  { type: 'icon', id: 'crown', label: 'Champion', icon: 'emoji-events', backgroundColor: '#FFF4C7', accentColor: '#987000', unlockLevel: 86 },
  { type: 'icon', id: 'guardian', label: 'Guardian', icon: 'local-police', backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 93 },
  { type: 'icon', id: 'legend', label: 'Legend', icon: 'verified', backgroundColor: '#FFF4BC', accentColor: '#C48B00', unlockLevel: 100, borderWidth: 3 },
];

export const THUMBNAIL_ACCOUNT_AVATAR_PRESETS: ThumbnailAccountAvatarPreset[] = [
  { type: 'thumbnail', id: 'thumb-animals', label: 'Animals', image: require('../../assets/thumbnails/animals-thumbnail.png'), backgroundColor: '#E9F8EF', accentColor: '#2C8F54', unlockLevel: 5 },
  { type: 'thumbnail', id: 'thumb-space', label: 'Space', image: require('../../assets/thumbnails/space-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 7 },
  { type: 'thumbnail', id: 'thumb-robot', label: 'Robots', image: require('../../assets/thumbnails/robot-thumbnail.png'), backgroundColor: '#EAF4F2', accentColor: '#327E76', unlockLevel: 10 },
  { type: 'thumbnail', id: 'thumb-videogames', label: 'Video games', image: require('../../assets/thumbnails/videogames-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 12 },
  { type: 'thumbnail', id: 'thumb-fashion', label: 'Fashion', image: require('../../assets/thumbnails/fashion-thumbnail.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 14 },
  { type: 'thumbnail', id: 'thumb-cinema', label: 'Cinema', image: require('../../assets/thumbnails/cinema-thumbnail.png'), backgroundColor: '#F1EDFF', accentColor: '#7654D4', unlockLevel: 16 },
  { type: 'thumbnail', id: 'thumb-cooking', label: 'Cooking', image: require('../../assets/thumbnails/cooking-thumbnail.png'), backgroundColor: '#FFF0E2', accentColor: '#D4681D', unlockLevel: 18 },
  { type: 'thumbnail', id: 'thumb-extreme', label: 'Extreme', image: require('../../assets/thumbnails/extreme-sports-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 20 },
  { type: 'thumbnail', id: 'thumb-ecology', label: 'Ecology', image: require('../../assets/thumbnails/ecology-thumbnail.png'), backgroundColor: '#EEF7E7', accentColor: '#4B8F2F', unlockLevel: 24 },
  { type: 'thumbnail', id: 'thumb-detective', label: 'Detective', image: require('../../assets/thumbnails/detective-stories-thumbnail.png'), backgroundColor: '#F5EEFF', accentColor: '#8B4DD6', unlockLevel: 28 },
  { type: 'thumbnail', id: 'thumb-blitz', label: 'Blitz', image: require('../../assets/thumbnails/blitzthumbnail.png'), backgroundColor: '#F4F8FA', accentColor: '#6D7D87', unlockLevel: 32 },
  { type: 'thumbnail', id: 'thumb-geography', label: 'Geography', image: require('../../assets/thumbnails/geography-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 36 },
  { type: 'thumbnail', id: 'thumb-love', label: 'Love', image: require('../../assets/thumbnails/love-thumbnail.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 40 },
  { type: 'thumbnail', id: 'thumb-city', label: 'City', image: require('../../assets/thumbnails/city-travel-thumbnail.png'), backgroundColor: '#EAF7FF', accentColor: '#1687A7', unlockLevel: 44 },
  { type: 'thumbnail', id: 'thumb-legends', label: 'Legends', image: require('../../assets/thumbnails/legends-thumbnail.png'), backgroundColor: '#FFF6DE', accentColor: '#B87500', unlockLevel: 48 },
  { type: 'thumbnail', id: 'thumb-emotions', label: 'Emotions', image: require('../../assets/thumbnails/emotions-easy-thumbnail.png'), backgroundColor: '#FFECEF', accentColor: '#D63B55', unlockLevel: 52 },
  { type: 'thumbnail', id: 'thumb-dystopia', label: 'Dystopia', image: require('../../assets/thumbnails/dystopia-thumbnail.png'), backgroundColor: '#E9EDFF', accentColor: '#3349C9', unlockLevel: 60 },
  { type: 'thumbnail', id: 'thumb-school', label: 'School', image: require('../../assets/thumbnails/school-life-thumbnail.png'), backgroundColor: '#ECF8F3', accentColor: '#258B62', unlockLevel: 68 },
  { type: 'thumbnail', id: 'thumb-segregation', label: 'History', image: require('../../assets/thumbnails/segregation-thumbnail.png'), backgroundColor: '#F4F8FA', accentColor: '#6D7D87', unlockLevel: 82 },
  { type: 'thumbnail', id: 'thumb-uk', label: 'The UK', image: require('../../assets/thumbnails/the-uk-and-ireland-thumbnail.png'), backgroundColor: '#EAF5FF', accentColor: '#1671B6', unlockLevel: 94 },
];

export const ACCOUNT_AVATAR_PRESETS: AccountAvatarPreset[] = [
  ...ICON_ACCOUNT_AVATAR_PRESETS,
  ...THUMBNAIL_ACCOUNT_AVATAR_PRESETS,
];

const isUnlockedForLevel = (unlockLevel: number | undefined, currentLevel: number) =>
  !unlockLevel || currentLevel >= unlockLevel;

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
