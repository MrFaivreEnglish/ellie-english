import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../features/grammar/grammarProgressStorage', () => ({
  getGrammarLessonProgressKey: jest.fn(() => 'test-key'),
  recordGrammarCorrectAnswer: jest.fn(() => Promise.resolve()),
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
  replaySoundEffect: jest.fn(),
}));

jest.mock('../features/shared/useEnglishSpeech', () => ({
  useEnglishSpeech: () => ({ speak: jest.fn(), stop: jest.fn() }),
}));

jest.mock('../features/progress/LevelProgressSummary', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, null);
});

import GrammarQuiz from '../features/grammar/GrammarQuiz';

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
      expect(screen.getByLabelText('Back to lesson')).toBeTruthy();
      expect(screen.getByLabelText('Switch to Translate').props.accessibilityState).toEqual({ selected: true });
    });
  });
});
