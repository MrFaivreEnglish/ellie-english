import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPracticeDays } from './streakStorage';

// A weekly goal ("revise on 3 days this week") instead of a daily streak: revision follows
// the school week, so missing a Tuesday costs nothing, and the total never goes down.
export const WEEKLY_GOAL_KEY = '@weekly_goal_days';
export const WEEKLY_GOAL_OPTIONS = [2, 3, 4, 5];
export const DEFAULT_WEEKLY_GOAL = 3;

export type PracticeWeek = {
  // Monday to Sunday: was there practice that day?
  days: boolean[];
  // Index (0 = Monday) of today within the week.
  todayIndex: number;
  daysPractised: number;
  goal: number;
  goalReached: boolean;
  // Every day ever practised, never reset.
  totalDaysPractised: number;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// The seven date keys of the current week, Monday first.
export const getCurrentWeekKeys = (now = new Date()) => {
  const todayIndex = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayIndex);
  const keys = Array.from({ length: 7 }, (_, offset) =>
    toDateKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + offset))
  );
  return { keys, todayIndex };
};

export const getWeeklyGoal = async (): Promise<number> => {
  try {
    const value = parseInt((await AsyncStorage.getItem(WEEKLY_GOAL_KEY)) ?? '', 10);
    return WEEKLY_GOAL_OPTIONS.includes(value) ? value : DEFAULT_WEEKLY_GOAL;
  } catch {
    return DEFAULT_WEEKLY_GOAL;
  }
};

export const setWeeklyGoal = async (goal: number) => {
  if (!WEEKLY_GOAL_OPTIONS.includes(goal)) return;
  try {
    await AsyncStorage.setItem(WEEKLY_GOAL_KEY, String(goal));
  } catch {}
};

export const getPracticeWeek = async (): Promise<PracticeWeek> => {
  const [practiceDays, goal] = await Promise.all([getPracticeDays(), getWeeklyGoal()]);
  const practised = new Set(practiceDays);
  const { keys, todayIndex } = getCurrentWeekKeys();
  const days = keys.map((key) => practised.has(key));
  const daysPractised = days.filter(Boolean).length;

  return {
    days,
    todayIndex,
    daysPractised,
    goal,
    goalReached: daysPractised >= goal,
    totalDaysPractised: practised.size,
  };
};
