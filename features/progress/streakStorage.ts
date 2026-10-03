import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = '@practice_streak_v2';

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string;
};

const getLocalDateKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getYesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DEFAULT_STREAK: StreakData = { currentStreak: 0, longestStreak: 0, lastPracticeDate: '' };

export const getStreak = async (): Promise<StreakData> => {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) return DEFAULT_STREAK;
    const parsed = JSON.parse(raw);
    const stored: StreakData = {
      currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
      longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
      lastPracticeDate: typeof parsed.lastPracticeDate === 'string' ? parsed.lastPracticeDate : '',
    };
    // The stored count is only rewritten when the student practises, so without this a
    // student who stopped a week ago kept seeing their old streak until they came back.
    const isStreakAlive =
      stored.lastPracticeDate === getLocalDateKey() || stored.lastPracticeDate === getYesterdayKey();
    return isStreakAlive ? stored : { ...stored, currentStreak: 0 };
  } catch {
    return DEFAULT_STREAK;
  }
};

export const recordPracticeToday = async (): Promise<void> => {
  try {
    const today = getLocalDateKey();
    const current = await getStreak();


    if (current.lastPracticeDate === today) return;

    const yesterday = getYesterdayKey();
    const continued = current.lastPracticeDate === yesterday;
    const newStreak = continued ? current.currentStreak + 1 : 1;
    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(current.longestStreak, newStreak),
      lastPracticeDate: today,
    };
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  } catch {}
};
