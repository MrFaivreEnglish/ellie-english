import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../features/account/AccountContext', () => ({
  useAccount: () => ({
    isConfigured: true,
    isLoading: false,
    isSyncing: false,
    syncStatus: 'idle',
    session: null,
    error: null,
    lastSyncAt: null,
    signIn: jest.fn(),
    createAccount: jest.fn(),
    syncNow: jest.fn(),
    accountAvatarColorId: null,
    accountAvatarId: null,
    updateAccountDisplayName: jest.fn(),
    updateAccountAvatarColor: jest.fn(),
    updateAccountAvatar: jest.fn(),
    clearError: jest.fn(),
  }),
}));

jest.mock('../features/progress/xpStorage', () => ({
  getXP: jest.fn(() => Promise.resolve(0)),
  addXP: jest.fn(() => Promise.resolve()),
  markPracticeActivityToday: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/progress/streakStorage', () => ({
  getStreak: jest.fn(() => Promise.resolve({ currentStreak: 0, longestStreak: 0, lastPracticeDate: '' })),
}));

jest.mock('../features/vocabulary/flashcardProgressStorage', () => ({
  getLearnedFlashcardSummary: jest.fn(() => Promise.resolve({ totalLearned: 0, lessonCount: 0, learnedToday: 0 })),
}));

jest.mock('../features/grammar/grammarProgressStorage', () => ({
  getGrammarProgressSummary: jest.fn(() => Promise.resolve({ totalCorrectAnswers: 0, lessonCount: 0, correctToday: 0 })),
}));

jest.mock('../features/progress/lastLessonStorage', () => ({
  getLastLesson: jest.fn(() => Promise.resolve(null)),
  saveLastLesson: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/account/AccountAvatar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, null);
});

import HomeScreen from '../features/home/HomeScreen';

describe('HomeScreen', () => {
  it('renders without crashing', async () => {
    const { getAllByText } = await render(<HomeScreen />);
    expect(getAllByText(/grammar|vocabulary|lessons|home/i).length).toBeGreaterThan(0);
  });
});
