import {
  GRAMMAR_GAME_LIVES,
  createGrammarSessionState,
  grammarSessionReducer,
} from '../features/grammar/grammarSessionReducer';
import type { Exercise } from '../features/grammar/grammarExercises/GrammarExerciseUtils';

const questions: Exercise[] = [
  { question: 'One?', answer: 'one', options: ['one', 'two'] },
  { question: 'Two?', answer: 'two', options: ['one', 'two'] },
];

describe('grammarSessionReducer', () => {
  it('resets every session field through one transition while preserving total XP', () => {
    const dirtyState = {
      ...createGrammarSessionState(true),
      currentQuestionIndex: 4,
      userAnswer: 'wrong',
      incorrectAnswer: 'wrong',
      answerSaveMessage: 'saved' as const,
      grammarSessionXp: 30,
      grammarTotalXp: 240,
      lastGrammarXpGain: 10,
      isComplete: true,
      gameModeJustUnlocked: true,
      completionUnlockResolved: true,
      lives: 1,
      isGameOver: true,
      sessionMistakeCount: 5,
    };

    const next = grammarSessionReducer(dirtyState, {
      type: 'RESET_SESSION',
      questions,
      gameMode: false,
    });

    expect(next).toEqual({
      ...createGrammarSessionState(false),
      selectedQuestions: questions,
      grammarTotalXp: 240,
    });
  });

  it('advances after a correct answer and completes only after the final question', () => {
    let state = grammarSessionReducer(createGrammarSessionState(false), {
      type: 'RESET_SESSION',
      questions,
      gameMode: false,
    });
    state = grammarSessionReducer(state, { type: 'START_ANSWER', answer: 'one' });
    state = grammarSessionReducer(state, {
      type: 'SAVE_CORRECT_ANSWER',
      saveMessage: 'saved',
      xpGain: 10,
      totalXp: 110,
    });

    expect(state).toMatchObject({
      userAnswer: 'one',
      answerSaveMessage: 'saved',
      grammarSessionXp: 10,
      grammarTotalXp: 110,
      lastGrammarXpGain: 10,
    });

    state = grammarSessionReducer(state, { type: 'FINISH_CORRECT_ANSWER' });
    expect(state).toMatchObject({ currentQuestionIndex: 1, userAnswer: '', isComplete: false });

    state = grammarSessionReducer(state, { type: 'START_ANSWER', answer: 'two' });
    state = grammarSessionReducer(state, { type: 'FINISH_CORRECT_ANSWER' });
    expect(state).toMatchObject({ currentQuestionIndex: 1, isComplete: true, isGameMode: false });
  });

  it('applies life loss and game-over recovery consistently', () => {
    let state = grammarSessionReducer(createGrammarSessionState(true), {
      type: 'RESET_SESSION',
      questions,
      gameMode: true,
    });

    for (let index = 0; index < GRAMMAR_GAME_LIVES; index += 1) {
      state = grammarSessionReducer(state, { type: 'MARK_INCORRECT', marker: `wrong-${index}` });
    }

    expect(state).toMatchObject({
      lives: 0,
      isGameOver: true,
      sessionMistakeCount: GRAMMAR_GAME_LIVES,
    });

    state = grammarSessionReducer(state, { type: 'RESET_AFTER_GAME_OVER' });
    expect(state).toMatchObject({
      currentQuestionIndex: 0,
      lives: GRAMMAR_GAME_LIVES,
      userAnswer: '',
      incorrectAnswer: '',
      isGameOver: false,
      sessionMistakeCount: GRAMMAR_GAME_LIVES,
    });
  });

  it('starts Game Mode from a clean ten-question challenge session', () => {
    const previous = {
      ...createGrammarSessionState(false),
      grammarTotalXp: 500,
      grammarSessionXp: 20,
      isComplete: true,
      sessionMistakeCount: 2,
    };

    const next = grammarSessionReducer(previous, { type: 'START_CHALLENGE', questions });

    expect(next).toMatchObject({
      selectedQuestions: questions,
      currentQuestionIndex: 0,
      grammarTotalXp: 500,
      grammarSessionXp: 0,
      isComplete: false,
      isGameMode: true,
      startedGameMode: true,
      lives: GRAMMAR_GAME_LIVES,
      sessionMistakeCount: 0,
    });
  });
});
