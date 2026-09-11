import { act, fireEvent, render } from '@testing-library/react-native';
import { createRef } from 'react';
import type { View } from 'react-native';
import { StyleSheet } from 'react-native';

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

import GrammarQuiz from '../features/grammar/GrammarQuiz';
import GrammarFillExercise from '../features/grammar/grammarExercises/GrammarFillExercise';
import { useTheme } from '../features/settings/ThemeContext';

const fillLesson = {
  id: 'test-fill',
  title: 'Fill Lesson',
  exercises: [
    { type: 'fill' as const, question: 'He ___ tall.', answer: 'is' },
    { type: 'fill' as const, question: 'They ___ here.', answer: 'are' },
  ],
  availableModes: {},
};

// Pulls the default theme the same way the real screen does, so the exercise gets a full
// ThemeColors without the test having to hand-build one.
const FillProbe = (props: {
  optionsContainerRef: React.RefObject<View | null>;
  firstOptionRef: React.RefObject<View | null>;
}) => {
  const { colors, isDarkMode } = useTheme();
  return (
    <GrammarFillExercise
      exercise={{ ...fillLesson.exercises[0] }}
      colors={colors}
      isDarkMode={isDarkMode}
      userAnswer=""
      incorrectAnswer=""
      optionsContainerRef={props.optionsContainerRef}
      firstOptionRef={props.firstOptionRef}
      onOptionsLayout={jest.fn()}
      onFirstOptionLayout={jest.fn()}
      onCorrect={jest.fn(async () => {})}
      onIncorrect={jest.fn()}
    />
  );
};

const flatStyle = (node: any) =>
  (StyleSheet.flatten(node?.props?.style) ?? {}) as Record<string, unknown>;

const containsTextInput = (node: any) => {
  try {
    return node.findAll((child: any) => child.type === 'TextInput').length > 0;
  } catch {
    return false;
  }
};

describe('Fill success card sizing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hands the success card the input/Check group, not the padded answer card', () => {
    const optionsContainerRef = createRef<View>();
    const firstOptionRef = createRef<View>();

    const screen = render(
      <FillProbe optionsContainerRef={optionsContainerRef} firstOptionRef={firstOptionRef} />
    );

    // firstOptionRef holds the answer card: it claims a share of the stage height and
    // centres the controls inside it, so most of its box is empty space.
    expect(typeof flatStyle(firstOptionRef.current).minHeight).toBe('number');

    // The success card measures optionsContainerRef, so that has to be the snug group
    // wrapping the input and Check — measuring the card is what made the green
    // "Well done!" card cover that empty space too.
    expect(flatStyle(optionsContainerRef.current).minHeight).toBeUndefined();
    expect(optionsContainerRef.current).not.toBe(firstOptionRef.current);

    // ...and that snug node is the one actually wrapping the two controls: walking up from
    // Check to the nearest ancestor holding the input lands on the same styling.
    let group: any = screen.getByText('Check');
    while (group && !containsTextInput(group)) group = group.parent;
    expect(group).toBeTruthy();
    expect(flatStyle(group)).toEqual(flatStyle(optionsContainerRef.current));
  });

  it('sizes the success card to a fixed height rather than filling to the bottom', async () => {
    const screen = render(<GrammarQuiz lesson={fillLesson} onBack={jest.fn()} backLabel="Back" />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(screen.getByLabelText('Open Fill'));
    const input = await screen.findByDisplayValue('');
    const shown = fillLesson.exercises.find((exercise) => screen.queryByText(exercise.question));
    fireEvent.changeText(input, shown!.answer);
    fireEvent.press(screen.getByText('Check'));

    let node: any = await screen.findByText('Well done! 🎉');
    let style = flatStyle(node);
    while (node && !(style.position === 'absolute' && style.zIndex === 10)) {
      node = node.parent;
      style = flatStyle(node);
    }
    expect(node).toBeTruthy();

    expect(typeof style.height).toBe('number');
    expect(style.bottom).toBeUndefined();
  });
});
