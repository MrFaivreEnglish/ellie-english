import { act, fireEvent, render } from '@testing-library/react-native';

// The set-complete chime is the only sound built with createAudioPlayer; every other player
// on this screen comes from the useAudioPlayer hook. Tagging them apart lets the test count
// that one sound without caring which helper plays it.
const mockSetCompletePlay = jest.fn();
const mockOtherPlay = jest.fn();

jest.mock('expo-audio', () => {
  const makePlayer = (play: () => void) => ({
    play,
    pause: jest.fn(),
    isPlaying: false,
    playing: false,
    currentTime: 0,
    muted: false,
    volume: 1,
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
  });

  return {
    createAudioPlayer: jest.fn(() => makePlayer(mockSetCompletePlay)),
    useAudioPlayer: jest.fn(() => makePlayer(mockOtherPlay)),
    preload: jest.fn(() => Promise.resolve()),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    setIsAudioActiveAsync: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('../features/progress/xpStorage', () => ({
  markPracticeActivityToday: jest.fn(() => Promise.resolve()),
  getXP: jest.fn(() => Promise.resolve(0)),
  addXP: jest.fn(() => Promise.resolve()),
  getDailyXPSnapshot: jest.fn(() => Promise.resolve({ awardedActivityKeys: new Set(), grantedToday: 0 })),
  awardActivityXPOnceToday: jest.fn(() => Promise.resolve(0)),
  previewActivityXPOnceToday: jest.fn(() => Promise.resolve(0)),
  recordPracticeToday: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/progress/lastLessonStorage', () => ({
  saveLastLesson: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/vocabulary/flashcardProgressStorage', () => ({
  getLearnedFlashcardKeys: jest.fn(() => Promise.resolve(new Set<string>())),
  recordLearnedFlashcardToday: jest.fn(() => Promise.resolve()),
  saveLearnedFlashcardKeys: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/shared/apkPreview', () => ({
  getApkPreviewStatusBarInset: jest.fn(() => 0),
  isApkLayoutPreviewEnabled: jest.fn(() => false),
}));

import VocabularyLessonScreen from '../features/vocabulary/VocabularyLessonScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  canGoBack: jest.fn(() => true),
  pop: jest.fn(),
} as any;

const PAIRS = [
  ['one', 'un'],
  ['two', 'deux'],
  ['three', 'trois'],
  ['four', 'quatre'],
  ['five', 'cinq'],
  ['six', 'six-fr'],
  ['seven', 'sept'],
  ['eight', 'huit'],
];

const mockRoute = {
  key: 'VocabularyLesson-test',
  name: 'VocabularyLesson' as const,
  params: {
    lesson: {
      id: 'test-vocab',
      title: 'Test Vocabulary',
      flashcards: PAIRS.map(([english, french]) => ({ english, french })),
    },
  },
} as any;

describe('matching set-complete sound, driven through the whole screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('plays the set-complete sound once per completed set', async () => {
    const screen = render(<VocabularyLessonScreen route={mockRoute} navigation={mockNavigation} />);
    await act(async () => { await Promise.resolve(); });

    fireEvent.press(screen.getByLabelText('Open Match'));
    await act(async () => { await Promise.resolve(); });

    mockSetCompletePlay.mockClear();
    const soundsPerRound: number[] = [];

    // Match whatever pairs are on the board, round after round, until it stops changing.
    for (let round = 0; round < 6; round += 1) {
      const before = mockSetCompletePlay.mock.calls.length;
      let matchedThisRound = 0;

      for (const [english, french] of PAIRS) {
        const card = screen.queryByLabelText(`Card: ${english}`);
        const partner = screen.queryByLabelText(`Card: ${french}`);
        if (!card || !partner) continue;
        act(() => { fireEvent.press(card); });
        act(() => { fireEvent.press(partner); });
        matchedThisRound += 1;
      }

      act(() => { jest.advanceTimersByTime(2000); });
      // The chime restarts from a stop, so its play() lands a microtask after the rewind.
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { await Promise.resolve(); });
      soundsPerRound.push(mockSetCompletePlay.mock.calls.length - before);
      if (matchedThisRound === 0) break;
    }

    // One chime for the first set. The final set is the end of the game, which the
    // completion screen's own sound covers, so it adds none.
    expect(soundsPerRound.filter((n) => n > 0)).toEqual([1]);
    expect(Math.max(...soundsPerRound)).toBe(1);
  });
});
