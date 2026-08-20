import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../features/vocabulary/useVocabularyGame', () => ({
  useVocabularyGame: () => ({
    gameState: {
      currentSet: 0,
      matchedPairs: [],
      selectedCard: null,
      totalScore: 0,
      timer: 0,
      bestTimeByCategory: {},
      hasCompletedOnce: false,
      consecutiveCorrect: 0,
      incorrectPair: null,
      hasAdvancedSet: false,
      isInputLocked: false,
      lastCompletionWasPersonalBest: false,
    },
    setGameState: jest.fn(),
    matchingGamePairs: { english: [], french: [] },
    initializeGameSet: jest.fn(),
    handleCardPress: jest.fn(),
    advanceToNextSet: jest.fn(),
    resetGameState: jest.fn(),
    startTimer: jest.fn(),
    stopTimer: jest.fn(),
    matchingSessionXp: 0,
    lastMatchingXpGain: 0,
    matchingReviewWords: [],
  }),
}));

jest.mock('../features/vocabulary/useTypingGame', () => ({
  useTypingGame: () => ({
    typedAnswer: '',
    setTypedAnswer: jest.fn(),
    typingIndex: 0,
    typingFeedback: null,
    firstTryCount: 0,
    inlineMessage: '',
    feedback: '',
    feedbackEvent: null,
    handleSubmit: jest.fn(),
    xp: 0,
    sessionXp: 0,
    streak: 0,
    maxStreak: 0,
    level: 1,
    levelUpMessage: '',
    attempts: 0,
    totalAttempts: 0,
    correctAnswers: 0,
    reset: jest.fn(),
    goToNextWord: jest.fn(),
    goToPreviousWord: jest.fn(),
    canGoPrevious: false,
    canGoNext: true,
    isAdvancing: false,
    currentWord: { english: 'hello', french: 'bonjour' },
    totalWords: 2,
    isReviewMode: false,
    isSessionComplete: false,
    strictMode: false,
    difficultyByWord: {},
    reshuffleRemaining: jest.fn(),
    comboBonus: 0,
    requestHint: jest.fn(),
    currentHintCount: 0,
    currentHintText: '',
  }),
}));

jest.mock('../features/progress/xpStorage', () => ({
  markPracticeActivityToday: jest.fn(() => Promise.resolve()),
  getXP: jest.fn(() => Promise.resolve(0)),
}));

jest.mock('../features/progress/lastLessonStorage', () => ({
  saveLastLesson: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/vocabulary/flashcardProgressStorage', () => ({
  getLearnedFlashcardKeys: jest.fn(() => Promise.resolve(new Set<string>())),
  recordLearnedFlashcardToday: jest.fn(() => Promise.resolve()),
  saveLearnedFlashcardKeys: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/shared/soundEffects', () => ({
  BEST_SUCCESS_SOUND: null,
  BIG_SUCCESS_SOUND: null,
  SOUND_EFFECT_OPTIONS: {},
  SUCCESS_SOUND: null,
  replaySoundEffect: jest.fn(),
}));

jest.mock('../features/shared/apkPreview', () => ({
  getApkPreviewStatusBarInset: jest.fn(() => 0),
  isApkLayoutPreviewEnabled: jest.fn(() => false),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  canGoBack: jest.fn(() => true),
  pop: jest.fn(),
} as any;

const mockLesson = {
  id: 'test-vocab',
  title: 'Test Vocabulary',
  flashcards: [
    { english: 'hello', french: 'bonjour' },
    { english: 'goodbye', french: 'au revoir' },
  ],
};

const mockRoute = {
  key: 'VocabularyLesson-test',
  name: 'VocabularyLesson' as const,
  params: { lesson: mockLesson },
} as any;

import VocabularyLessonScreen from '../features/vocabulary/VocabularyLessonScreen';

describe('VocabularyLessonScreen', () => {
  it('keeps every practice mode directly accessible from the lesson', async () => {
    const screen = render(<VocabularyLessonScreen route={mockRoute} navigation={mockNavigation} />);
    await act(async () => {
      await Promise.resolve();
    });
    const { getByLabelText, queryByText, toJSON } = screen;

    expect(toJSON()).toBeTruthy();
    expect(getByLabelText('Open Cards')).toBeTruthy();
    expect(getByLabelText('Open Match')).toBeTruthy();
    expect(getByLabelText('Open Write')).toBeTruthy();
    expect(queryByText(/opens over the lesson/i)).toBeNull();

    fireEvent.press(getByLabelText('Open Write'));

    await waitFor(() => {
      expect(getByLabelText('Back to lesson')).toBeTruthy();
      expect(getByLabelText('Switch to Write').props.accessibilityState).toEqual({ selected: true });
    });
  });
});
