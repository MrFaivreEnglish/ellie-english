import AsyncStorage from '@react-native-async-storage/async-storage';

// The daily goal is 15 answers (grammar answers and vocabulary words both count). A day that
// hits it is a "goal day"; the weekly goal is a number of goal days, and every goal day after
// the weekly goal is met is a bonus day worth BONUS_DAY_XP.
export const DAILY_GOAL = 15;
export const BONUS_DAY_XP = 20;

export const DAILY_ANSWERS_KEY = '@daily_answers_v1';
export const BONUS_DAYS_AWARDED_KEY = '@bonus_days_awarded_v1';
export const WEEKLY_GOAL_KEY = '@weekly_goal_days';
export const WEEKLY_GOAL_OPTIONS = [2, 3, 4, 5];
export const DEFAULT_WEEKLY_GOAL = 3;
const MAX_TRACKED_DAYS = 60;

export const toDateKey = (date: Date) => {
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

export type DailyAnswerCounts = Record<string, number>;

export const getDailyAnswerCounts = async (): Promise<DailyAnswerCounts> => {
  try {
    const raw = await AsyncStorage.getItem(DAILY_ANSWERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const counts: DailyAnswerCounts = {};
    Object.entries(parsed).forEach(([day, value]) => {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) counts[day] = Math.floor(value);
    });
    return counts;
  } catch {
    return {};
  }
};

// A goal day that is the Nth of its week, with N above the weekly goal, is a bonus day.
const getBonusFlags = (goalDays: boolean[], weeklyGoal: number) => {
  let hits = 0;
  return goalDays.map((hit) => {
    if (!hit) return false;
    hits += 1;
    return hits > weeklyGoal;
  });
};

const awardBonusXpOnce = async (dayKey: string) => {
  try {
    const raw = await AsyncStorage.getItem(BONUS_DAYS_AWARDED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const awarded: string[] = Array.isArray(parsed) ? parsed.filter((d) => typeof d === 'string') : [];
    if (awarded.includes(dayKey)) return;

    // Written first so a second answer can't award the same day twice while this one is pending.
    await AsyncStorage.setItem(BONUS_DAYS_AWARDED_KEY, JSON.stringify([...awarded, dayKey].slice(-MAX_TRACKED_DAYS)));
    // Loaded lazily: xpStorage pulls in the account/cloud layer, which the streak code shouldn't.
    const { addXP } = require('./xpStorage') as typeof import('./xpStorage');
    await addXP(BONUS_DAY_XP);
  } catch {}
};

let writeQueue: Promise<void> = Promise.resolve();

// Called once per answer / learnt word / finished game, from recordPracticeToday. Calls are
// queued: matching fires several in quick succession and each is a read-modify-write.
export const recordDailyAnswer = (now = new Date()): Promise<void> => {
  writeQueue = writeQueue.then(() => writeDailyAnswer(now), () => writeDailyAnswer(now));
  return writeQueue;
};

const writeDailyAnswer = async (now: Date) => {
  try {
    const today = toDateKey(now);
    const counts = await getDailyAnswerCounts();
    const next = (counts[today] ?? 0) + 1;
    const kept = Object.entries({ ...counts, [today]: next })
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-MAX_TRACKED_DAYS);
    await AsyncStorage.setItem(DAILY_ANSWERS_KEY, JSON.stringify(Object.fromEntries(kept)));

    if (next !== DAILY_GOAL) return;
    const [weeklyGoal, updated] = [await getWeeklyGoal(), Object.fromEntries(kept)];
    const { keys } = getCurrentWeekKeys(now);
    const goalDays = keys.map((key) => (updated[key] ?? 0) >= DAILY_GOAL);
    const todayIndex = keys.indexOf(today);
    if (getBonusFlags(goalDays, weeklyGoal)[todayIndex]) await awardBonusXpOnce(today);
  } catch {}
};

export type DayState = 'goal' | 'bonus' | 'today' | 'missed' | 'future' | 'bonusSlot';

export type GoalWeek = {
  states: DayState[];
  // Index (0 = Monday) of today within the week.
  todayIndex: number;
  todayCount: number;
  // 0-100: how far today's ring is filled.
  todayProgress: number;
  goal: number;
  // Goal days this week, bonus days included.
  daysHit: number;
  bonusDays: number;
  goalReached: boolean;
  totalGoalDays: number;
};

export const buildGoalWeek = (counts: DailyAnswerCounts, weeklyGoal: number, now = new Date()): GoalWeek => {
  const { keys, todayIndex } = getCurrentWeekKeys(now);
  const goalDays = keys.map((key) => (counts[key] ?? 0) >= DAILY_GOAL);
  const bonusFlags = getBonusFlags(goalDays, weeklyGoal);
  const daysHit = goalDays.filter(Boolean).length;
  const goalReached = daysHit >= weeklyGoal;
  const todayCount = counts[keys[todayIndex]] ?? 0;

  const states = keys.map((_, index): DayState => {
    if (bonusFlags[index]) return 'bonus';
    if (goalDays[index]) return 'goal';
    if (index === todayIndex) return 'today';
    if (index < todayIndex) return 'missed';
    return goalReached ? 'bonusSlot' : 'future';
  });

  return {
    states,
    todayIndex,
    todayCount,
    todayProgress: Math.min(100, Math.round((todayCount / DAILY_GOAL) * 100)),
    goal: weeklyGoal,
    daysHit,
    bonusDays: bonusFlags.filter(Boolean).length,
    goalReached,
    totalGoalDays: Object.values(counts).filter((count) => count >= DAILY_GOAL).length,
  };
};

export const getGoalWeek = async (): Promise<GoalWeek> => {
  const [counts, weeklyGoal] = await Promise.all([getDailyAnswerCounts(), getWeeklyGoal()]);
  return buildGoalWeek(counts, weeklyGoal);
};
