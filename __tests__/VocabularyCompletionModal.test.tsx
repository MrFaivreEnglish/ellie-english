import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('../features/progress/xpStorage', () => ({
  getXP: jest.fn(() => Promise.resolve(75)),
}));

jest.mock('../features/shared/soundEffects', () => ({
  SOUND_EFFECT_OPTIONS: {},
  replaySoundEffect: jest.fn(),
}));

// Reduced motion keeps every reveal instant, so the only thing left to wait on
// is the deliberate beat before the Level Up sheet.
jest.mock('../features/shared/useReducedMotion', () => ({
  __esModule: true,
  default: () => true,
}));

const mockUpdateAccountAvatar = jest.fn(() => Promise.resolve());
jest.mock('../features/account/AccountContext', () => ({
  useAccount: () => ({ updateAccountAvatar: mockUpdateAccountAvatar }),
}));

import VocabularyCompletionModal from '../features/vocabulary/VocabularyCompletionModal';

const colors = {
  background: '#fff',
  surface: '#fff',
  surfaceAlt: '#eee',
  card: '#fff',
  border: '#ddd',
  borderStrong: '#ccc',
  text: '#000',
  secondaryText: '#666',
  primary: '#3B82F6',
  primarySoft: '#DBEAFE',
  progressTrack: '#eee',
  buttonBackground: '#3B82F6',
  buttonText: '#fff',
} as any;

