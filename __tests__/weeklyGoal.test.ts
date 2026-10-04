import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreak, recordPracticeToday } from '../features/progress/streakStorage';
import { getCurrentWeekKeys, getPracticeWeek, setWeeklyGoal } from '../features/progress/weeklyGoal';

const store: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
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

  it('counts practice days this week against the goal, and keeps the all-time total', async () => {
    setDay('2026-03-04');
    await recordPracticeToday(); // last week
    setDay('2026-03-09');
    await recordPracticeToday();
    setDay('2026-03-11');
    await recordPracticeToday();
    await recordPracticeToday(); // same day twice counts once

    let week = await getPracticeWeek();
    expect(week.days).toEqual([true, false, true, false, false, false, false]);
    expect(week.daysPractised).toBe(2);
    expect(week.goal).toBe(3);
    expect(week.goalReached).toBe(false);
    expect(week.totalDaysPractised).toBe(3);

    setDay('2026-03-13');
    await recordPracticeToday();
    week = await getPracticeWeek();
    expect(week.goalReached).toBe(true);
  });

  it('lets the student pick a goal from the allowed choices only', async () => {
    await setWeeklyGoal(4);
    expect((await getPracticeWeek()).goal).toBe(4);
    await setWeeklyGoal(7);
    expect((await getPracticeWeek()).goal).toBe(4);
  });

  it('starts a fresh week at zero while the streak is unaffected', async () => {
    setDay('2026-03-09');
    await recordPracticeToday();
    setDay('2026-03-16'); // next Monday
    const week = await getPracticeWeek();
    expect(week.daysPractised).toBe(0);
    expect(week.totalDaysPractised).toBe(1);
    expect((await getStreak()).longestStreak).toBe(1);
  });
});
