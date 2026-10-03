import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockUpdateAccountAvatar = jest.fn();
const mockToast = jest.fn();
const mockAccountState: { accountAvatarId: string | null } = { accountAvatarId: null };

jest.mock('sonner-native', () => ({ toast: (...args: unknown[]) => mockToast(...args) }));

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
    accountAvatarId: mockAccountState.accountAvatarId,
    updateAccountDisplayName: jest.fn(),
    updateAccountAvatarColor: jest.fn(),
    updateAccountAvatar: mockUpdateAccountAvatar,
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
import { IMAGE_ACCOUNT_AVATAR_PRESETS } from '../features/account/accountAvatarStorage';
import { getXPLevelStats } from '../features/progress/xpLevels';

// The stats mock has 0 XP, so the panel sees the starting level.
const startingLevel = getXPLevelStats(0).level;
const lockedAvatars = IMAGE_ACCOUNT_AVATAR_PRESETS.filter(
  (preset) => !!preset.unlockLevel && preset.unlockLevel > startingLevel
);
const unlockedAvatars = IMAGE_ACCOUNT_AVATAR_PRESETS.filter(
  (preset) => !preset.unlockLevel || preset.unlockLevel <= startingLevel
);
const LOCKED_AVATAR_LABEL = /avatar unlocks at level/;

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

describe('AccountPanel avatar picker', () => {
  beforeEach(() => {
    mockUpdateAccountAvatar.mockClear();
    mockToast.mockClear();
    mockAccountState.accountAvatarId = null;
  });

  const openPicker = async () => {
    const screen = await render(<AccountPanel colors={lightColors} isDarkMode={false} />);
    fireEvent.press(screen.getByLabelText('Edit local avatar and colour'));
    return screen;
  };

  it('shows only the next few locked avatars until See all is pressed', async () => {
    expect(lockedAvatars.length).toBeGreaterThan(4);
    const { getAllByLabelText, getByText } = await openPicker();

    expect(getAllByLabelText(LOCKED_AVATAR_LABEL)).toHaveLength(4);
    fireEvent.press(getByText(`See all avatars (${lockedAvatars.length - 4} more)`));
    expect(getAllByLabelText(LOCKED_AVATAR_LABEL)).toHaveLength(lockedAvatars.length);
    fireEvent.press(getByText('Show fewer'));
    expect(getAllByLabelText(LOCKED_AVATAR_LABEL)).toHaveLength(4);
  });

  it('explains a locked avatar on tap instead of selecting it', async () => {
    const nextUnlock = [...lockedAvatars].sort((a, b) => (a.unlockLevel ?? 0) - (b.unlockLevel ?? 0))[0];
    const { getByLabelText } = await openPicker();

    fireEvent.press(getByLabelText(`${nextUnlock.label} avatar unlocks at level ${nextUnlock.unlockLevel}`));

    const levelsToGo = (nextUnlock.unlockLevel ?? 0) - startingLevel;
    expect(mockToast).toHaveBeenCalledWith(
      `${nextUnlock.label} unlocks at Level ${nextUnlock.unlockLevel}. ${levelsToGo} more ${levelsToGo === 1 ? 'level' : 'levels'} to go.`,
      expect.objectContaining({
        id: expect.any(String),
        description: `L’avatar « ${nextUnlock.label} » se débloque au niveau ${nextUnlock.unlockLevel}. ${levelsToGo === 1 ? 'Plus qu’un niveau.' : `Plus que ${levelsToGo} niveaux.`}`,
      })
    );
    expect(mockUpdateAccountAvatar).not.toHaveBeenCalled();
  });

  it('does not save again when the current avatar is tapped', async () => {
    const [current, other] = unlockedAvatars;
    mockAccountState.accountAvatarId = current.id;
    const { getByLabelText } = await openPicker();

    fireEvent.press(getByLabelText(`Choose ${current.label} avatar`));
    expect(mockUpdateAccountAvatar).not.toHaveBeenCalled();

    fireEvent.press(getByLabelText(`Choose ${other.label} avatar`));
    expect(mockUpdateAccountAvatar).toHaveBeenCalledWith(other.id);
  });
});
