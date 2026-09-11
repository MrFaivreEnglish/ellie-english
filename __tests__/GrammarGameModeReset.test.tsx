import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../features/grammar/grammarProgressStorage', () => ({
  getGrammarLessonProgressKey: jest.fn(() => 'test-key'),
  recordGrammarCorrectAnswer: jest.fn(() => Promise.resolve('reviewed')),
  getGrammarProgressSummary: jest.fn(() =>
    Promise.resolve({ totalCorrectAnswers: 0, lessonCount: 0, correctToday: 0 })
  ),
}));

jest.mock('../features/progress/xpStorage', () => ({
  addXP: jest.fn(() => Promise.resolve()),
  getXP: jest.fn(() => Promise.resolve(0)),
  markPracticeActivityToday: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/progress/lastLessonStorage', () => ({
  saveLastLesson: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/shared/soundEffects', () => ({
  BEST_SUCCESS_SOUND: null,
  BIG_SUCCESS_SOUND: null,
  SOUND_EFFECT_OPTIONS: {},
  SUCCESS_SOUND: null,
  preloadSoundEffects: jest.fn(),
  warmUpSoundEffect: jest.fn(),
  replayPooledSoundEffect: jest.fn(),
  replaySoundEffect: jest.fn(),
}));

jest.mock('../features/shared/useEnglishSpeech', () => ({
  useEnglishSpeech: () => ({ speak: jest.fn(), stop: jest.fn() }),
}));

// Stands in for the Settings toggle: the quiz reads Game Mode through useTheme, so flipping
// this between renders is exactly what a student switching the setting mid-lesson does.
let mockGrammarGameMode = false;

jest.mock('../features/settings/ThemeContext', () => {
  const React = require('react');
  const actual = jest.requireActual('../features/settings/ThemeContext');

  return {
    ...actual,
    useTheme: () => ({
      ...React.useContext(actual.ThemeContext),
      isGrammarGameMode: mockGrammarGameMode,
    }),
  };
});

import GrammarQuiz from '../features/grammar/GrammarQuiz';

const mockLesson = {
  id: 'test-grammar',
  title: 'Test Grammar Lesson',
  exercises: [
    { type: 'choice' as const, question: 'Choose: ___ apple.', answer: 'an', options: ['a', 'an', 'the', 'none'] },
    { type: 'choice' as const, question: 'Choose: ___ dog.', answer: 'a', options: ['a', 'an', 'the', 'none'] },
    { type: 'choice' as const, question: 'Choose: ___ sun.', answer: 'the', options: ['a', 'an', 'the', 'none'] },
  ],
  availableModes: {},
};

describe('GrammarQuiz Game Mode toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGrammarGameMode = false;
  });

  it('restarts the run when Game Mode is switched on mid-lesson', async () => {
    const screen = render(<GrammarQuiz lesson={mockLesson} onBack={jest.fn()} backLabel="Back" />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(screen.getByLabelText('Open Quiz'));

    const firstQuestion = screen.getByText(/^Choose: ___/).props.children;
    expect(screen.getByText('Correct 0/3')).toBeTruthy();

    // Answer one correctly so the session carries real progress into the toggle.
    const answer = mockLesson.exercises.find((ex) => ex.question === firstQuestion)!.answer;
    fireEvent.press(await screen.findByLabelText(answer));

    await waitFor(() => {
      expect(screen.getByText('Correct 1/3')).toBeTruthy();
    }, { timeout: 3000 });

    // The student leaves for Settings, turns Game Mode on, and comes back.
    mockGrammarGameMode = true;
    await act(async () => {
      screen.rerender(<GrammarQuiz lesson={mockLesson} onBack={jest.fn()} backLabel="Back" />);
      await Promise.resolve();
    });

    // A fresh run: the answered question no longer counts, so the already-revealed answers
    // cannot be walked straight into a flawless Game Mode clear.
    await waitFor(() => {
      expect(screen.getByText('Correct 0/3')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('restarts the run when Game Mode is switched back off mid-lesson', async () => {
    mockGrammarGameMode = true;
    const screen = render(<GrammarQuiz lesson={mockLesson} onBack={jest.fn()} backLabel="Back" />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(screen.getByLabelText('Open Quiz'));

    const firstQuestion = screen.getByText(/^Choose: ___/).props.children;
    const answer = mockLesson.exercises.find((ex) => ex.question === firstQuestion)!.answer;
    fireEvent.press(await screen.findByLabelText(answer));

    await waitFor(() => {
      expect(screen.getByText('Correct 1/3')).toBeTruthy();
    }, { timeout: 3000 });

    mockGrammarGameMode = false;
    await act(async () => {
      screen.rerender(<GrammarQuiz lesson={mockLesson} onBack={jest.fn()} backLabel="Back" />);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText('Correct 0/3')).toBeTruthy();
    }, { timeout: 3000 });
  });
});