const baseProps = {
  visible: true,
  timerMode: false,
  wordsLength: 8,
  isDarkMode: false,
  isFirstCompletion: false,
  isPersonalBest: false,
  startedTimerMode: false,
  colors,
  onReplay: jest.fn(),
};

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('VocabularyCompletionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('holds the XP behind a claim tap instead of filling on open', async () => {
    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        matchingSessionXp={10}
        statsItems={[{ emoji: '🧩', value: '8/8', label: 'Matched' }, { emoji: '✨', value: 10, label: 'XP Earned' }]}
      />
    );
    await flush();

    expect(screen.getByText('Claim 10 XP')).toBeTruthy();
    expect(screen.getByText("You've earned 10 XP")).toBeTruthy();
    expect(screen.getByText('75 / 80 XP')).toBeTruthy();
    expect(screen.queryByText(/XP to level/)).toBeNull();
    expect(screen.queryByText('Ready to claim')).toBeNull();
  });

  it('offers Try Again immediately when the session earned no XP', async () => {
    const onPrimaryAction = jest.fn();
    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        matchingSessionXp={0}
        onPrimaryAction={onPrimaryAction}
        statsItems={[{ emoji: '✨', value: 0, label: 'XP' }]}
      />
    );
    await flush();

    expect(screen.queryByText('Claim 0 XP')).toBeNull();
    fireEvent.press(screen.getByText('Try Again'));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it('shows the level up screen only after the bar has been claimed', async () => {
    // 75 banked XP plus the 10 about to be claimed crosses the level 1 -> 2 boundary at 80.
    jest.useFakeTimers();
    const onPrimaryAction = jest.fn();
    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        matchingSessionXp={10}
        onPrimaryAction={onPrimaryAction}
        statsItems={[{ emoji: '✨', value: 10, label: 'XP Earned' }]}
      />
    );
    await flush();

    // The end card comes first — the level up sheet must not pre-empt it.
    expect(screen.getByText('Great job!')).toBeTruthy();
    expect(screen.queryByText('You reached Level 2')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('Claim 10 XP'));
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('You reached Level 2')).toBeTruthy();
    expect(screen.getByText('5 / 92 XP')).toBeTruthy();
    expect(screen.queryByText('Claim 10 XP')).toBeNull();
    expect(onPrimaryAction).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Continue'));
    expect(screen.getByText('Profile picture unlocked')).toBeTruthy();
    expect(screen.getByText('Excited')).toBeTruthy();
    expect(screen.queryByText('You reached Level 2')).toBeNull();

    fireEvent.press(screen.getByText('Try Again'));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('opens the account avatar picker without replaying the exercise', async () => {
    jest.useFakeTimers();
    const onPrimaryAction = jest.fn();
    const onGoToAccount = jest.fn();
    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        matchingSessionXp={10}
        onPrimaryAction={onPrimaryAction}
        onGoToAccount={onGoToAccount}
        statsItems={[{ emoji: '✨', value: 10, label: 'XP Earned' }]}
      />
    );
    await flush();

    fireEvent.press(screen.getByText('Claim 10 XP'));
    fireEvent.press(screen.getByText('Continue'));
    act(() => {
      fireEvent.press(screen.getByText('Set as picture'));
    });

    expect(screen.queryByText('Profile picture unlocked')).toBeNull();
    expect(onGoToAccount).not.toHaveBeenCalled();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onGoToAccount).toHaveBeenCalledTimes(1);
    expect(mockUpdateAccountAvatar).not.toHaveBeenCalled();
    expect(onPrimaryAction).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('reveals the requested continuation action after a normal XP claim', async () => {
    const { getXP } = require('../features/progress/xpStorage');
    getXP.mockResolvedValueOnce(30);
    const onPrimaryAction = jest.fn();

    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        matchingSessionXp={10}
        primaryActionLabel="Play Again"
        onPrimaryAction={onPrimaryAction}
        statsItems={[{ emoji: '✨', value: 10, label: 'XP Earned' }]}
      />
    );
    await flush();

    await act(async () => {
      fireEvent.press(screen.getByText('Claim 10 XP'));
    });

    expect(onPrimaryAction).not.toHaveBeenCalled();
    expect(screen.getByText('Play Again')).toBeTruthy();
    fireEvent.press(screen.getByText('Play Again'));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it('keeps the time and the time to beat on a timer-mode result', async () => {
    const { getXP } = require('../features/progress/xpStorage');
    getXP.mockResolvedValueOnce(30);

    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        timerMode
        startedTimerMode
        isPersonalBest
        matchingSessionXp={10}
        statsItems={[
          { emoji: '⏱', value: '0:42', label: 'Time' },
          { emoji: '🏆', value: '0:42', label: 'Best' },
          { emoji: '🧩', value: '8/8', label: 'Matched' },
          { emoji: '✨', value: 10, label: 'XP' },
        ]}
        banner={{ kind: 'record', kicker: 'New record', emoji: '⏱️', label: 'New best time!', message: 'You beat your old best of 0:48 by 6.0s.' }}
      />
    );
    await flush();

    expect(screen.getByText('Time')).toBeTruthy();
    expect(screen.getByText('Best')).toBeTruthy();
    expect(screen.getByText('New best time!')).toBeTruthy();
    expect(screen.getByText('You beat your old best of 0:48 by 6.0s.')).toBeTruthy();

    fireEvent.press(screen.getByText('Claim 10 XP'));
    expect(screen.getByText('Beat your time!')).toBeTruthy();
    fireEvent.press(screen.getByText('Beat your time!'));
    expect(baseProps.onReplay).toHaveBeenCalledWith(true);
  });

  it('does not show an unlock card when the caller says there is nothing to celebrate', async () => {
    const { getXP } = require('../features/progress/xpStorage');
    getXP.mockResolvedValueOnce(30);

    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        timerModeUnlocked
        banner={null}
        matchingSessionXp={10}
        statsItems={[{ emoji: '✨', value: 10, label: 'XP' }]}
      />
    );
    await flush();

    expect(screen.queryByText('Timer Mode')).toBeNull();
  });

  it('shows an unlocked mode in its own card below the celebration hero', async () => {
    const { getXP } = require('../features/progress/xpStorage');
    getXP.mockResolvedValueOnce(30);
    const onPrimaryAction = jest.fn();

    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        matchingSessionXp={10}
        primaryActionLabel="Try Game Mode!"
        onPrimaryAction={onPrimaryAction}
        title="Great job!"
        banner={{
          kind: 'unlock',
          emoji: '\u{1F3AE}',
          label: 'Game Mode',
          message: 'Three lives and bonus XP on every answer.',
        }}
        statsItems={[{ emoji: '\u2728', value: 10, label: 'XP' }]}
      />
    );
    await flush();

    expect(screen.getByText('Great job!')).toBeTruthy();
    expect(screen.getByText('Game Mode Unlocked!')).toBeTruthy();
    expect(screen.getByText('Three lives and bonus XP on every answer.')).toBeTruthy();

    fireEvent.press(screen.getByText('Claim 10 XP'));
    expect(screen.getByText('Try Game Mode!')).toBeTruthy();
    fireEvent.press(screen.getByText('Try Game Mode!'));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it('offers Timer Mode after claiming the first matching completion', async () => {
    const { getXP } = require('../features/progress/xpStorage');
    getXP.mockResolvedValueOnce(30);
    const onReplay = jest.fn();
    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        onReplay={onReplay}
        timerModeUnlocked
        matchingSessionXp={10}
        banner={{
          kind: 'unlock',
          emoji: '🏅',
          label: 'Timer Mode',
          message: 'Race the clock for bonus XP.',
        }}
        statsItems={[{ emoji: '✨', value: 10, label: 'XP' }]}
      />
    );
    await flush();

    fireEvent.press(screen.getByText('Claim 10 XP'));
    expect(screen.getByText('Try Timer Mode!')).toBeTruthy();
    fireEvent.press(screen.getByText('Try Timer Mode!'));
    expect(onReplay).toHaveBeenCalledWith(true);
  });

  it('keeps an owned Timer Mode available without replaying its unlock message', async () => {
    const { getXP } = require('../features/progress/xpStorage');
    getXP.mockResolvedValueOnce(30);
    const onReplay = jest.fn();
    const screen = render(
      <VocabularyCompletionModal
        {...baseProps}
        onReplay={onReplay}
        timerModeAvailable
        banner={null}
        matchingSessionXp={10}
        statsItems={[{ emoji: '✨', value: 10, label: 'XP' }]}
      />
    );
    await flush();

    expect(screen.queryByText('Timer Mode')).toBeNull();
    fireEvent.press(screen.getByText('Claim 10 XP'));
    fireEvent.press(screen.getByText('Try Timer Mode!'));
    expect(onReplay).toHaveBeenCalledWith(true);
  });
});
