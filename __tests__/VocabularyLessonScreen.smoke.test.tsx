import React from 'react';
import { render } from '@testing-library/react-native';

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
    currentWord: null,
    input: '',
    setInput: jest.fn(),
    isCorrect: null,
    submit: jest.fn(),
    skip: jest.fn(),
    isComplete: false,
    score: 0,
    sessionXp: 0,
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
  it('renders without crashing', async () => {
    const { toJSON } = await render(
      <VocabularyLessonScreen route={mockRoute} navigation={mockNavigation} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
