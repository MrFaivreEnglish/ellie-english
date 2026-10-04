import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreak, recordPracticeToday } from '../features/progress/streakStorage';
import { getCurrentWeekKeys, getPracticeWeek, setWeeklyGoal } from '../features/progress/weeklyGoal';
import { BONUS_DAY_XP, DAILY_GOAL, getGoalWeek } from '../features/progress/dailyGoal';
import { getMilestoneProgress, getMilestones } from '../features/progress/milestones';

const mockAddXP = jest.fn(() => Promise.resolve(0));
jest.mock('../features/progress/xpStorage', () => ({
  addXP: (...args: unknown[]) => (mockAddXP as any)(...args),
}));

const store: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  mockAddXP.mockClear();
  jest.mocked(AsyncStorage.getItem).mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
  jest.mocked(AsyncStorage.setItem).mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const setDay = (day: string) => jest.setSystemTime(new Date(`${day}T12:00:00`));
const answer = async (times: number) => {
  for (let i = 0; i < times; i += 1) await recordPracticeToday();
};

describe('weekly goal', () => {
  it('runs Monday to Sunday and finds today inside the week', () => {
    setDay('2026-03-11'); // a Wednesday
    const { keys, todayIndex } = getCurrentWeekKeys();
    expect(keys[0]).toBe('2026-03-09');
    expect(keys[6]).toBe('2026-03-15');
    expect(todayIndex).toBe(2);

    setDay('2026-03-15'); // the Sunday still belongs to that week
    expect(getCurrentWeekKeys().keys[0]).toBe('2026-03-09');
    expect(getCurrentWeekKeys().todayIndex).toBe(6);
  });

  it('counts only days that hit the daily goal, and keeps the all-time total', async () => {
    setDay('2026-03-04');
    await answer(DAILY_GOAL); // last week
    setDay('2026-03-09');
    await answer(DAILY_GOAL);
    setDay('2026-03-10');
    await answer(DAILY_GOAL - 1); // one short: not a goal day
    setDay('2026-03-11');
    await answer(DAILY_GOAL + 3);

    let week = await getPracticeWeek();
    expect(week.days).toEqual([true, false, true, false, false, false, false]);
    expect(week.daysPractised).toBe(2);
    expect(week.goal).toBe(3);
    expect(week.goalReached).toBe(false);
    expect(week.totalDaysPractised).toBe(3);

    setDay('2026-03-13');
    await answer(DAILY_GOAL);
    week = await getPracticeWeek();
    expect(week.goalReached).toBe(true);
  });

  it('fills today\'s ring from the answers so far', async () => {
    setDay('2026-03-11');
    await answer(6);
    const week = await getGoalWeek();
    expect(week.todayCount).toBe(6);
    expect(week.todayProgress).toBe(40);
    expect(week.states[2]).toBe('today');
  });

  it('turns goal days after the weekly goal into bonus days worth XP, once each', async () => {
    setDay('2026-03-09');
    await answer(DAILY_GOAL);
    setDay('2026-03-10');
    await answer(DAILY_GOAL);
    setDay('2026-03-11');
    await answer(DAILY_GOAL);
    expect(mockAddXP).not.toHaveBeenCalled();

    setDay('2026-03-12');
    await answer(DAILY_GOAL + 5); // answers past the goal don't pay again
    expect(mockAddXP).toHaveBeenCalledTimes(1);
    expect(mockAddXP).toHaveBeenCalledWith(BONUS_DAY_XP);

    const week = await getGoalWeek();
    expect(week.states).toEqual(['goal', 'goal', 'goal', 'bonus', 'bonusSlot', 'bonusSlot', 'bonusSlot']);
    expect(week.goalReached).toBe(true);
    expect(week.bonusDays).toBe(1);
  });

  it('lets the student pick a goal from the allowed choices only', async () => {
    await setWeeklyGoal(4);
    expect((await getPracticeWeek()).goal).toBe(4);
    await setWeeklyGoal(7);
    expect((await getPracticeWeek()).goal).toBe(4);
  });

  it('starts a fresh week at zero while the streak is unaffected', async () => {
    setDay('2026-03-09');
    await answer(DAILY_GOAL);
    setDay('2026-03-16'); // next Monday
    const week = await getPracticeWeek();
    expect(week.daysPractised).toBe(0);
    expect(week.totalDaysPractised).toBe(1);
    expect((await getStreak()).longestStreak).toBe(1);
  });
});

describe('milestones', () => {
  it('follows 25, 50, 100, 250 and repeats the steps', () => {
    expect(getMilestones(3000).slice(0, 8)).toEqual([25, 50, 100, 250, 500, 1000, 2500, 5000]);
  });

  it('measures progress toward the next milestone', () => {
    expect(getMilestoneProgress(0)).toMatchObject({ reached: 0, next: 25, fraction: 0 });
    expect(getMilestoneProgress(35)).toMatchObject({ reached: 25, next: 50, fraction: 0.4 });
    expect(getMilestoneProgress(35).track).toEqual([25, 50, 100, 250]);
    expect(getMilestoneProgress(300).track).toEqual([100, 250, 500, 1000]);
    expect(getMilestoneProgress(50)).toMatchObject({ reached: 50, next: 100 });
  });
});
