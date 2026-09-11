import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../features/grammar/grammarProgressStorage', () => ({
  getGrammarLessonProgressKey: jest.fn(() => 'test-key'),
  recordGrammarCorrectAnswer: jest.fn(() => Promise.resolve('reviewed')),
  getGrammarProgressSummary: jest.fn(() => Promise.resolve({ totalCorrectAnswers: 0, lessonCount: 0, correctToday: 0 })),
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

import GrammarQuiz from '../features/grammar/GrammarQuiz';
import { recordGrammarCorrectAnswer } from '../features/grammar/grammarProgressStorage';
import { addXP } from '../features/progress/xpStorage';

const mockLesson = {
  id: 'test-grammar',
  title: 'Test Grammar Lesson',
  exercises: [
    {
      type: 'choice' as const,
      question: 'Choose the correct article: ___ apple.',
      answer: 'an',
      options: ['a', 'an', 'the', 'none'],
    },
    { type: 'fill' as const, question: 'He ___ tall.', answer: 'is' },
    { type: 'reorder' as const, question: 'Put the words in order.', answer: 'I like cats', words: ['like', 'I', 'cats'] },
    { type: 'translate' as const, question: 'Je suis heureux.', answer: 'I am happy', wordBank: ['I', 'am', 'happy'] },
  ],
  availableModes: {},
};

describe('GrammarQuiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the selected practice mode directly from the lesson', async () => {
    const screen = render(
      <GrammarQuiz lesson={mockLesson} onBack={jest.fn()} backLabel="Back" />
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.toJSON()).toBeTruthy();
    expect(screen.getByLabelText('Open Quiz')).toBeTruthy();
    expect(screen.getByLabelText('Open Fill')).toBeTruthy();
    expect(screen.getByLabelText('Open Reorder')).toBeTruthy();
    expect(screen.getByLabelText('Open Translate')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Open Translate'));

    await waitFor(() => {
      expect(screen.getByLabelText('Close Translate').props.accessibilityState).toEqual({ selected: true });
    });
  });

  it('records a correct answer and exposes its session XP feedback', async () => {
    jest.mocked(recordGrammarCorrectAnswer).mockResolvedValueOnce('saved');
    jest.mocked(addXP).mockResolvedValueOnce(10);
    const screen = render(
      <GrammarQuiz lesson={mockLesson} onBack={jest.fn()} backLabel="Back" />
    );

    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.press(screen.getByLabelText('Open Quiz'));
    fireEvent.press(await screen.findByLabelText('an'));

    expect(recordGrammarCorrectAnswer).toHaveBeenCalledWith(
      'test-key',
      'quiz:Choose the correct article: ___ apple.:an',
    );

    // The success-feedback card holds the answer for ~1.4s (see useGrammarFeedback) before
    // dispatching FINISH_CORRECT_ANSWER, which completes the session — comfortably past
    // waitFor's default timeout. Completing no longer banks the XP: that happens only when
    // the student presses Claim on the end screen, so nothing is persisted here.
    await waitFor(() => {
      expect(addXP).not.toHaveBeenCalled();
      expect(screen.getByText('+7 XP')).toBeTruthy();
      expect(screen.getByText('Well done! 🎉')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('keeps the answer flow usable while reporting an unsaved progress write', async () => {
    jest.mocked(recordGrammarCorrectAnswer).mockResolvedValueOnce('unsaved');
    const screen = render(
      <GrammarQuiz lesson={mockLesson} onBack={jest.fn()} backLabel="Back" />
    );

    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.press(screen.getByLabelText('Open Quiz'));
    fireEvent.press(await screen.findByLabelText('an'));

    await waitFor(() => {
      expect(screen.getByText('Progress not saved')).toBeTruthy();
      expect(screen.getByText('Well done! 🎉')).toBeTruthy();
      expect(addXP).not.toHaveBeenCalled();
    });
  });
});
