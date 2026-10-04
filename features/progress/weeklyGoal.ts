import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WEEKLY_GOAL_KEY,
  WEEKLY_GOAL_OPTIONS,
  DEFAULT_WEEKLY_GOAL,
  buildGoalWeek,
  getCurrentWeekKeys,
  getDailyAnswerCounts,
  getWeeklyGoal,
} from './dailyGoal';

// A weekly goal ("hit the daily goal on 3 days this week") instead of a daily streak: revision
// follows the school week, so missing a Tuesday costs nothing, and the total never goes down.
export { WEEKLY_GOAL_KEY, WEEKLY_GOAL_OPTIONS, DEFAULT_WEEKLY_GOAL, getCurrentWeekKeys, getWeeklyGoal };

export type PracticeWeek = {
  // Monday to Sunday: was the daily goal hit that day?
  days: boolean[];
  // Index (0 = Monday) of today within the week.
  todayIndex: number;
  daysPractised: number;
  goal: number;
  goalReached: boolean;
  // Every goal day ever recorded.
  totalDaysPractised: number;
};

export const setWeeklyGoal = async (goal: number) => {
  if (!WEEKLY_GOAL_OPTIONS.includes(goal)) return;
  try {
    await AsyncStorage.setItem(WEEKLY_GOAL_KEY, String(goal));
  } catch {}
};

export const getPracticeWeek = async (): Promise<PracticeWeek> => {
  const [counts, goal] = await Promise.all([getDailyAnswerCounts(), getWeeklyGoal()]);
  const week = buildGoalWeek(counts, goal);

  return {
    days: week.states.map((state) => state === 'goal' || state === 'bonus'),
    todayIndex: week.todayIndex,
    daysPractised: week.daysHit,
    goal,
    goalReached: week.goalReached,
    totalDaysPractised: week.totalGoalDays,
  };
};
