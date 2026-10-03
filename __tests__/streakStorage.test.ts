import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreak, recordPracticeToday } from '../features/progress/streakStorage';

const STREAK_KEY = '@practice_streak_v2';
const store: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];

  jest.mocked(AsyncStorage.getItem).mockImplementation((key: string) =>
    Promise.resolve(store[key] ?? null)
  );
  jest.mocked(AsyncStorage.setItem).mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
});

afterEach(() => {
  jest.useRealTimers();
});

const setDate = (dateStr: string) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(dateStr + 'T12:00:00'));
};

describe('getStreak', () => {
  it('returns zeros when nothing is stored', async () => {
    const streak = await getStreak();
    expect(streak).toEqual({ currentStreak: 0, longestStreak: 0, lastPracticeDate: '' });
  });

  it('returns defaults for malformed storage', async () => {
    store[STREAK_KEY] = 'not json';
    const streak = await getStreak();
    expect(streak).toEqual({ currentStreak: 0, longestStreak: 0, lastPracticeDate: '' });
  });

  it('keeps the streak alive the day after practising', async () => {
    setDate('2025-03-01');
    await recordPracticeToday();
    setDate('2025-03-02');
    await recordPracticeToday();

    setDate('2025-03-03');
    expect((await getStreak()).currentStreak).toBe(2);
  });

  it('shows a broken streak as 0 before the student practises again', async () => {
    for (let day = 1; day <= 5; day++) {
      setDate(`2025-03-0${day}`);
      await recordPracticeToday();
    }

    setDate('2025-03-09');
    const streak = await getStreak();
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(5);
  });
});

describe('recordPracticeToday', () => {
  it('sets streak to 1 on first ever practice', async () => {
    setDate('2025-03-01');
    await recordPracticeToday();
    const streak = await getStreak();
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
    expect(streak.lastPracticeDate).toBe('2025-03-01');
  });

  it('is idempotent — calling twice on the same day does not change the streak', async () => {
    setDate('2025-03-01');
    await recordPracticeToday();
    await recordPracticeToday();
    const streak = await getStreak();
    expect(streak.currentStreak).toBe(1);
  });

  it('extends the streak when practising on consecutive days', async () => {
    setDate('2025-03-01');
    await recordPracticeToday();

    setDate('2025-03-02');
    await recordPracticeToday();

    const streak = await getStreak();
    expect(streak.currentStreak).toBe(2);
    expect(streak.longestStreak).toBe(2);
  });

  it('extends over multiple consecutive days', async () => {
    for (let day = 1; day <= 5; day++) {
      setDate(`2025-03-0${day}`);
      await recordPracticeToday();
    }
    expect((await getStreak()).currentStreak).toBe(5);
  });

  it('resets streak to 1 after missing a day', async () => {
    setDate('2025-03-01');
    await recordPracticeToday();
    setDate('2025-03-02');
    await recordPracticeToday();

    // Skip 2025-03-03
    setDate('2025-03-04');
    await recordPracticeToday();

    const streak = await getStreak();
    expect(streak.currentStreak).toBe(1);
  });

  it('longestStreak is preserved after a reset', async () => {
    setDate('2025-03-01');
    await recordPracticeToday();
    setDate('2025-03-02');
    await recordPracticeToday();
    setDate('2025-03-03');
    await recordPracticeToday();

    // Miss a day, then practice again
    setDate('2025-03-05');
    await recordPracticeToday();

    const streak = await getStreak();
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(3);
  });

  it('longestStreak updates when a new record is set', async () => {
    // Establish a streak of 3
    for (let day = 1; day <= 3; day++) {
      setDate(`2025-03-0${day}`);
      await recordPracticeToday();
    }

    // Break it, then build a streak of 5
    setDate('2025-03-10');
    await recordPracticeToday();
    for (let day = 11; day <= 14; day++) {
      setDate(`2025-03-${day}`);
      await recordPracticeToday();
    }

    const streak = await getStreak();
    expect(streak.currentStreak).toBe(5);
    expect(streak.longestStreak).toBe(5);
  });
});
