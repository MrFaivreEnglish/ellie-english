import { act, renderHook } from '@testing-library/react-native';

const mockPlay = jest.fn();

jest.mock('expo-audio', () => {
  const makePlayer = () => ({
    play: mockPlay,
    pause: jest.fn(),
    isPlaying: false,
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
  });

  return {
    useAudioPlayer: jest.fn(makePlayer),
    createAudioPlayer: jest.fn(makePlayer),
    preload: jest.fn(() => Promise.resolve()),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    setIsAudioActiveAsync: jest.fn(() => Promise.resolve()),
  };
});

import { useVocabularyGame } from '../features/vocabulary/useVocabularyGame';
import type { GameCard, Word } from '../types/VocabularyTypes';

const WORDS: Word[] = [
  { english: 'cat', french: 'chat' },
  { english: 'dog', french: 'chien' },
];

const PAIRS_PER_SET = 2;

const setUp = (words: Word[] = WORDS) =>
  renderHook(
    ({ list }: { list: Word[] }) =>
      useVocabularyGame(list, false, true, 'test-category', false, false, PAIRS_PER_SET, null),
    { initialProps: { list: words } }
  );

const settle = () => {
  act(() => {
    jest.advanceTimersByTime(1000);
  });
};

// Presses one english card and one french card, then lets the board settle.
const press = (result: any, english: GameCard, french: GameCard) => {
  act(() => {
    result.current.handleCardPress(english);
  });
  act(() => {
    result.current.handleCardPress(french);
  });
  settle();
};

const cardsFor = (result: any) => ({
  english: result.current.matchingGamePairs.english as GameCard[],
  french: result.current.matchingGamePairs.french as GameCard[],
});

const frenchFor = (french: GameCard[], pairId: number) =>
  french.find((card) => card.pairId === pairId)!;

const matchEverything = (result: any) => {
  const { english, french } = cardsFor(result);
  english.forEach((card) => {
    press(result, card, frenchFor(french, card.pairId));
  });
};

describe('matching game', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('perfect-run bonus', () => {
    it('is not awarded once a mistake has been made', async () => {
      const { result } = setUp();
      act(() => {
        result.current.initializeGameSet();
      });

      const { english, french } = cardsFor(result);
      // Deliberately pair the first english card with the wrong french card.
      const wrongFrench = french.find((card) => card.pairId !== english[0].pairId)!;
      press(result, english[0], wrongFrench);

      matchEverything(result);

      await act(async () => {
        await result.current.previewPendingMatchingXp();
      });

      // The running metric already showed every pair at its real price, so there is nothing
      // left over to present as a bonus. This used to report the whole session total as
      // bonus, so the "Perfect bonus" row showed no matter how many mistakes were made.
      expect(result.current.wasMatchingPerfectRun).toBe(false);
      expect(result.current.matchingBonusXp).toBe(0);
    });

    it('is awarded on a clean run', async () => {
      const { result } = setUp();
      act(() => {
        result.current.initializeGameSet();
      });

      matchEverything(result);

      await act(async () => {
        await result.current.previewPendingMatchingXp();
      });

      expect(result.current.wasMatchingPerfectRun).toBe(true);
      expect(result.current.matchingBonusXp).toBeGreaterThan(0);
    });
  });

  describe('set-complete sound', () => {
    it('plays once per completed set even when the hook re-renders', async () => {
      // Three sets' worth of words, so completing the first set is not the whole game.
      const words: Word[] = [
        { english: 'cat', french: 'chat' },
        { english: 'dog', french: 'chien' },
        { english: 'bird', french: 'oiseau' },
        { english: 'fish', french: 'poisson' },
      ];
      const { result, rerender } = setUp(words);
      act(() => {
        result.current.initializeGameSet();
      });

      mockPlay.mockClear();

      const { english, french } = cardsFor(result);
      // Complete the set without letting the advance timer fire, so it sits completed.
      act(() => {
        result.current.handleCardPress(english[0]);
        result.current.handleCardPress(frenchFor(french, english[0].pairId));
      });
      act(() => {
        result.current.handleCardPress(english[1]);
        result.current.handleCardPress(frenchFor(french, english[1].pairId));
      });

      // The sound restarts from a stop, so play() lands a microtask after the awaited
      // rewind rather than synchronously with the match.
      await act(async () => { await Promise.resolve(); });

      const playsAfterCompletion = mockPlay.mock.calls.length;
      expect(playsAfterCompletion).toBeGreaterThan(0);

      // A new words array identity rebuilds advanceToNextSet, re-running the advance effect.
      // Its cleanup used to clear the "already sounded" flag, so this replayed the sound.
      rerender({ list: [...words] });
      rerender({ list: [...words] });
      await act(async () => { await Promise.resolve(); });

      expect(mockPlay.mock.calls.length).toBe(playsAfterCompletion);
    });
  });
});
