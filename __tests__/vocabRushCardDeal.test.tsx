import { act, fireEvent, render } from '@testing-library/react-native';
import { Animated } from 'react-native';

jest.mock('../features/progress/xpStorage', () => ({
  awardActivityXPOnceToday: jest.fn(() => Promise.resolve(0)),
  previewActivityXPOnceToday: jest.fn(() => Promise.resolve(0)),
}));

jest.mock('../features/progress/streakStorage', () => ({
  recordPracticeToday: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/shared/apkPreview', () => ({
  getApkPreviewStatusBarInset: jest.fn(() => 0),
  isApkLayoutPreviewEnabled: jest.fn(() => false),
}));

import VocabRushGame from '../features/vocabulary/vocabRush/VocabRushGame';

const words = Array.from({ length: 12 }, (_, i) => ({
  english: `english-${i}`,
  french: `french-${i}`,
}));

// The opening deal is the slow Duolingo-style cascade; a refill after a match is
// the fast path. Both are driven by Animated.timing, so spying on it is the only
// way to assert the timings a student actually sees.
const renderGame = () => {
  const timingSpy = jest.spyOn(Animated, 'timing');
  const screen = render(
    <VocabRushGame
      words={words as any}
      startingScore={0}
      startingStreak={0}
      onBack={jest.fn()}
      onNavigate={jest.fn()}
      onGoToAccount={jest.fn()}
    />
  );
  return { screen, timingSpy };
};

describe('Vocab Rush opening deal', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cascades the cards in slowly, staggered row by row', () => {
    const { screen, timingSpy } = renderGame();

    // Ignore whatever the board did behind the mode picker; only the deal counts.
    timingSpy.mockClear();
    fireEvent.press(screen.getByText('Normal'));

    const enterAnims = timingSpy.mock.calls
      .map(([, config]) => config as { toValue: number; duration?: number; delay?: number })
      .filter((config) => config.duration === 620);

    // Six rows, two columns: twelve cards drift up over 620ms each.
    expect(enterAnims).toHaveLength(24); // scale + translateY per card

    const delays = [...new Set(enterAnims.map((config) => config.delay))].sort(
      (a, b) => (a ?? 0) - (b ?? 0)
    );
    expect(delays).toEqual([0, 95, 190, 285, 380, 475]);
  });

  it('holds the countdown until the last card has landed', () => {
    jest.useFakeTimers();
    try {
      const { screen } = renderGame();
      fireEvent.press(screen.getByText('Normal'));

      // 12 words at 2s each on Normal. The deal runs 1095ms (475ms of stagger plus
      // a 620ms entrance), so a second of wall clock must not cost a second of game.
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('24s')).toBeTruthy();

      // Let the deal finish, which releases the clock and starts the countdown.
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // From there it ticks normally.
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('24s')).toBeNull();
      expect(screen.getByText('23s')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });
});
