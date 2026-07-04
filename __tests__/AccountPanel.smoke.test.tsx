import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

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

jest.mock('../features/account/AccountAvatar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, null);
});

jest.mock('../features/account/useAccountStats', () => ({
  useAccountStats: () => ({
    localXP: 0,
    learnedSummary: { totalLearned: 0, lessonCount: 0, learnedToday: 0 },
    grammarSummary: { totalCorrectAnswers: 0, lessonCount: 0, correctToday: 0 },
    streak: { currentStreak: 0, longestStreak: 0, lastPracticeDate: '' },
    timerBestCount: 0,
  }),
}));

import AccountPanel from '../features/account/AccountPanel';

const lightColors = {
  card: '#ffffff',
  surface: '#F8FAFF',
  surfaceAlt: '#EFF3FB',
  text: '#1A1A2E',
  secondaryText: '#5A6070',
  primary: '#1F7AD1',
  primarySoft: '#D6EAFF',
  border: '#E0E5EF',
  borderStrong: '#B8C4D4',
  success: '#25A244',
  successSoft: '#E6F7EC',
  danger: '#F06A7F',
  dangerSoft: '#FFEEF1',
  warning: '#E67E22',
  warningSoft: '#FFF3E0',
  buttonBackground: '#1F7AD1',
  buttonText: '#ffffff',
};

describe('AccountPanel', () => {
  it('renders auth form when not signed in', async () => {
    const { getAllByText } = await render(<AccountPanel colors={lightColors} isDarkMode={false} />);
    expect(getAllByText(/log in|create account|sign in/i).length).toBeGreaterThan(0);
  });

  it('switches to create-account form when Create is pressed', async () => {
    const { getAllByText, getByLabelText } = await render(
      <AccountPanel colors={lightColors} isDarkMode={false} />
    );
    expect(getAllByText(/^log in$/i).length).toBeGreaterThan(0);
    fireEvent(getByLabelText('Create a personal account'), 'press');
    await waitFor(() => {
      expect(getByLabelText('Create a personal account').props.accessibilityState?.selected).toBe(true);
    });
  });
});
