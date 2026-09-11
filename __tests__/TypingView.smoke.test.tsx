import { render } from '@testing-library/react-native';

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

jest.mock('../features/shared/soundEffects', () => ({
  BEST_SUCCESS_SOUND: null,
  BIG_SUCCESS_SOUND: null,
  SOUND_EFFECT_OPTIONS: {},
  SUCCESS_SOUND: null,
  replaySoundEffect: jest.fn(),
}));

import TypingView from '../features/vocabulary/TypingView';

const mockWords = [
  { english: 'hello', french: 'bonjour' },
  { english: 'goodbye', french: 'au revoir' },
] as any;

const mockColors = {
  visualStyle: 'normal',
  background: '#F1F5FE',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#E8EEFA',
  exerciseSurface: '#E8EEF8',
  text: '#202838',
  secondaryText: '#616C80',
  border: '#D7DEEB',
  borderStrong: '#B8C4D6',
  shadow: '#D8DFEA',
  progressTrack: '#D7DEEB',
  primary: '#0D7DD4',
  primarySoft: '#DBEAFE',
  success: '#17B8A6',
  successSoft: '#CCFBF1',
  successText: '#0B5B52',
  danger: '#FF7A59',
  dangerSoft: '#FFE4DA',
  dangerText: '#7A2E1C',
  warning: '#FFBF51',
  warningSoft: '#FFF4D8',
  buttonBackground: '#0D7DD4',
  buttonText: '#FFFFFF',
} as any;

describe('TypingView', () => {
  it('renders the current word prompt and answer input', () => {
    const { toJSON, getByText } = render(
      <TypingView words={mockWords} colors={mockColors} isDarkMode={false} />
    );

    expect(toJSON()).toBeTruthy();
    expect(getByText('bonjour')).toBeTruthy();
    expect(getByText('Type the English translation')).toBeTruthy();
  });
});
