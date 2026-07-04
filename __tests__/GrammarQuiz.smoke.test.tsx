import React from 'react';
import { render } from '@testing-library/react-native';

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
  ],
  availableModes: {},
};

describe('GrammarQuiz', () => {
  it('renders without crashing', async () => {
    const { toJSON } = await render(
      <GrammarQuiz lesson={mockLesson} onBack={jest.fn()} backLabel="Back" />
    );
    expect(toJSON()).toBeTruthy();
  });
});
